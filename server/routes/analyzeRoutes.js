const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getSessionTexts } = require('../controllers/analyzeController');
const { calculateATSScore } = require('../services/atsScoringService');
const { analyzeSkillGap } = require('../services/skillGapService');
const { generateInterviewQuestions } = require('../services/interviewPrepService');
const { generateSuggestions } = require('../services/suggestionService');
const Session = require('../models/Session');
const { getAnalysisCache, setAnalysisCache, TYPES } = require('../utils/analysisCache');
const { getChatHistory } = require('../utils/chatCache');

// Protect all analysis routes
router.use(authMiddleware);

/**
 * GET /api/analyze/cached/:sessionId
 * Return all cached analysis data for a session (instant, no LLM calls).
 * Cache hierarchy: Redis (fast) → MongoDB (persistent fallback)
 */
router.get('/cached/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        // ── 1. Try Redis first for all three analysis types ──────────────────
        const [redisAts, redisSkill, redisInterview, redisChatRaw] = await Promise.all([
            getAnalysisCache(sessionId, TYPES.ats),
            getAnalysisCache(sessionId, TYPES.skillGap),
            getAnalysisCache(sessionId, TYPES.interview),
            getChatHistory(sessionId),
        ]);

        const allFromRedis = redisAts || redisSkill || redisInterview || redisChatRaw;

        if (allFromRedis) {
            // At least some Redis data available — still need Mongo for any missing pieces
            // and to verify ownership.
            const session = await Session.findOne({ sessionId })
                .select('userId files cachedAtsData cachedSkillGapData cachedInterviewData conversationHistory suggestions');

            if (!session || session.userId.toString() !== userId.toString()) {
                return res.status(404).json({ error: 'Session not found or access denied' });
            }

            // Extract raw texts from session files for cover letter etc.
            let resumeText = null;
            let jdText = null;
            if (session.files) {
                for (const file of session.files) {
                    if (file.type === 'resume' && file.text) resumeText = file.text;
                    if (file.type === 'jd' && file.text) jdText = file.text;
                }
            }

            return res.json({
                atsData: redisAts || session.cachedAtsData || null,
                skillGapData: redisSkill || session.cachedSkillGapData || null,
                interviewData: redisInterview || session.cachedInterviewData || null,
                conversationHistory: redisChatRaw || (session.conversationHistory || []).map(h => ({
                    role: h.role,
                    content: h.content
                })),
                suggestionsData: session.suggestions && session.suggestions.length > 0 ? { suggestions: session.suggestions } : null,
                resumeText,
                jdText,
                source: 'redis',
            });
        }

        // ── 2. Redis miss — fall back to MongoDB ─────────────────────────────
        const session = await Session.findOne({ sessionId });
        if (!session || session.userId.toString() !== userId.toString()) {
            return res.status(404).json({ error: 'Session not found or access denied' });
        }

        // Extract raw texts from session files for cover letter etc.
        let resumeText = null;
        let jdText = null;
        if (session.files) {
            for (const file of session.files) {
                if (file.type === 'resume' && file.text) resumeText = file.text;
                if (file.type === 'jd' && file.text) jdText = file.text;
            }
        }

        res.json({
            atsData: session.cachedAtsData || null,
            skillGapData: session.cachedSkillGapData || null,
            interviewData: session.cachedInterviewData || null,
            suggestionsData: session.suggestions && session.suggestions.length > 0 ? { suggestions: session.suggestions } : null,
            conversationHistory: (session.conversationHistory || []).map(h => ({
                role: h.role,
                content: h.content
            })),
            resumeText,
            jdText,
            source: 'mongodb',
        });

    } catch (error) {
        console.error('Cached data fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch cached data' });
    }
});

/**
 * POST /api/analyze/score
 * Calculate ATS score for resume vs job description.
 * Cache hierarchy: Redis → MongoDB → LLM (generate + cache both)
 */
