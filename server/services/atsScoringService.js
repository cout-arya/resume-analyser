const axios = require('axios');
const vectorStore = require('../utils/vectorStore');

/**
 * ATS Scoring Service
 * Evaluates resume-to-JD match with a 0-100 score across three dimensions:
 *   - Keyword Match (30%)
 *   - Semantic Similarity (50%)
 *   - Formatting & Structure (20%)
 */

// ─── Keyword Match (30%) ────────────────────────────────────────────────────

/**
 * Extract important keywords from the JD using LLM.
 */
async function extractKeywordsFromJD(jdText) {
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'meta-llama/llama-3.3-70b-instruct',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a keyword extraction engine. Output ONLY a JSON array of strings. No explanations.'
                    },
                    {
                        role: 'user',
                        content: `Extract the most important technical skills, tools, qualifications, and keywords from this job description. Return a JSON array of strings (15-30 keywords).

Job Description:
${jdText}`
                    }
                ],
                temperature: 0.1
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': process.env.APP_URL || 'http://localhost:5000',
                    'X-Title': 'Resume Analyzer'
                }
            }
        );

        const content = response.data.choices[0].message.content.trim();
        // Parse JSON from LLM response (handle markdown fencing)
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Keyword extraction error:', error.message);
        // Fallback: simple word-frequency extraction
        return fallbackKeywordExtraction(jdText);
    }
}

/**
 * Fallback keyword extraction using simple heuristics.
 */
function fallbackKeywordExtraction(text) {
    const stopWords = new Set([
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'shall', 'would',
        'should', 'may', 'might', 'must', 'can', 'could', 'to', 'of', 'in',
        'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
        'and', 'or', 'but', 'not', 'no', 'nor', 'so', 'yet', 'both', 'either',
        'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most', 'other',
        'some', 'such', 'than', 'too', 'very', 'just', 'about', 'above', 'after',
        'before', 'between', 'during', 'that', 'this', 'these', 'those', 'it',
        'its', 'we', 'our', 'you', 'your', 'they', 'their', 'them', 'he', 'she',
        'him', 'her', 'his', 'who', 'what', 'which', 'when', 'where', 'how',
        'work', 'working', 'experience', 'role', 'team', 'ability', 'strong',
        'required', 'preferred', 'including', 'also', 'well', 'using', 'used'
    ]);

    const words = text.toLowerCase().replace(/[^a-z0-9\s\+\#\.]/g, ' ').split(/\s+/);
    const freq = {};

    for (const word of words) {
        if (word.length > 2 && !stopWords.has(word)) {
            freq[word] = (freq[word] || 0) + 1;
        }
    }

    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 25)
        .map(([word]) => word);
}

/**
 * Calculate keyword match score (0-30).
 */
function calculateKeywordScore(keywords, resumeText) {
    if (!keywords.length) return { score: 0, matchedKeywords: [], missingKeywords: keywords };

    const resumeLower = resumeText.toLowerCase();
    let matchedCount = 0;
    const matchedKeywords = [];
    const missingKeywords = [];

    for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        if (resumeLower.includes(keywordLower)) {
            matchedCount++;
            matchedKeywords.push(keyword);
        } else {
            missingKeywords.push(keyword);
        }
    }

    const matchRatio = matchedCount / keywords.length;
    const score = Math.round(matchRatio * 30);

    return { score, matchedKeywords, missingKeywords };
}

// ─── Semantic Similarity (50%) ──────────────────────────────────────────────

/**
 * Calculate semantic similarity score (0-50) using embeddings.
 */
async function calculateSemanticScore(resumeText, jdText) {
    try {
        // Get embeddings for both full texts
        const [resumeEmbedding, jdEmbedding] = await vectorStore.getEmbeddings([resumeText, jdText]);
        const similarity = vectorStore.cosineSimilarity(resumeEmbedding, jdEmbedding);

        // Map similarity (typically 0.5-1.0 range) to 0-50 score
        // Cosine similarity for related documents is usually 0.3-0.9
        const normalizedScore = Math.max(0, Math.min(1, (similarity - 0.3) / 0.6));
        const score = Math.round(normalizedScore * 50);

        return { score, similarity: Math.round(similarity * 100) / 100 };
    } catch (error) {
        console.error('Semantic similarity error:', error.message);
        return { score: 0, similarity: 0 };
    }
}

// ─── Formatting & Structure (20%) ───────────────────────────────────────────

/**
 * Rule-based formatting and structure analysis (0-20).
 */
