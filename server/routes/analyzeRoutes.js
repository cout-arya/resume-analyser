const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { getSessionTexts } = require('../controllers/analyzeController');
const { calculateATSScore } = require('../services/atsScoringService');
const { analyzeSkillGap } = require('../services/skillGapService');

// Protect all analysis routes
router.use(authMiddleware);

/**
 * POST /api/analyze/score
 * Calculate ATS score for resume vs job description.
 * Body: { sessionId: string }
 */
router.post('/score', async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        const texts = getSessionTexts(sessionId);
        if (!texts) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const { resumeText, jdText } = texts;
        if (!resumeText || !jdText) {
            return res.status(400).json({
                error: 'Both resume and job description must be uploaded before scoring'
            });
        }

        const result = await calculateATSScore(resumeText, jdText);
        res.json(result);

    } catch (error) {
        console.error('ATS scoring error:', error);
        res.status(500).json({ error: 'Failed to calculate ATS score' });
    }
});

/**
 * POST /api/analyze/skills
 * Analyze skill gaps between resume and job description.
 * Body: { sessionId: string }
 */
router.post('/skills', async (req, res) => {
    try {
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required' });
        }

        const texts = getSessionTexts(sessionId);
        if (!texts) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const { resumeText, jdText } = texts;
        if (!resumeText || !jdText) {
            return res.status(400).json({
                error: 'Both resume and job description must be uploaded before analysis'
            });
        }

        const result = await analyzeSkillGap(resumeText, jdText);
        res.json(result);

    } catch (error) {
        console.error('Skill gap analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze skill gaps' });
    }
});

module.exports = router;
