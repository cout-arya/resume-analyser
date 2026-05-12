const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ACCESS_SECRET = process.env.JWT_SECRET || 'secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';

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

module.exports = router;
