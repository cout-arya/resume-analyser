const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadHandler, chatHandler, listSessions, deleteSession } = require('../controllers/analyzeController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Protect all routes
router.use(authMiddleware);

// Document upload
router.post('/upload', upload.single('file'), uploadHandler);

// RAG Q&A chat
router.post('/chat', chatHandler);

// Session management
router.get('/sessions', listSessions);
router.delete('/sessions/:sessionId', deleteSession);

module.exports = router;
