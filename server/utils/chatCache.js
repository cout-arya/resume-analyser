const { safeGet, safeSet, safeDel } = require('./redisClient');

// TTL: 2 hours — conversations are short-lived in the context of a session
const CHAT_TTL = 60 * 60 * 2;

/**
 * Build a Redis key for a session's conversation history.
 * Pattern: chat:{sessionId}
 */
function buildKey(sessionId) {
    return `chat:${sessionId}`;
}

/**
 * Get the conversation history for a session from Redis.
 * Returns an array of { role, content } objects, or null on miss.
 */
async function getChatHistory(sessionId) {
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
 * Persist the full conversation history array to Redis.
 * Resets the TTL on every write.
 *
 * @param {string} sessionId
 * @param {Array<{role: string, content: string}>} history
 */
async function setChatHistory(sessionId, history) {
    await safeSet(buildKey(sessionId), JSON.stringify(history), CHAT_TTL);
}

/**
 * Remove the chat history cache entry for a session.
 */
async function invalidateChatHistory(sessionId) {
    await safeDel(buildKey(sessionId));
}

module.exports = {
    getChatHistory,
    setChatHistory,
    invalidateChatHistory,
};
