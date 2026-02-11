const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    sessionId: String,
    filename: String,
    type: { type: String, enum: ['resume', 'jd', 'unknown'] },
    docId: String, // Reference to vector store ID
    fileSize: Number,
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