router.post('/score', async (req, res) => {
    try {
        const { sessionId, forceRefresh } = req.body;
        const userId = req.user.id;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        // ── 1. Redis fast path ────────────────────────────────────────────────
        if (!forceRefresh) {
            const redisResult = await getAnalysisCache(sessionId, TYPES.ats);
            if (redisResult) {
                console.log(`[ATS] Redis HIT for session ${sessionId}`);
                return res.json(redisResult);
            }
        }

        // ── 2. MongoDB fallback ───────────────────────────────────────────────
        if (!forceRefresh) {
            const session = await Session.findOne({ sessionId });
            if (session && session.userId.toString() === userId.toString() && session.cachedAtsData) {
                console.log(`[ATS] MongoDB cache HIT for session ${sessionId}`);
                // Backfill Redis for faster subsequent reads
                await setAnalysisCache(sessionId, TYPES.ats, session.cachedAtsData);
                return res.json(session.cachedAtsData);
            }
        }

        // ── 3. Generate via LLM ───────────────────────────────────────────────
        const texts = await getSessionTexts(sessionId, userId);
        if (!texts) {
            return res.status(404).json({ error: 'Session not found or access denied' });
        }

        const { resumeText, jdText } = texts;
        if (!resumeText || !jdText) {
            return res.status(400).json({
                error: 'Both resume and job description must be uploaded before scoring'
            });
        }

        const result = await calculateATSScore(resumeText, jdText);

        // ── 4. Dual write: Redis + MongoDB ────────────────────────────────────
        await Promise.all([
            setAnalysisCache(sessionId, TYPES.ats, result),
            Session.updateOne(
                { sessionId },
                { $set: { cachedAtsData: result, lastActiveAt: new Date() } }
            ),
        ]);

        res.json(result);

    } catch (error) {
        console.error('ATS scoring error:', error);
        res.status(500).json({ error: 'Failed to calculate ATS score' });
    }
});

/**
 * POST /api/analyze/skills
 * Analyze skill gaps between resume and job description.
 * Cache hierarchy: Redis → MongoDB → LLM (generate + cache both)
 */
router.post('/skills', async (req, res) => {
    try {
        const { sessionId, forceRefresh } = req.body;
        const userId = req.user.id;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        // ── 1. Redis fast path ────────────────────────────────────────────────
        if (!forceRefresh) {
            const redisResult = await getAnalysisCache(sessionId, TYPES.skillGap);
            if (redisResult) {
                console.log(`[SkillGap] Redis HIT for session ${sessionId}`);
                return res.json(redisResult);
            }
        }

        // ── 2. MongoDB fallback ───────────────────────────────────────────────
        if (!forceRefresh) {
            const session = await Session.findOne({ sessionId });
            if (session && session.userId.toString() === userId.toString() && session.cachedSkillGapData) {
                console.log(`[SkillGap] MongoDB cache HIT for session ${sessionId}`);
                await setAnalysisCache(sessionId, TYPES.skillGap, session.cachedSkillGapData);
                return res.json(session.cachedSkillGapData);
            }
        }

        // ── 3. Generate via LLM ───────────────────────────────────────────────
        const texts = await getSessionTexts(sessionId, userId);
        if (!texts) {
            return res.status(404).json({ error: 'Session not found or access denied' });
        }

        const { resumeText, jdText } = texts;
        if (!resumeText || !jdText) {
            return res.status(400).json({
                error: 'Both resume and job description must be uploaded before analysis'
            });
        }

        const result = await analyzeSkillGap(resumeText, jdText);

        // ── 4. Dual write: Redis + MongoDB ────────────────────────────────────
        await Promise.all([
            setAnalysisCache(sessionId, TYPES.skillGap, result),
            Session.updateOne(
                { sessionId },
                { $set: { cachedSkillGapData: result, lastActiveAt: new Date() } }
            ),
        ]);

        res.json(result);

    } catch (error) {
        console.error('Skill gap analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze skill gaps' });
    }
});

/**
 * POST /api/analyze/interview-prep
 * Generate interview questions based on resume and JD.
 * Cache hierarchy: Redis → MongoDB → LLM (generate + cache both)
 */
