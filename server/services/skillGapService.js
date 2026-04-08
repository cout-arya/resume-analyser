const axios = require('axios');

/**
 * Skill Gap Analysis Service
 * Extracts skills from resume & JD, categorizes matches, and generates suggestions.
 */

// ─── Skill Extraction ───────────────────────────────────────────────────────

/**
 * Extract skills from text using LLM.
 * @param {string} text - Document text (resume or JD).
 * @param {string} docType - 'resume' or 'jd'.
 * @returns {string[]} Array of extracted skills.
 */
async function extractSkills(text, docType) {
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'meta-llama/llama-3.3-70b-instruct',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a skill extraction engine. Output ONLY a JSON array of skill strings. No explanations, no markdown.'
                    },
                    {
                        role: 'user',
                        content: `Extract all technical skills, tools, frameworks, programming languages, soft skills, and domain expertise from this ${docType === 'jd' ? 'job description' : 'resume'}. Return a JSON array of strings.

Text:
${text}`
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
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error(`Skill extraction error (${docType}):`, error.message);
        return fallbackSkillExtraction(text);
    }
}

/**
 * Fallback skill extraction using pattern matching.
 */
function fallbackSkillExtraction(text) {
    const commonSkills = [
        'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'php', 'swift', 'kotlin',
        'react', 'angular', 'vue', 'next.js', 'node.js', 'express', 'django', 'flask', 'spring boot',
        'html', 'css', 'tailwind', 'sass', 'bootstrap',
        'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'jenkins', 'ci/cd',
        'mongodb', 'postgresql', 'mysql', 'redis', 'elasticsearch', 'dynamodb',
        'git', 'github', 'gitlab', 'jira', 'agile', 'scrum',
        'machine learning', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch',
        'rest api', 'graphql', 'microservices', 'serverless', 'oauth',
        'figma', 'sketch', 'adobe xd',
        'linux', 'bash', 'powershell',
        'communication', 'leadership', 'problem solving', 'teamwork', 'project management'
    ];

    const textLower = text.toLowerCase();
    return commonSkills.filter(skill => textLower.includes(skill));
}

// ─── Skill Matching & Categorization ────────────────────────────────────────

/**
 * Use LLM to categorize JD skills against resume skills.
 */
async function categorizeSkills(jdSkills, resumeSkills) {
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'meta-llama/llama-3.3-70b-instruct',
                messages: [
                    {
                        role: 'system',
                        content: `You are a skill matching engine. Compare job description skills against resume skills and categorize them.
Output ONLY valid JSON with this exact structure:
{
  "matched": ["skill1", "skill2"],
  "partial": [{"jdSkill": "required skill", "resumeSkill": "similar skill found"}],
  "missing": ["missing_skill1", "missing_skill2"]
}

Rules:
- "matched": JD skill is clearly present in the resume (exact or very close match)
- "partial": JD skill is partially matched — the resume has a related but not identical skill
- "missing": JD skill has no match at all in the resume
No explanations. Output ONLY JSON.`
                    },
                    {
                        role: 'user',
                        content: `JD Skills: ${JSON.stringify(jdSkills)}

Resume Skills: ${JSON.stringify(resumeSkills)}

Categorize each JD skill.`
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
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Skill categorization error:', error.message);
        // Fallback: simple string matching
        return fallbackCategorization(jdSkills, resumeSkills);
    }
}

/**
 * Fallback categorization using simple string matching.
 */
function fallbackCategorization(jdSkills, resumeSkills) {
    const resumeLower = resumeSkills.map(s => s.toLowerCase());
    const matched = [];
    const partial = [];
    const missing = [];

    for (const jdSkill of jdSkills) {
        const jdLower = jdSkill.toLowerCase();

        if (resumeLower.includes(jdLower)) {
            matched.push(jdSkill);
        } else {
            // Check for partial match
            const partialMatch = resumeSkills.find(rs =>
                rs.toLowerCase().includes(jdLower) ||
                jdLower.includes(rs.toLowerCase())
            );

            if (partialMatch) {
                partial.push({ jdSkill, resumeSkill: partialMatch });
            } else {
                missing.push(jdSkill);
            }
        }
    }

    return { matched, partial, missing };
}

// ─── Suggestion Generation ──────────────────────────────────────────────────

/**
 * Generate improvement suggestions for missing skills using LLM.
 * @param {string[]} missingSkills - Array of missing skill names.
 * @returns {Array<{skill: string, suggestion: string}>}
 */
async function generateSuggestions(missingSkills) {
    if (!missingSkills.length) return [];

    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'meta-llama/llama-3.3-70b-instruct',
                messages: [
                    {
                        role: 'system',
                        content: `You are a career advisor. For each missing skill, provide a specific, actionable suggestion on how to add it to a resume.
Output ONLY a JSON array with objects having "skill" and "suggestion" keys.
Keep suggestions concise (1-2 sentences) and practical.
No markdown, no explanations outside the JSON.`
                    },
                    {
                        role: 'user',
                        content: `Generate resume improvement suggestions for these missing skills: ${JSON.stringify(missingSkills)}`
                    }
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
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error('Suggestion generation error:', error.message);
        // Fallback suggestions
        return missingSkills.map(skill => ({
            skill,
            suggestion: `Consider gaining experience with ${skill} through online courses, personal projects, or certifications, and add it to your resume.`
        }));
    }
}

// ─── Main Analysis Function ─────────────────────────────────────────────────

/**
 * Perform complete skill gap analysis between resume and job description.
 * @param {string} resumeText - Resume text content.
 * @param {string} jdText - Job description text content.
 * @returns {Object} Skill gap analysis result.
 */
async function analyzeSkillGap(resumeText, jdText) {
    // Step 1: Extract skills from both documents in parallel
    const [jdSkills, resumeSkills] = await Promise.all([
        extractSkills(jdText, 'jd'),
        extractSkills(resumeText, 'resume')
    ]);

    // Step 2: Categorize skills
    const categorized = await categorizeSkills(jdSkills, resumeSkills);

    // Step 3: Generate suggestions for missing skills
    const missingWithSuggestions = await generateSuggestions(categorized.missing || []);

    return {
        matched: categorized.matched || [],
        partial: categorized.partial || [],
        missing: missingWithSuggestions,
        meta: {
            totalJDSkills: jdSkills.length,
            totalResumeSkills: resumeSkills.length,
            matchRate: categorized.matched
                ? Math.round((categorized.matched.length / Math.max(jdSkills.length, 1)) * 100)
                : 0
        }
    };
}

module.exports = { analyzeSkillGap };
