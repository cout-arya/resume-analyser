const Redis = require('ioredis');

let client = null;
let isConnected = false;

/**
 * Singleton Redis client with graceful degradation.
 * If Redis is unavailable, all cache operations become no-ops and the
 * application falls back to MongoDB seamlessly — no crash.
 */
function getClient() {
    if (client) return client;

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    client = new Redis(redisUrl, {
        // Reconnect strategy: exponential backoff capped at 10s
        retryStrategy(times) {
            if (times > 10) {
                console.warn('[Redis] Max reconnect attempts reached. Operating without cache.');
                return null; // stop retrying
            }
            return Math.min(times * 200, 10000);
        },
        // Don't throw on connection failure — let app continue
        lazyConnect: false,
        enableReadyCheck: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 5000,
    });

    client.on('connect', () => {
        isConnected = true;
        console.log('[Redis] Connected ✓');
    });

    client.on('ready', () => {
        isConnected = true;
    });

    client.on('error', (err) => {
        isConnected = false;
        // Only log unique errors, not every reconnect attempt
        if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
            console.warn(`[Redis] Unavailable — app running without cache (${err.code})`);
        }
    });

    client.on('close', () => {
        isConnected = false;
    });

    return client;
}

/**
 * Check if Redis is currently connected and usable.
 */
function isRedisAvailable() {
    return isConnected && client && client.status === 'ready';
}

/**
 * Safe GET — returns null if Redis is down.
 */
async function safeGet(key) {
    if (!isRedisAvailable()) return null;
    try {
        return await client.get(key);
    } catch {
        return null;
    }
}

/**
 * Safe SET with optional TTL (seconds).
 */
async function safeSet(key, value, ttlSeconds = null) {
    if (!isRedisAvailable()) return false;
    try {
        if (ttlSeconds) {
            await client.set(key, value, 'EX', ttlSeconds);
        } else {
            await client.set(key, value);
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * Safe DEL — deletes one or more keys.
 */
async function safeDel(...keys) {
    if (!isRedisAvailable()) return false;
    try {
        await client.del(...keys);
        return true;
    } catch {
        return false;
    }
}

/**
 * Safe EXISTS — checks if a key exists.
 */
async function safeExists(key) {
    if (!isRedisAvailable()) return false;
    try {
        const result = await client.exists(key);
        return result === 1;
    } catch {
        return false;
    }
}

module.exports = {
    getClient,
    isRedisAvailable,
    safeGet,
    safeSet,
    safeDel,
    safeExists,
};
