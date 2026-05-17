const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

const ACCESS_SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Generate access + refresh token pair.
 */
async function generateTokenPair(user) {
    const accessToken = jwt.sign(
        { id: user._id, username: user.username },
        ACCESS_SECRET,
        { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
        { id: user._id },
        REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    // Store hashed refresh token in DB
    const salt = await bcrypt.genSalt(6);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, salt);
    await user.save();

    return { accessToken, refreshToken };
}

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }
        
        user = new User({ username, email, password });
        await user.save();
        
        const { accessToken, refreshToken } = await generateTokenPair(user);
        res.json({
            accessToken,
            refreshToken,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        
        const { accessToken, refreshToken } = await generateTokenPair(user);
        res.json({
            accessToken,
            refreshToken,
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Refresh access token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        // Verify the refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        } catch (err) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        // Find user and verify stored hash
        const user = await User.findById(decoded.id);
        if (!user || !user.refreshTokenHash) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Refresh token has been revoked' });
        }

        // Issue new access token (keep same refresh token until it expires)
        const accessToken = jwt.sign(
            { id: user._id, username: user.username },
            ACCESS_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ accessToken });
    } catch (err) {
        console.error('Refresh token error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Logout — invalidate refresh token
router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(200).json({ message: 'Logged out' });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        } catch {
            // Token already invalid — still log out
            return res.status(200).json({ message: 'Logged out' });
        }

        // Clear the stored refresh token hash
        await User.findByIdAndUpdate(decoded.id, { refreshTokenHash: null });
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// Google OAuth — verify ID token and issue JWT pair
router.post('/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }

        // Verify the Google ID token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        if (!email) {
            return res.status(400).json({ error: 'Email not provided by Google' });
        }

        // Find existing user by googleId or email
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            // Link Google account if user exists by email but not yet linked
            if (!user.googleId) {
                user.googleId = googleId;
                user.avatar = picture || user.avatar;
                await user.save();
            }
        } else {
            // Create a new user from Google profile
            // Generate a unique username from the email prefix
            let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
            let username = baseUsername;
            let counter = 1;
            while (await User.findOne({ username })) {
                username = `${baseUsername}_${counter++}`;
            }

            user = new User({
                username,
                email,
                googleId,
                avatar: picture || null
                // No password — OAuth user
            });
            await user.save();
        }

        const { accessToken, refreshToken } = await generateTokenPair(user);
        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                avatar: user.avatar
            }
        });
    } catch (err) {
        console.error('Google auth error:', err.message);
        if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token')) {
            return res.status(401).json({ error: 'Invalid or expired Google token' });
        }
        res.status(500).json({ error: 'Google authentication failed' });
    }
});

module.exports = router;
