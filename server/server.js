require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const analyzeRoutes = require('./routes/analyzeRoutes');
const reportRoutes = require('./routes/reportRoutes');
const coverLetterRoutes = require('./routes/coverLetter');
const path = require('path');
const { getClient, isRedisAvailable } = require('./utils/redisClient');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Redis Initialization ────────────────────────────────────────────────────
// Eagerly connect so the client is ready before the first request.
// Graceful degradation: if Redis is unreachable the app still works via MongoDB.
const redisClient = getClient();

/**
 * Build a rate-limit store.
 * Uses Redis when available, falls back to in-memory store otherwise.
 */
function buildRateLimitStore(prefix) {
    if (isRedisAvailable()) {
        return new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
            prefix: `rl:${prefix}:`,
        });
    }
    // ioredis is still connecting at startup — return undefined so
    // express-rate-limit uses its default in-memory store.
    return undefined;
}

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
// Redis-backed stores survive server restarts. Falls back to in-memory on
// Redis unavailability (graceful degradation).
const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 500,                   // 500 requests per hour (general API)
    standardHeaders: true,
    legacyHeaders: false,
    store: buildRateLimitStore('api'),
    message: { error: 'Too many requests. Please try again in an hour.' }
});

// Stricter limit for LLM-heavy endpoints (score, skills, interview-prep, chat)
const analyzeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 50,                    // 50 LLM calls per hour
    standardHeaders: true,
    legacyHeaders: false,
    store: buildRateLimitStore('analyze'),
    message: { error: 'Too many analysis requests. Please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 20,                    // 20 attempts per 15 min
    store: buildRateLimitStore('auth'),
    message: { error: 'Too many login attempts. Please wait 15 minutes.' }
});

app.use('/api/auth/', authLimiter);
app.use('/api/analyze/score', analyzeLimiter);
app.use('/api/analyze/skills', analyzeLimiter);
app.use('/api/analyze/interview-prep', analyzeLimiter);
app.use('/api/analyze/suggestions', analyzeLimiter);
app.use('/api/chat', analyzeLimiter);
app.use('/api/cover-letter/generate', analyzeLimiter);
app.use('/api/', apiLimiter);

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/report', reportRoutes);
app.use('/api/cover-letter', coverLetterRoutes);


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
