const request = require('supertest');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, clearTestDB, createTestUser } = require('./setup');

let app, token;

beforeAll(async () => {
    await setupTestDB();

    const apiRoutes = require('../routes/api');
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api', apiRoutes);
});

afterAll(async () => {
    await teardownTestDB();
});

beforeEach(async () => {
    const result = await createTestUser();
    token = result.token;
});

afterEach(async () => {
    await clearTestDB();
});

describe('POST /api/upload', () => {
    it('should reject request without auth token (401)', async () => {
        const res = await request(app)
            .post('/api/upload')
            .attach('file', Buffer.from('test content'), 'test.pdf');

        expect(res.status).toBe(401);
    });

    it('should reject request without a file (400)', async () => {
        const res = await request(app)
            .post('/api/upload')
            .set('Authorization', `Bearer ${token}`)
            .field('type', 'resume');

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/no file/i);
    });
});
