const { safeGet, safeSet, safeDel } = require('./redisClient');

// TTL: 2 hours — session metadata is lightweight and frequently accessed
const SESSION_TTL = 60 * 60 * 2;

/**
 * Build a Redis key for session metadata.
 * Pattern: session:{sessionId}
 */
function buildKey(sessionId) {
    return `session:${sessionId}`;
}

/**
 * Get cached session metadata (userId, files list) from Redis.
 * Returns the parsed object, or null on miss.
 */
async function getSessionCache(sessionId) {
    const key = buildKey(sessionId);
    const raw = await safeGet(key);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/**
 * Store session metadata in Redis.
 * Only caches lightweight fields — not the full Mongo doc.
 *
 * @param {string} sessionId
 * @param {Object} sessionDoc — Mongoose Session document
 */
async function setSessionCache(sessionId, sessionDoc) {
    const payload = {
        sessionId: sessionDoc.sessionId,
        userId: sessionDoc.userId.toString(),
        files: sessionDoc.files.map(f => ({
            docId: f.docId,
            filename: f.filename,
            type: f.type,
            text: f.text,           // needed by getSessionTexts
            uploadedAt: f.uploadedAt,
        })),
    };
    await safeSet(buildKey(sessionId), JSON.stringify(payload), SESSION_TTL);
}

/**
 * Remove the session cache entry.
 * Called on file upload (session content changed) or session deletion.
 */
async function invalidateSessionCache(sessionId) {
    await safeDel(buildKey(sessionId));
}

module.exports = {
    getSessionCache,
    setSessionCache,
    invalidateSessionCache,
};
