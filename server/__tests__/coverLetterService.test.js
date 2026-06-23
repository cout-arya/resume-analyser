const { setupTestDB, teardownTestDB, clearTestDB } = require('./setup');
const { buildPrompt, generateCoverLetterPDF } = require('../services/coverLetterService');

beforeAll(async () => {
    await setupTestDB();
});

afterAll(async () => {
    await teardownTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

// ─── Unit Tests: buildPrompt() ───────────────────────────────────────────────

describe('buildPrompt()', () => {
    const resumeText = 'Experienced software engineer with 5 years...';
    const jobDescription = 'Looking for a senior backend developer...';

    it('should include formal tone instruction for formal tone', () => {
        const prompt = buildPrompt(resumeText, jobDescription, 'Google', 'SDE', 'formal', '');
        expect(prompt).toContain('formal');
        expect(prompt).toContain('polished');
        expect(prompt).toContain('avoid contractions');
    });

    it('should include confident tone instruction', () => {
        const prompt = buildPrompt(resumeText, jobDescription, 'Google', 'SDE', 'confident', '');
        expect(prompt).toContain('assertive');
        expect(prompt).toContain('I will');
    });

    it('should include concise tone instruction', () => {
        const prompt = buildPrompt(resumeText, jobDescription, 'Google', 'SDE', 'concise', '');
        expect(prompt).toContain('under 200 words');
        expect(prompt).toContain('No filler');
    });

    it('should include all provided metadata in prompt', () => {
        const prompt = buildPrompt(resumeText, jobDescription, 'TestCorp', 'Lead Engineer', 'formal', 'I love their product');
        expect(prompt).toContain('TestCorp');
        expect(prompt).toContain('Lead Engineer');
        expect(prompt).toContain('I love their product');
        expect(prompt).toContain(resumeText);
        expect(prompt).toContain(jobDescription);
    });

    it('should use defaults when company/title not provided', () => {
        const prompt = buildPrompt(resumeText, jobDescription, '', '', 'formal', '');
        expect(prompt).toContain('the hiring company');
        expect(prompt).toContain('the advertised position');
    });

    it('should produce structurally different prompts per tone', () => {
        const formalPrompt = buildPrompt(resumeText, jobDescription, 'Co', 'Role', 'formal', '');
        const confidentPrompt = buildPrompt(resumeText, jobDescription, 'Co', 'Role', 'confident', '');
        const concisePrompt = buildPrompt(resumeText, jobDescription, 'Co', 'Role', 'concise', '');

        // All three should be different
        expect(formalPrompt).not.toBe(confidentPrompt);
        expect(formalPrompt).not.toBe(concisePrompt);
        expect(confidentPrompt).not.toBe(concisePrompt);
    });
});

// ─── Unit Tests: generateCoverLetterPDF() ────────────────────────────────────

describe('generateCoverLetterPDF()', () => {
    it('should produce a PDFKit document stream', () => {
        const doc = generateCoverLetterPDF('Test cover letter content', {
            companyName: 'TestCorp',
            jobTitle: 'Software Engineer'
        });

        expect(doc).toBeDefined();
        expect(typeof doc.pipe).toBe('function');
    });

    it('should handle empty metadata gracefully', () => {
        const doc = generateCoverLetterPDF('Some text', {});
        expect(doc).toBeDefined();
        expect(typeof doc.pipe).toBe('function');
    });

    it('should handle long cover letter text', () => {
        const longText = 'This is a paragraph. '.repeat(500);
        const doc = generateCoverLetterPDF(longText, {
            companyName: 'BigCorp',
            jobTitle: 'Senior Engineer'
        });
        expect(doc).toBeDefined();
        expect(typeof doc.pipe).toBe('function');
    });
});
