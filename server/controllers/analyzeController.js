const { v4: uuidv4 } = require('uuid');
const { extractText } = require('../utils/textExtractor');
const vectorStore = require('../utils/vectorStore');
const axios = require('axios');
const Session = require('../models/Session');
const { getSessionCache, setSessionCache, invalidateSessionCache } = require('../utils/sessionCache');
const { invalidateAnalysisCache } = require('../utils/analysisCache');
const { getChatHistory, setChatHistory } = require('../utils/chatCache');

// ─── Session Helpers ─────────────────────────────────────────────────────────

/**
 * Get a session from MongoDB, verifying it belongs to the requesting user.
 * Returns the session document or null.
 */
async function getSession(sessionId, userId) {
    const session = await Session.findOne({ sessionId });
    if (!session) return null;
    // Security: verify ownership
    if (session.userId.toString() !== userId.toString()) return null;
    return session;
}

/**
 * Retrieve the raw resume and JD text for a session.
 * Cache hierarchy: Redis session cache → MongoDB
 * Used by analyzeRoutes for ATS scoring, skill gap analysis, and interview prep.
 */
async function getSessionTexts(sessionId, userId) {
    // ── 1. Redis fast path ────────────────────────────────────────────────────
    const cached = await getSessionCache(sessionId);
    if (cached) {
        // Verify ownership using cached userId
        if (cached.userId !== userId.toString()) return null;

        let resumeText = null;
        let jdText = null;
        for (const file of cached.files) {
            if (file.type === 'resume' && file.text) resumeText = file.text;
            if (file.type === 'jd' && file.text) jdText = file.text;
        }
        return { resumeText, jdText };
    }

    // ── 2. MongoDB fallback ───────────────────────────────────────────────────
    const session = await getSession(sessionId, userId);
    if (!session) return null;

    // Backfill Redis for subsequent calls
    await setSessionCache(sessionId, session);

    let resumeText = null;
    let jdText = null;

    for (const file of session.files) {
        if (file.type === 'resume' && file.text) resumeText = file.text;
        if (file.type === 'jd' && file.text) jdText = file.text;
    }

    return { resumeText, jdText };
}

// ─── Upload Handler ──────────────────────────────────────────────────────────

