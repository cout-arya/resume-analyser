const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getSessionTexts } = require('../controllers/analyzeController');
const { calculateATSScore } = require('../services/atsScoringService');
const { analyzeSkillGap } = require('../services/skillGapService');
const { generateInterviewQuestions } = require('../services/interviewPrepService');
const Session = require('../models/Session');

// Protect all analysis routes
router.use(authMiddleware);

/**
 * GET /api/analyze/cached/:sessionId
 * Return all cached analysis data for a session (instant, no LLM calls).
 * Used on session load / page navigation to restore previous results.
 */
router.get('/cached/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        const session = await Session.findOne({ sessionId });
        if (!session || session.userId.toString() !== userId.toString()) {
            return res.status(404).json({ error: 'Session not found or access denied' });
        }

        res.json({
            atsData: session.cachedAtsData || null,
            skillGapData: session.cachedSkillGapData || null,
            interviewData: session.cachedInterviewData || null,
            conversationHistory: (session.conversationHistory || []).map(h => ({
                role: h.role,
                content: h.content
            }))
        });
    } catch (error) {
        console.error('Cached data fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch cached data' });
    }
});

/**
 * POST /api/analyze/score
 * Calculate ATS score for resume vs job description.
 * Returns cached result if available, otherwise generates and caches.
 * Body: { sessionId: string, forceRefresh?: boolean }
 */
router.post('/score', async (req, res) => {
    try {
        const { sessionId, forceRefresh } = req.body;
        const userId = req.user.id;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        // Check for cached data first
        if (!forceRefresh) {
            const session = await Session.findOne({ sessionId });
            if (session && session.userId.toString() === userId.toString() && session.cachedAtsData) {
                console.log(`[ATS] Returning cached result for session ${sessionId}`);
                return res.json(session.cachedAtsData);
            }
        }

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

        // Cache the result in MongoDB
        await Session.updateOne(
            { sessionId },
            { $set: { cachedAtsData: result, lastActiveAt: new Date() } }
        );

        res.json(result);

    } catch (error) {
        console.error('ATS scoring error:', error);
        res.status(500).json({ error: 'Failed to calculate ATS score' });
    }
});

/**
 * POST /api/analyze/skills
 * Analyze skill gaps between resume and job description.
 * Returns cached result if available, otherwise generates and caches.
 * Body: { sessionId: string, forceRefresh?: boolean }
 */
router.post('/skills', async (req, res) => {
    try {
        const { sessionId, forceRefresh } = req.body;
        const userId = req.user.id;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        // Check for cached data first
        if (!forceRefresh) {
            const session = await Session.findOne({ sessionId });
            if (session && session.userId.toString() === userId.toString() && session.cachedSkillGapData) {
                console.log(`[SkillGap] Returning cached result for session ${sessionId}`);
                return res.json(session.cachedSkillGapData);
            }
        }

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

        // Cache the result in MongoDB
        await Session.updateOne(
            { sessionId },
            { $set: { cachedSkillGapData: result, lastActiveAt: new Date() } }
        );

        res.json(result);

    } catch (error) {
        console.error('Skill gap analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze skill gaps' });
    }
});

/**
 * POST /api/analyze/interview-prep
 * Generate interview questions based on resume and JD.
 * Returns cached result if available, otherwise generates and caches.
 * Body: { sessionId: string, forceRefresh?: boolean }
 */
router.post('/interview-prep', async (req, res) => {
    try {
        const { sessionId, forceRefresh } = req.body;
        const userId = req.user.id;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        // Check for cached data first
        if (!forceRefresh) {
            const session = await Session.findOne({ sessionId });
            if (session && session.userId.toString() === userId.toString() && session.cachedInterviewData) {
                console.log(`[InterviewPrep] Returning cached result for session ${sessionId}`);
                return res.json(session.cachedInterviewData);
            }
        }

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

        // Cache the result in MongoDB
        await Session.updateOne(
            { sessionId },
            { $set: { cachedInterviewData: result, lastActiveAt: new Date() } }
        );

        res.json(result);

    } catch (error) {
        console.error('Interview prep error:', error);
        res.status(500).json({ error: 'Failed to generate interview questions' });
    }
});

module.exports = router;
