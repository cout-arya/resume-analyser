/**
 * Test setup — shared helpers for the test suite.
 * Uses mongodb-memory-server for isolated DB testing.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let mongoServer;

/**
 * Connect to an in-memory MongoDB instance.
 */
async function setupTestDB() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Set env vars for the test context
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = 'test-jwt-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.OPENROUTER_API_KEY = 'test-key';
    process.env.APP_URL = 'http://localhost:4000';

    await mongoose.connect(uri);
}

/**
 * Close the in-memory DB and disconnect.
 */
async function teardownTestDB() {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
}

/**
 * Clear all collections between tests.
 */
async function clearTestDB() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
}

/**
 * Create a test user and return their JWT access token.
 */
async function createTestUser() {
    const user = new User({
        username: 'testuser',
        email: 'test@test.com',
        password: 'Test1234!'
    });
    await user.save();

    const token = jwt.sign(
        { id: user._id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    return { user, token };
}

module.exports = {
    setupTestDB,
    teardownTestDB,
    clearTestDB,
    createTestUser
};
