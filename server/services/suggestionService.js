const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

/**
 * Resume Bullet Suggestion Service
 * Analyzes resume bullets against a JD and generates improvement suggestions
 * with hallucination validation.
 */

/**
 * Simple Levenshtein-based similarity (0–1).
 * Used to validate that LLM-suggested "original bullets" actually exist in the resume.
 */
function similarity(a, b) {
    const la = a.toLowerCase().trim();
    const lb = b.toLowerCase().trim();

    if (la === lb) return 1;
    if (!la.length || !lb.length) return 0;

    // For performance, skip very long comparisons
    if (la.length > 500 || lb.length > 500) {
        // Fall back to substring check
        return la.includes(lb) || lb.includes(la) ? 0.85 : 0;
    }

    const matrix = [];
    for (let i = 0; i <= lb.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= la.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= lb.length; i++) {
        for (let j = 1; j <= la.length; j++) {
            const cost = lb[i - 1] === la[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    const maxLen = Math.max(la.length, lb.length);
    return 1 - matrix[lb.length][la.length] / maxLen;
}

/**
 * Check if a bullet exists in the resume text with >= threshold similarity.
 * Tries exact substring match first, then fuzzy line-by-line comparison.
 */
function bulletExistsInResume(bullet, resumeText, threshold = 0.8) {
    const cleanBullet = bullet.trim().toLowerCase();
    const cleanResume = resumeText.toLowerCase();

    // Fast path: exact substring
    if (cleanResume.includes(cleanBullet)) return true;

    // Fuzzy match against each line / bullet point in the resume
    const lines = resumeText.split(/[\n\r]+/).filter(l => l.trim().length > 10);
    for (const line of lines) {
        if (similarity(cleanBullet, line.trim()) >= threshold) {
            return true;
        }
    }
    return false;
}

/**
 * Generate resume bullet improvement suggestions via LLM.
 * @param {string} resumeText
 * @param {string} jobDescription
 * @param {string[]} matchedSkills
 * @param {string[]} missingSkills
 * @returns {Object} { suggestions: [...], totalCount: number }
 */
async function generateSuggestions(resumeText, jobDescription, matchedSkills = [], missingSkills = []) {
    try {
        const prompt = `You are an expert ATS resume coach and technical recruiter with 15 years of experience.

TASK: Analyze the resume bullet points below and generate improvement suggestions specifically tailored to the provided job description.

RESUME TEXT:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

ALREADY MATCHED SKILLS (do not focus on these): ${matchedSkills.join(', ')}
MISSING/WEAK SKILLS (prioritize gaps): ${missingSkills.join(', ')}

INSTRUCTIONS:
1. Identify the 5–8 weakest resume bullet points relative to this specific JD.
2. For each bullet, provide a rewritten version that:
   - Incorporates relevant JD keywords naturally
   - Adds quantifiable impact where plausible (use realistic estimates if none exist, mark with "[estimated]")
   - Uses strong action verbs
   - Is concise (max 2 lines)
3. Assign a confidence score: "high" (clear improvement), "medium" (subjective), "low" (speculative rewrite).
4. Assign a category: quantification | keywords | impact | clarity | relevance

STRICT OUTPUT FORMAT — return only valid JSON, no markdown, no explanation:
{
  "suggestions": [
    {
      "id": "1",
      "originalBullet": "exact text from resume",
      "reason": "one sentence explanation",
      "rewrittenBullet": "improved version",
      "confidence": "high",
      "category": "keywords"
    }
  ]
}`;

        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'meta-llama/llama-3.3-70b-instruct',
                messages: [
                    { role: 'system', content: 'You are a resume optimization expert. Return only valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.4
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

        // Strip markdown fences
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(jsonStr);

        let suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];

        // ── Hallucination validation ─────────────────────────────────────────
        suggestions = suggestions.filter(s => {
            if (!s.originalBullet || !s.rewrittenBullet || !s.reason) return false;
            return bulletExistsInResume(s.originalBullet, resumeText, 0.8);
        });

        // Cap at 8
        suggestions = suggestions.slice(0, 8);

        // Assign UUIDs and normalize fields
        suggestions = suggestions.map(s => ({
            id: uuidv4(),
            originalBullet: s.originalBullet,
            reason: s.reason,
            rewrittenBullet: s.rewrittenBullet,
            confidence: ['high', 'medium', 'low'].includes(s.confidence) ? s.confidence : 'medium',
            category: ['quantification', 'keywords', 'impact', 'clarity', 'relevance'].includes(s.category)
                ? s.category : 'clarity',
            accepted: false
        }));

        return {
            suggestions,
            totalCount: suggestions.length
        };

    } catch (error) {
        console.error('Suggestion generation error:', error.message);
        return { suggestions: [], totalCount: 0 };
    }
}

module.exports = { generateSuggestions, bulletExistsInResume, similarity };
