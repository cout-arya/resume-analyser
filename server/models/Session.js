const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    files: [{
        docId: String,
        filename: String,
        type: { type: String, enum: ['resume', 'jd', 'unknown'] },
        text: String,
        fileSize: Number,
        uploadedAt: { type: Date, default: Date.now }
    }],
    conversationHistory: [{
        role: { type: String, enum: ['user', 'assistant'] },
        content: String,
        timestamp: { type: Date, default: Date.now }
    }],
    // Cached analysis results — avoids re-calling LLM on navigation
    cachedAtsData: { type: mongoose.Schema.Types.Mixed, default: null },
    cachedSkillGapData: { type: mongoose.Schema.Types.Mixed, default: null },
    cachedInterviewData: { type: mongoose.Schema.Types.Mixed, default: null },
    lastActiveAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Session', sessionSchema);