exports.uploadHandler = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.user.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Extract text from file
        const text = await extractText(file.buffer, file.mimetype);
        const type = req.body.type || 'unknown';

        // Add to vector store
        const docId = uuidv4();
        await vectorStore.addDocument(docId, text, type);

        const fileInfo = {
            docId,
            filename: file.originalname,
            type,
            text,
            fileSize: file.size,
            uploadedAt: new Date()
        };

        let currentSessionId = sessionId;

        if (currentSessionId) {
            // Verify existing session belongs to this user
            const existing = await Session.findOne({ sessionId: currentSessionId });
            if (existing && existing.userId.toString() !== userId.toString()) {
                return res.status(403).json({ error: 'Access denied — this session belongs to another user' });
            }

            if (existing) {
                // Push file to existing session + invalidate cached analysis
                existing.files.push(fileInfo);
                existing.cachedAtsData = null;
                existing.cachedSkillGapData = null;
                existing.cachedInterviewData = null;
                existing.lastActiveAt = new Date();
                await existing.save();

                // Invalidate Redis caches: session metadata + all analysis results
                await Promise.all([
                    invalidateSessionCache(currentSessionId),
                    invalidateAnalysisCache(currentSessionId),
                ]);
            } else {
                // sessionId provided but not found — create new
                const newSession = await Session.create({
                    sessionId: currentSessionId,
                    userId,
                    files: [fileInfo],
                    lastActiveAt: new Date()
                });
                // Prime Redis session cache immediately
                await setSessionCache(currentSessionId, newSession);
            }
        } else {
            // No sessionId — generate a new session
            currentSessionId = uuidv4();
            const newSession = await Session.create({
                sessionId: currentSessionId,
                userId,
                files: [fileInfo],
                lastActiveAt: new Date()
            });
            // Prime Redis session cache immediately
            await setSessionCache(currentSessionId, newSession);
        }

        res.json({
            success: true,
            sessionId: currentSessionId,
            document: {
                docId: fileInfo.docId,
                filename: fileInfo.filename,
                type: fileInfo.type,
                uploadedAt: fileInfo.uploadedAt
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process file', detail: error.message });
    }
};

// ─── Chat Handler ────────────────────────────────────────────────────────────

exports.chatHandler = async (req, res) => {
    try {
        const { sessionId, question, conversationHistory: incomingHistory } = req.body;
        const userId = req.user.id;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        const session = await getSession(sessionId, userId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found or access denied' });
        }

        const docIds = session.files.map(f => f.docId);
        if (docIds.length === 0) {
            return res.status(400).json({ error: 'No documents uploaded in this session' });
        }

        // 1. Retrieve context from vector store
        const contextChunks = await vectorStore.search(question, docIds, 5);

        // 2. Format context for LLM
        const contextText = contextChunks.map(c =>
            `[${c.docType.toUpperCase()}] ${c.text}`
        ).join('\n\n');

        // 3. Build messages array with conversation threading
        const systemPrompt = `You are an expert career advisor analyzing a resume and job description.
Answer the user's question based ONLY on the provided context.

Context:
${contextText}

Instructions:
- Provide a helpful, constructive answer.
- Cite specific details from the context.
- If information is missing, state that clearly.`;

        // Use incoming conversation history (cap at last 10 turns = 20 messages)
        let history = Array.isArray(incomingHistory) ? incomingHistory : [];
        if (history.length > 20) {
            history = history.slice(history.length - 20);
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.map(h => ({ role: h.role, content: h.content })),
            { role: 'user', content: question }
        ];

        // 4. Call LLM
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'meta-llama/llama-3.3-70b-instruct',
                messages
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': process.env.APP_URL || 'http://localhost:5000',
                    'X-Title': 'Resume Analyzer'
                }
            }
        );

        const answer = response.data.choices[0].message.content;

        // 5. Build updated conversation history
        const updatedHistory = [
            ...history,
            { role: 'user', content: question },
            { role: 'assistant', content: answer }
        ];

        // Cap at 20 messages (10 turns)
        const cappedHistory = updatedHistory.length > 20
            ? updatedHistory.slice(updatedHistory.length - 20)
            : updatedHistory;

        // 6. Persist conversation history:
        //    - Redis: immediate (fast, used for next request's history)
        //    - MongoDB: async write (persistence, survives Redis restart)
        await setChatHistory(sessionId, cappedHistory);

        // Fire-and-forget Mongo write — don't block the response
        Session.updateOne(
            { _id: session._id },
            {
                $set: {
                    conversationHistory: cappedHistory.map(h => ({
                        role: h.role,
                        content: h.content,
                        timestamp: new Date()
                    })),
                    lastActiveAt: new Date()
                }
            }
        ).catch(err => console.error('[Chat] MongoDB history write error:', err));

        // 7. Compute top relevance score from citations
        const topRelevanceScore = contextChunks.length > 0
            ? Math.round(contextChunks[0].score * 100) / 100
            : 0;

        res.json({
            answer,
            topRelevanceScore,
            citations: contextChunks,
            conversationHistory: cappedHistory
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to generate answer' });
    }
};

// ─── Session Management ─────────────────────────────────────────────────────

/**
 * List all sessions for the authenticated user.
 */
exports.listSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const sessions = await Session.find({ userId })
            .sort({ lastActiveAt: -1 })
            .limit(20)
            .select('sessionId files.filename files.type createdAt lastActiveAt');

        res.json(sessions);
    } catch (error) {
        console.error('List sessions error:', error);
        res.status(500).json({ error: 'Failed to list sessions' });
    }
};

/**
 * Delete a session and its vectors.
 */
exports.deleteSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sessionId } = req.params;

        const session = await Session.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        if (session.userId.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await Session.deleteOne({ sessionId });

        // Clean up Redis keys for this session
        await Promise.all([
            invalidateSessionCache(sessionId),
            invalidateAnalysisCache(sessionId),
        ]);

        res.json({ success: true, message: 'Session deleted' });
    } catch (error) {
        console.error('Delete session error:', error);
        res.status(500).json({ error: 'Failed to delete session' });
    }
};

exports.getSessionTexts = getSessionTexts;
