const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { generateHandler, downloadPDFHandler } = require('../controllers/coverLetterController');

// Protect all cover letter routes
router.use(authMiddleware);

/**
 * POST /api/cover-letter/generate
 * Stream cover letter generation via SSE.
 */
router.post('/generate', generateHandler);

/**
 * POST /api/cover-letter/download-pdf
 * Generate and download cover letter as PDF.
 */
router.post('/download-pdf', downloadPDFHandler);

module.exports = router;
