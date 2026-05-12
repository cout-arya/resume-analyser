const request = require('supertest');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, clearTestDB, createTestUser } = require('./setup');

let app, token;

beforeAll(async () => {
    await setupTestDB();

    const analyzeRoutes = require('../routes/analyzeRoutes');
    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/analyze', analyzeRoutes);
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

describe('POST /api/analyze/score', () => {
    it('should reject request without auth (401)', async () => {
        const res = await request(app)
            .post('/api/analyze/score')
            .send({ sessionId: 'test-session' });

        expect(res.status).toBe(401);
    });

    it('should reject request without sessionId (400)', async () => {
        const res = await request(app)
            .post('/api/analyze/score')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/session id/i);
    });

    it('should return 404 for non-existent session', async () => {
        const res = await request(app)
            .post('/api/analyze/score')
            .set('Authorization', `Bearer ${token}`)
            .send({ sessionId: 'non-existent-session' });

        expect(res.status).toBe(404);
    });
});

describe('POST /api/analyze/skills', () => {
    it('should reject request without auth (401)', async () => {
        const res = await request(app)
            .post('/api/analyze/skills')
            .send({ sessionId: 'test-session' });

        expect(res.status).toBe(401);
    });

    it('should reject request without sessionId (400)', async () => {
        const res = await request(app)
            .post('/api/analyze/skills')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
    });
});

describe('POST /api/analyze/interview-prep', () => {
    it('should reject request without auth (401)', async () => {
        const res = await request(app)
            .post('/api/analyze/interview-prep')
            .send({ sessionId: 'test-session' });

        expect(res.status).toBe(401);
    });

    it('should reject request without sessionId (400)', async () => {
        const res = await request(app)
            .post('/api/analyze/interview-prep')
            .set('Authorization', `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
    });
});