router.post('/interview-prep', async (req, res) => {
    try {
        const { sessionId, forceRefresh } = req.body;
        const userId = req.user.id;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        // ── 1. Redis fast path ────────────────────────────────────────────────
        if (!forceRefresh) {
            const redisResult = await getAnalysisCache(sessionId, TYPES.interview);
            if (redisResult) {
                console.log(`[InterviewPrep] Redis HIT for session ${sessionId}`);
                return res.json(redisResult);
            }
        }

        // ── 2. MongoDB fallback ───────────────────────────────────────────────
        if (!forceRefresh) {
            const session = await Session.findOne({ sessionId });
            if (session && session.userId.toString() === userId.toString() && session.cachedInterviewData) {
                console.log(`[InterviewPrep] MongoDB cache HIT for session ${sessionId}`);
                await setAnalysisCache(sessionId, TYPES.interview, session.cachedInterviewData);
                return res.json(session.cachedInterviewData);
            }
        }

        // ── 3. Generate via LLM ───────────────────────────────────────────────
        const texts = await getSessionTexts(sessionId, userId);
        if (!texts) {
            return res.status(404).json({ error: 'Session not found or access denied' });
        }

        const { resumeText, jdText } = texts;
        if (!resumeText || !jdText) {
            return res.status(400).json({
                error: 'Both resume and job description must be uploaded before generating questions'
            });
        }

        const result = await generateInterviewQuestions(resumeText, jdText);

        // ── 4. Dual write: Redis + MongoDB ────────────────────────────────────
        await Promise.all([
            setAnalysisCache(sessionId, TYPES.interview, result),
            Session.updateOne(
                { sessionId },
                { $set: { cachedInterviewData: result, lastActiveAt: new Date() } }
            ),
        ]);

        res.json(result);

    } catch (error) {
        console.error('Interview prep error:', error);
        res.status(500).json({ error: 'Failed to generate interview questions' });
    }
});

/**
 * POST /api/analyze/suggestions
 * Generate resume bullet improvement suggestions via LLM.
 */
router.post('/suggestions', async (req, res) => {
    try {
        const { sessionId, matchedSkills, missingSkills } = req.body;
        const userId = req.user.id;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        const texts = await getSessionTexts(sessionId, userId);
        if (!texts) {
            return res.status(404).json({ error: 'Session not found or access denied' });
        }

        const { resumeText, jdText } = texts;
        if (!resumeText || !jdText) {
            return res.status(400).json({ error: `Backend validation failed: resumeText length is ${resumeText ? resumeText.length : 0}, jdText length is ${jdText ? jdText.length : 0}. Please upload valid documents containing readable text.` });
        }

        // Verify session ownership
        const session = await Session.findOne({ sessionId });
        if (!session || session.userId.toString() !== userId.toString()) {
            return res.status(404).json({ error: 'Session not found or access denied' });
        }

        const result = await generateSuggestions(
            resumeText,
            jdText,
            matchedSkills || [],
            missingSkills || []
        );

        // Persist suggestions to session
        await Session.updateOne(
            { sessionId },
            { $set: { suggestions: result.suggestions, lastActiveAt: new Date() } }
        );

        res.json(result);

    } catch (error) {
        console.error('Suggestion generation error:', error);
        res.status(500).json({ error: 'Failed to generate suggestions' });
    }
});

/**
 * PATCH /api/analyze/suggestions/:sessionId/:suggestionId
 * Toggle accepted status of a suggestion.
 */
router.patch('/suggestions/:sessionId/:suggestionId', async (req, res) => {
    try {
        const { sessionId, suggestionId } = req.params;
        const userId = req.user.id;

        const session = await Session.findOne({ sessionId });
        if (!session || session.userId.toString() !== userId.toString()) {
            return res.status(404).json({ error: 'Session not found or access denied' });
        }

        const suggestion = session.suggestions.find(s => s.id === suggestionId);
        if (!suggestion) {
            return res.status(404).json({ error: 'Suggestion not found' });
        }

        suggestion.accepted = !suggestion.accepted;
        await session.save();

        res.json({ success: true, accepted: suggestion.accepted });

    } catch (error) {
        console.error('Suggestion toggle error:', error);
        res.status(500).json({ error: 'Failed to update suggestion' });
    }
});

module.exports = router;
