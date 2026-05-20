const { safeGet, safeSet, safeDel } = require('./redisClient');

// TTL values
const ANALYSIS_TTL = 60 * 60 * 24; // 24 hours

const TYPES = {
    ats: 'ats',
    skillGap: 'skillGap',
    interview: 'interview',
};

/**
 * Build a Redis key for an analysis result.
 * Pattern: analysis:{sessionId}:{type}
 */
function buildKey(sessionId, type) {
    return `analysis:${sessionId}:${type}`;
}

/**
 * Get a cached analysis result from Redis.
 * Returns the parsed object, or null on miss.
 */
async function getAnalysisCache(sessionId, type) {
    const key = buildKey(sessionId, type);
    const raw = await safeGet(key);
    if (!raw) return null;
    try {
        const data = JSON.parse(raw);
        console.log(`[Redis] Cache HIT — ${key}`);
        return data;
    } catch {
        return null;
    }
}

/**
 * Store an analysis result in Redis with a 24-hour TTL.
 */
async function setAnalysisCache(sessionId, type, data) {
    const key = buildKey(sessionId, type);
    const ok = await safeSet(key, JSON.stringify(data), ANALYSIS_TTL);
    if (ok) console.log(`[Redis] Cache SET — ${key} (TTL: ${ANALYSIS_TTL}s)`);
}

/**
 * Invalidate all three analysis caches for a session.
 * Called when new files are uploaded to an existing session.
 */
async function invalidateAnalysisCache(sessionId) {
    await safeDel(
        buildKey(sessionId, TYPES.ats),
        buildKey(sessionId, TYPES.skillGap),
        buildKey(sessionId, TYPES.interview)
    );
    console.log(`[Redis] Invalidated all analysis caches for session ${sessionId}`);
}

module.exports = {
    TYPES,
    getAnalysisCache,
    setAnalysisCache,
    invalidateAnalysisCache,
};
