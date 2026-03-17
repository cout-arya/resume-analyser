const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadHandler, chatHandler } = require('../controllers/analyzeController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Protect all routes
router.use(authMiddleware);

router.post('/upload', upload.single('file'), uploadHandler);
router.post('/chat', chatHandler);

module.exports = router;
