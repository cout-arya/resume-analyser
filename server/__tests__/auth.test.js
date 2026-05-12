const request = require('supertest');
const mongoose = require('mongoose');
const { setupTestDB, teardownTestDB, clearTestDB } = require('./setup');

// Must set env before requiring app
let app;

beforeAll(async () => {
    await setupTestDB();
    // Require app after env is set (avoid double-listen)
    const express = require('express');
    const cors = require('cors');
    const authRoutes = require('../routes/auth');

    app = express();
    app.use(cors());
    app.use(express.json());
    app.use('/api/auth', authRoutes);
});

afterAll(async () => {
    await teardownTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens (201-equivalent)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'newuser', email: 'new@test.com', password: 'Pass1234!' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user.username).toBe('newuser');
    });

    it('should reject duplicate email', async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'user1', email: 'dup@test.com', password: 'Pass1234!' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({ username: 'user2', email: 'dup@test.com', password: 'Pass5678!' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/already exists/i);
    });

    it('should reject missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'no@pass.com' });

        expect(res.status).toBe(500);
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(async () => {
        await request(app)
            .post('/api/auth/register')
            .send({ username: 'loginuser', email: 'login@test.com', password: 'Pass1234!' });
    });

    it('should login successfully and return tokens', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'login@test.com', password: 'Pass1234!' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
        expect(res.body).toHaveProperty('refreshToken');
        expect(res.body.user.email).toBe('login@test.com');
    });

    it('should reject wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'login@test.com', password: 'WrongPass!' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/invalid credentials/i);
    });

    it('should reject unknown email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'ghost@test.com', password: 'Pass1234!' });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/invalid credentials/i);
    });
});

describe('POST /api/auth/refresh', () => {
    it('should issue a new access token with valid refresh token', async () => {
        const reg = await request(app)
            .post('/api/auth/register')
            .send({ username: 'refreshuser', email: 'refresh@test.com', password: 'Pass1234!' });

        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: reg.body.refreshToken });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('accessToken');
    });

    it('should reject invalid refresh token', async () => {
        const res = await request(app)
            .post('/api/auth/refresh')
            .send({ refreshToken: 'invalid-token' });

        expect(res.status).toBe(401);
    });
});
