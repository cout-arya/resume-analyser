const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { generateReport } = require('../services/reportService');

router.use(authMiddleware);

/**
 * POST /api/report/generate
 * Generate a PDF analysis report.
 * Body: { sessionId, atsScore, skillGap, conversationHistory, interviewPrep?,
 *         resumeFilename?, jdFilename? }
 * Response: PDF binary stream
 */
router.post('/generate', async (req, res) => {
    try {
        const {
            atsScore,
            skillGap,
            conversationHistory,
            interviewPrep,
            resumeFilename,
            jdFilename
        } = req.body;

        const doc = generateReport({
            atsScore,
            skillGap,
            conversationHistory: conversationHistory || [],
            interviewPrep: interviewPrep || null,
            resumeFilename: resumeFilename || 'Resume',
            jdFilename: jdFilename || 'Job Description'
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="analysis-report.pdf"');

        doc.pipe(res);
    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

module.exports = router;