function calculateFormattingScore(resumeText) {
    let score = 0;
    const checks = {};

    // Check for Skills section (4 points)
    const skillsPattern = /\b(skills|technical skills|core competencies|technologies|proficiencies)\b/i;
    if (skillsPattern.test(resumeText)) {
        score += 4;
        checks.skillsSection = true;
    } else {
        checks.skillsSection = false;
    }

    // Check for Experience section (4 points)
    const expPattern = /\b(experience|work experience|professional experience|employment|work history)\b/i;
    if (expPattern.test(resumeText)) {
        score += 4;
        checks.experienceSection = true;
    } else {
        checks.experienceSection = false;
    }

    // Check for Education section (4 points)
    const eduPattern = /\b(education|academic|qualification|degree|university|college)\b/i;
    if (eduPattern.test(resumeText)) {
        score += 4;
        checks.educationSection = true;
    } else {
        checks.educationSection = false;
    }

    // Check for bullet points / structured content (4 points)
    const bulletLines = resumeText.split('\n').filter(line =>
        /^\s*[\u2022\u2023\u25E6\u2043\u2219•\-\*]\s/.test(line) ||
        /^\s*\d+[\.\)]\s/.test(line)
    );
    const bulletRatio = bulletLines.length / Math.max(resumeText.split('\n').length, 1);
    if (bulletRatio > 0.15) {
        score += 4;
        checks.bulletPoints = true;
    } else if (bulletRatio > 0.05) {
        score += 2;
        checks.bulletPoints = 'partial';
    } else {
        checks.bulletPoints = false;
    }

    // Check for reasonable length and structure (4 points)
    const wordCount = resumeText.split(/\s+/).length;
    const paragraphs = resumeText.split(/\n\n+/).length;
    if (wordCount >= 200 && wordCount <= 1500 && paragraphs >= 3) {
        score += 4;
        checks.structure = true;
    } else if (wordCount >= 100 && paragraphs >= 2) {
        score += 2;
        checks.structure = 'partial';
    } else {
        checks.structure = false;
    }

    return { score, checks };
}

// ─── Summary Generation ─────────────────────────────────────────────────────

/**
 * Generate a human-readable summary of the ATS score.
 */
async function generateSummary(breakdown, keywordData) {
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'meta-llama/llama-3.3-70b-instruct',
                messages: [
                    {
                        role: 'system',
                        content: 'Provide a brief 1-2 sentence summary. Be specific and actionable. No markdown formatting.'
                    },
                    {
                        role: 'user',
                        content: `Given this ATS score breakdown:
- Total Score: ${breakdown.keywordMatch + breakdown.semanticSimilarity + breakdown.formatting}/100
- Keyword Match: ${breakdown.keywordMatch}/30
- Semantic Similarity: ${breakdown.semanticSimilarity}/50
- Formatting: ${breakdown.formatting}/20

Missing keywords: ${keywordData.missingKeywords.slice(0, 10).join(', ')}
Matched keywords: ${keywordData.matchedKeywords.slice(0, 10).join(', ')}

Write a concise summary of the resume's match quality and what to improve.`
                    }
                ],
                temperature: 0.3
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    'HTTP-Referer': process.env.APP_URL || 'http://localhost:5000',
                    'X-Title': 'Resume Analyzer'
                }
            }
        );

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Summary generation error:', error.message);
        const total = breakdown.keywordMatch + breakdown.semanticSimilarity + breakdown.formatting;
        if (total >= 75) return 'Strong match with the job description. Minor improvements could boost your score further.';
        if (total >= 50) return `Moderate match. Consider adding missing skills: ${keywordData.missingKeywords.slice(0, 5).join(', ')}.`;
        return `Low match. Significant gaps in keywords and relevance. Focus on: ${keywordData.missingKeywords.slice(0, 5).join(', ')}.`;
    }
}

// ─── Main Scoring Function ──────────────────────────────────────────────────

/**
 * Calculate the complete ATS score for a resume against a job description.
 * @param {string} resumeText - The resume text content.
 * @param {string} jdText - The job description text content.
 * @returns {Object} Score result with breakdown and summary.
 */
async function calculateATSScore(resumeText, jdText) {
    // Run keyword extraction and semantic scoring in parallel
    const [keywords, semanticResult] = await Promise.all([
        extractKeywordsFromJD(jdText),
        calculateSemanticScore(resumeText, jdText)
    ]);

    // Calculate keyword match
    const keywordResult = calculateKeywordScore(keywords, resumeText);

    // Calculate formatting score
    const formattingResult = calculateFormattingScore(resumeText);

    const breakdown = {
        keywordMatch: keywordResult.score,
        semanticSimilarity: semanticResult.score,
        formatting: formattingResult.score
    };

    const totalScore = breakdown.keywordMatch + breakdown.semanticSimilarity + breakdown.formatting;

    // Generate summary
    const summary = await generateSummary(breakdown, keywordResult);

    return {
        score: totalScore,
        breakdown,
        details: {
            matchedKeywords: keywordResult.matchedKeywords,
            missingKeywords: keywordResult.missingKeywords,
            semanticSimilarity: semanticResult.similarity,
            formattingChecks: formattingResult.checks
        },
        summary
    };
}

module.exports = { calculateATSScore };
