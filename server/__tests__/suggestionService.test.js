const { setupTestDB, teardownTestDB, clearTestDB, createTestUser } = require('./setup');
const { generateSuggestions, bulletExistsInResume, similarity } = require('../services/suggestionService');
const axios = require('axios');

// Mock axios to avoid real LLM calls
jest.mock('axios');

beforeAll(async () => {
    await setupTestDB();
});

afterAll(async () => {
    await teardownTestDB();
});

beforeEach(async () => {
    jest.clearAllMocks();
});

afterEach(async () => {
    await clearTestDB();
});

// ─── Unit Tests: similarity() ────────────────────────────────────────────────

describe('similarity()', () => {
    it('should return 1 for identical strings', () => {
        expect(similarity('hello world', 'hello world')).toBe(1);
    });

    it('should return 1 for case-insensitive match', () => {
        expect(similarity('Hello World', 'hello world')).toBe(1);
    });

    it('should return high similarity for minor edits', () => {
        const score = similarity(
            'Developed REST APIs using Node.js',
            'Developed REST APIs using Node.js and Express'
        );
        expect(score).toBeGreaterThan(0.7);
    });

    it('should return low similarity for unrelated strings', () => {
        const score = similarity(
            'Managed team of 5 engineers',
            'Proficient in Python and machine learning'
        );
        expect(score).toBeLessThan(0.5);
    });
});

// ─── Unit Tests: bulletExistsInResume() ──────────────────────────────────────

describe('bulletExistsInResume()', () => {
    const sampleResume = `
        Senior Software Engineer at TechCorp
        - Developed REST APIs using Node.js and Express
        - Led a team of 5 engineers to deliver a microservices platform
        - Reduced deployment time by 40% through CI/CD automation
        - Built real-time dashboards using React and D3.js
    `;

    it('should return true for exact substring match', () => {
        expect(bulletExistsInResume('Developed REST APIs using Node.js and Express', sampleResume)).toBe(true);
    });

    it('should return true for fuzzy match above threshold', () => {
        // Slightly different but still very similar
        expect(bulletExistsInResume('Developed REST APIs using Node.js', sampleResume)).toBe(true);
    });

    it('should return false for hallucinated bullet', () => {
        expect(bulletExistsInResume(
            'Implemented machine learning models using TensorFlow',
            sampleResume
        )).toBe(false);
    });
});

// ─── Integration Tests: generateSuggestions() ────────────────────────────────

describe('generateSuggestions()', () => {
    const resumeText = `
        Software Engineer at TechCorp (2022-2024)
        - Worked on backend APIs
        - Fixed bugs in the system
        - Participated in code reviews
        - Maintained database queries
        - Helped with deployment process
        - Wrote some documentation
        - Attended team meetings regularly
        - Supported the QA team with testing
    `;

    const jobDescription = 'Looking for a Senior Backend Engineer with experience in Node.js, microservices, AWS, CI/CD, and team leadership.';

    it('should return suggestions from LLM response', async () => {
        axios.post.mockResolvedValueOnce({
            data: {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            suggestions: [
                                {
                                    id: '1',
                                    originalBullet: 'Worked on backend APIs',
                                    reason: 'Missing quantification and technology specifics',
                                    rewrittenBullet: 'Engineered 15+ RESTful APIs using Node.js and Express, serving 10K+ daily requests',
                                    confidence: 'high',
                                    category: 'quantification'
                                },
                                {
                                    id: '2',
                                    originalBullet: 'Fixed bugs in the system',
                                    reason: 'Vague and lacks impact',
                                    rewrittenBullet: 'Resolved 50+ critical production bugs, reducing system downtime by 30%',
                                    confidence: 'medium',
                                    category: 'impact'
                                }
                            ]
                        })
                    }
                }]
            }
        });

        const result = await generateSuggestions(resumeText, jobDescription, [], ['AWS', 'CI/CD']);
        expect(result.suggestions.length).toBe(2);
        expect(result.suggestions[0].originalBullet).toBe('Worked on backend APIs');
        expect(result.suggestions[0].confidence).toBe('high');
    });

    it('should drop hallucinated bullets not found in resume', async () => {
        axios.post.mockResolvedValueOnce({
            data: {
                choices: [{
                    message: {
                        content: JSON.stringify({
                            suggestions: [
                                {
                                    id: '1',
                                    originalBullet: 'Worked on backend APIs',
                                    reason: 'legit bullet',
                                    rewrittenBullet: 'Improved version',
                                    confidence: 'high',
                                    category: 'keywords'
                                },
                                {
                                    id: '2',
                                    originalBullet: 'Built ML pipelines using Spark and Kafka',
                                    reason: 'this is hallucinated',
                                    rewrittenBullet: 'Should not appear',
                                    confidence: 'high',
                                    category: 'keywords'
                                }
                            ]
                        })
                    }
                }]
            }
        });

        const result = await generateSuggestions(resumeText, jobDescription);
        expect(result.suggestions.length).toBe(1);
        expect(result.suggestions[0].originalBullet).toBe('Worked on backend APIs');
    });

    it('should cap suggestions at 8 max', async () => {
        const manySuggestions = Array.from({ length: 12 }, (_, i) => ({
            id: String(i + 1),
            originalBullet: resumeText.split('\n').filter(l => l.trim().startsWith('-'))[i % 8]?.replace('-', '').trim() || 'Worked on backend APIs',
            reason: `Reason ${i + 1}`,
            rewrittenBullet: `Rewritten ${i + 1}`,
            confidence: 'high',
            category: 'keywords'
        }));

        axios.post.mockResolvedValueOnce({
            data: {
                choices: [{
                    message: {
                        content: JSON.stringify({ suggestions: manySuggestions })
                    }
                }]
            }
        });

        const result = await generateSuggestions(resumeText, jobDescription);
        expect(result.suggestions.length).toBeLessThanOrEqual(8);
    });

    it('should handle markdown fences in LLM response', async () => {
        axios.post.mockResolvedValueOnce({
            data: {
                choices: [{
                    message: {
                        content: '```json\n{"suggestions": [{"id": "1", "originalBullet": "Worked on backend APIs", "reason": "test", "rewrittenBullet": "improved", "confidence": "high", "category": "keywords"}]}\n```'
                    }
                }]
            }
        });

        const result = await generateSuggestions(resumeText, jobDescription);
        expect(result.suggestions.length).toBe(1);
    });

    it('should return empty array on LLM failure', async () => {
        axios.post.mockRejectedValueOnce(new Error('API error'));

        const result = await generateSuggestions(resumeText, jobDescription);
        expect(result.suggestions).toEqual([]);
        expect(result.totalCount).toBe(0);
    });
});
