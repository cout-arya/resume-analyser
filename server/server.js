require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const analyzeRoutes = require('./routes/analyzeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS Configuration ─────────────────────────────────────────────────────
const corsOptions = {
    origin: true, // Reflects the requesting origin (allows all origins safely with credentials)
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// ─── Body Parser ─────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 500,                   // 500 requests per hour (general API)
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again in an hour.' }
});

// Stricter limit for LLM-heavy endpoints (score, skills, interview-prep, chat)
const analyzeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 50,                    // 50 LLM calls per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many analysis requests. Please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 20,                    // 20 attempts per 15 min
    message: { error: 'Too many login attempts. Please wait 15 minutes.' }
});

app.use('/api/auth/', authLimiter);
app.use('/api/analyze/score', analyzeLimiter);
app.use('/api/analyze/skills', analyzeLimiter);
app.use('/api/analyze/interview-prep', analyzeLimiter);
app.use('/api/chat', analyzeLimiter);
app.use('/api/', apiLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/report', reportRoutes);

// ─── Database Connection ─────────────────────────────────────────────────────
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('MongoDB connected'))
        .catch(err => console.error('MongoDB connection error:', err));
} else {
    console.log('MONGO_URI not set, skipping database connection');
}

// Basic Health Check
app.get('/', (req, res) => {
    res.send('JDFit API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
