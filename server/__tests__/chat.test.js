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

describe('POST /api/chat', () => {
    it('should reject request without auth (401)', async () => {
        const res = await request(app)
            .post('/api/chat')
            .send({ sessionId: 'test-session', question: 'Hello' });

        expect(res.status).toBe(401);
    });

    it('should reject request without sessionId (400)', async () => {
        const res = await request(app)
            .post('/api/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ question: 'Hello' });

        expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent session', async () => {
        const res = await request(app)
            .post('/api/chat')
            .set('Authorization', `Bearer ${token}`)
            .send({ sessionId: 'fake-session', question: 'Hello' });

        expect(res.status).toBe(404);
    });
});

describe('GET /api/sessions', () => {
    it('should reject request without auth (401)', async () => {
        const res = await request(app)
            .get('/api/sessions');

        expect(res.status).toBe(401);
    });

    it('should return empty array for new user', async () => {
        const res = await request(app)
            .get('/api/sessions')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(0);
    });
});

describe('DELETE /api/sessions/:sessionId', () => {
    it('should reject request without auth (401)', async () => {
        const res = await request(app)
            .delete('/api/sessions/some-session');

        expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent session', async () => {
        const res = await request(app)
            .delete('/api/sessions/non-existent')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});
