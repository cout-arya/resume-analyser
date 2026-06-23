const { generateCoverLetterStream, generateCoverLetterPDF } = require('../services/coverLetterService');
const Session = require('../models/Session');

/**
 * Cover Letter Controller
 * Handles SSE streaming generation and PDF download.
 */

/**
 * POST /api/cover-letter/generate
 * Stream cover letter generation via SSE.
 */
exports.generateHandler = async (req, res) => {
    try {
        const { sessionId, resumeText, jobDescription, companyName, jobTitle, tone, personalNotes } = req.body;
        const userId = req.user.id;

        if (!sessionId || !resumeText || !jobDescription) {
            return res.status(400).json({ error: 'Session ID, resume text, and job description are required' });
        }

        const validTones = ['formal', 'confident', 'concise'];
        const selectedTone = validTones.includes(tone) ? tone : 'formal';

        // Verify session ownership
        const session = await Session.findOne({ sessionId });
        if (!session || session.userId.toString() !== userId.toString()) {
            return res.status(404).json({ error: 'Session not found or access denied' });
        }

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');

        let fullText = '';

        const streamResponse = await generateCoverLetterStream(
            resumeText, jobDescription, companyName, jobTitle, selectedTone, personalNotes
        );

        streamResponse.data.on('data', (chunk) => {
            const lines = chunk.toString().split('\n').filter(l => l.trim() !== '');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        res.write(`data: [DONE]\n\n`);
                        return;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content;
                        if (content) {
                            fullText += content;
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch {
                        // Skip unparseable chunks
                    }
                }
            }
        });

        streamResponse.data.on('end', async () => {
            // Persist to session
            try {
                await Session.updateOne(
                    { sessionId },
                    { $set: { coverLetter: fullText, lastActiveAt: new Date() } }
                );
            } catch (err) {
                console.error('[CoverLetter] MongoDB save error:', err);
            }
            res.end();
        });

        streamResponse.data.on('error', (err) => {
            console.error('Stream error:', err);
            res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
            res.end();
        });

        // Handle client disconnect
        req.on('close', () => {
            streamResponse.data.destroy();
        });

    } catch (error) {
        console.error('Cover letter generation error:', error);
        // If headers haven't been sent, return JSON error
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate cover letter' });
        } else {
            res.write(`data: ${JSON.stringify({ error: 'Generation failed' })}\n\n`);
            res.end();
        }
    }
};

/**
 * POST /api/cover-letter/download-pdf
 * Generate and download cover letter as PDF.
 */
exports.downloadPDFHandler = async (req, res) => {
    try {
        const { text, companyName, jobTitle, tone } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Cover letter text is required' });
        }

        const doc = generateCoverLetterPDF(text, { companyName, jobTitle, tone });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="cover-letter-${(companyName || 'draft').toLowerCase().replace(/\s+/g, '-')}.pdf"`);

        doc.pipe(res);

    } catch (error) {
        console.error('Cover letter PDF error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
};
