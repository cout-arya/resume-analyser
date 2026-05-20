const jwt = require('jsonwebtoken');
const { safeExists } = require('../utils/redisClient');

const ACCESS_SECRET = process.env.JWT_SECRET || 'secret';

/**
 * JWT authentication middleware.
 *
 * Validates Bearer token and optionally checks a Redis access-token blocklist.
 * If Redis is unavailable the check is skipped gracefully.
 */
const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, ACCESS_SECRET);
    } catch (err) {
        return res.status(401).json({ error: 'Token is not valid' });
    }

    // ── Redis blocklist check ─────────────────────────────────────────────────
    // Access tokens are short-lived (1h) so we only block them if explicitly
    // added (e.g. future token rotation feature). Currently the blocklist is
    // primarily used for refresh tokens; this is a defence-in-depth layer.
    const blockedKey = `blocked_access:${decoded.id}:${decoded.iat}`;
    const isBlocked = await safeExists(blockedKey);
    if (isBlocked) {
        return res.status(401).json({ error: 'Token has been revoked' });
    }

    req.user = decoded;
    next();
};

module.exports = authMiddleware;
