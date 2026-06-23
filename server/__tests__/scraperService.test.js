const { setupTestDB, teardownTestDB, clearTestDB } = require('./setup');
const { detectPlatform, cleanText } = require('../services/scraperService');
const ScrapedJD = require('../models/ScrapedJD');
const crypto = require('crypto');

beforeAll(async () => {
    await setupTestDB();
});

afterAll(async () => {
    await teardownTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

// ─── Unit Tests: detectPlatform() ────────────────────────────────────────────

describe('detectPlatform()', () => {
    it('should detect LinkedIn', () => {
        expect(detectPlatform('https://www.linkedin.com/jobs/view/12345')).toBe('linkedin');
        expect(detectPlatform('https://linkedin.com/jobs/view/12345')).toBe('linkedin');
    });

    it('should detect Indeed', () => {
        expect(detectPlatform('https://www.indeed.com/viewjob?jk=abc123')).toBe('indeed');
        expect(detectPlatform('https://indeed.co.in/viewjob?jk=abc123')).toBe('indeed');
    });

    it('should detect Glassdoor', () => {
        expect(detectPlatform('https://www.glassdoor.com/job-listing/engineer')).toBe('glassdoor');
        expect(detectPlatform('https://glassdoor.co.in/job-listing/engineer')).toBe('glassdoor');
    });

    it('should detect Naukri', () => {
        expect(detectPlatform('https://www.naukri.com/job-listings-software-engineer')).toBe('naukri');
    });

    it('should return generic for unknown URLs', () => {
        expect(detectPlatform('https://careers.google.com/jobs/12345')).toBe('generic');
        expect(detectPlatform('https://example.com/job/posting')).toBe('generic');
    });
});

// ─── Unit Tests: cleanText() ─────────────────────────────────────────────────

describe('cleanText()', () => {
    it('should remove blocklisted UI strings', () => {
        const dirty = 'We are looking for a Senior Engineer Apply Now Save Job Sign In';
        const cleaned = cleanText(dirty);
        expect(cleaned).not.toContain('Apply Now');
        expect(cleaned).not.toContain('Save Job');
        expect(cleaned).not.toContain('Sign In');
        expect(cleaned).toContain('Senior Engineer');
    });

    it('should collapse excessive whitespace', () => {
        const dirty = 'Hello\n\n\n\n\nWorld    there';
        const cleaned = cleanText(dirty);
        expect(cleaned).not.toContain('\n\n\n');
        expect(cleaned).not.toContain('    ');
    });

    it('should handle empty strings', () => {
        expect(cleanText('')).toBe('');
    });
});

// ─── Integration Tests: Cache ────────────────────────────────────────────────

describe('ScrapedJD cache', () => {
    it('should store and retrieve a cached JD by URL hash', async () => {
        const url = 'https://www.indeed.com/viewjob?jk=test123';
        const urlHash = crypto.createHash('sha256').update(url.trim().toLowerCase()).digest('hex');

        await ScrapedJD.create({
            urlHash,
            url,
            jobTitle: 'Software Engineer',
            companyName: 'TestCorp',
            location: 'Remote',
            jobDescription: 'We are looking for a skilled engineer...',
            platform: 'indeed',
            scrapedAt: new Date()
        });

        const cached = await ScrapedJD.findOne({ urlHash });
        expect(cached).not.toBeNull();
        expect(cached.jobTitle).toBe('Software Engineer');
        expect(cached.companyName).toBe('TestCorp');
        expect(cached.platform).toBe('indeed');
    });

    it('should return null for non-cached URL', async () => {
        const urlHash = crypto.createHash('sha256').update('https://example.com/uncached').digest('hex');
        const cached = await ScrapedJD.findOne({ urlHash });
        expect(cached).toBeNull();
    });

    it('should enforce unique urlHash constraint', async () => {
        const urlHash = 'duplicate-test-hash';

        await ScrapedJD.create({
            urlHash,
            url: 'https://example.com',
            jobTitle: 'Engineer',
            platform: 'generic',
            jobDescription: 'test',
            scrapedAt: new Date()
        });

        await expect(ScrapedJD.create({
            urlHash,
            url: 'https://example.com/different',
            jobTitle: 'Another',
            platform: 'generic',
            jobDescription: 'test2',
            scrapedAt: new Date()
        })).rejects.toThrow();
    });
});
