const { v4: uuidv4 } = require('uuid');
const { extractText } = require('../utils/textExtractor');
const vectorStore = require('../utils/vectorStore');
const axios = require('axios');
const mongoose = require('mongoose');

// In-memory session store for MVP
const sessions = {};

exports.uploadHandler = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Generate or use existing session
        const currentSessionId = sessionId || uuidv4();
        if (!sessions[currentSessionId]) {
            sessions[currentSessionId] = { files: [] };
        }

        // Extract text
        const text = await extractText(file.buffer, file.mimetype);

        // Determine document type based on field name or simple heuristic
        // For MVP, frontend should send 'type' in body: 'resume' or 'jd'
        const type = req.body.type || 'unknown';

        // Add to vector store
        const docId = uuidv4();
        await vectorStore.addDocument(docId, text, type);

        // Track file in session
        const fileInfo = {
            docId,
            filename: file.originalname,
            type,
            uploadedAt: new Date()
        };
        sessions[currentSessionId].files.push(fileInfo);

        // Persist metadata to MongoDB if connected
        if (mongoose.connection.readyState === 1) {
            const Document = require('../models/Document');
            await Document.create({
                sessionId: currentSessionId,
                filename: file.originalname,
                type,
                docId,
                fileSize: file.size
            });
        }

        res.json({
            success: true,
            sessionId: currentSessionId,
            document: fileInfo
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to process file' });
    }
};

exports.chatHandler = async (req, res) => {
    try {
        const { sessionId, question } = req.body;

        if (!sessionId || !sessions[sessionId]) {
            return res.status(400).json({ error: 'Invalid or missing session ID' });
        }

        const sessionFiles = sessions[sessionId].files;
        const docIds = sessionFiles.map(f => f.docId);

        if (docIds.length === 0) {
            return res.status(400).json({ error: 'No documents uploaded in this session' });
        }

        // 1. Retrieve context
        const contextChunks = await vectorStore.search(question, docIds, 5);

        // 2. Format context for LLM
        const contextText = contextChunks.map(c =>
            `[${c.docType.toUpperCase()}] ${c.text}`
        ).join('\n\n');

        // 3. Construct Prompt
        const prompt = `
You are an expert career advisor analyzing a resume and job description.
Answer the user's question based ONLY on the provided context.

Context:
${contextText}

User Question: ${question}

Instructions:
- Provide a helpful, constructive answer.
- Cite specific details from the context.
- If information is missing, state that clearly.
`;

        // 4. Call LLM
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'meta-llama/llama-3.3-70b-instruct',
                messages: [
                    { role: 'system', content: 'You are a helpful AI assistant for resume analysis.' },
                    { role: 'user', content: prompt }
                ]
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

        res.json({
            answer,
            citations: contextChunks
        });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to generate answer' });
    }
};
