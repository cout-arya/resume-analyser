const axios = require('axios');
const vectorStore = require('../utils/vectorStore');

/**
 * ATS Scoring Service — v3.0
 * 
 * Multi-dimensional resume-to-JD scoring across 5 weighted dimensions:
 *   - Keyword Match        (25%) — Hard skill & tool keyword overlap
 *   - Semantic Alignment   (30%) — Embedding-based contextual similarity
 *   - Experience Relevance (20%) — LLM-judged role/responsibility fit
 *   - Formatting Quality   (15%) — Structure, sections, readability
 *   - Quantifiable Impact  (10%) — Metrics, numbers, achievements
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'meta-llama/llama-3.3-70b-instruct';

function getHeaders() {
    return {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:4000',
        'X-Title': 'Resume Analyzer'
    };
}

// ─── 1. Keyword Match (25%) ─────────────────────────────────────────────────

async function extractKeywordsFromJD(jdText) {
    try {
        const response = await axios.post(OPENROUTER_URL, {
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: `You are a keyword extraction engine for ATS resume scanning.
Extract ONLY real professional skills, tools, technologies, certifications, and qualifications.

NEVER include: PDF metadata, font names (Helvetica, Courier), encoding names, 
file format terms (ASCII85Decode, FlateDecode), or document structure terms.

Output ONLY a JSON array of strings. No explanations, no markdown.`
                },
                {
                    role: 'user',
                    content: `Extract 15-30 important keywords from this job description. Include:
- Technical skills (languages, frameworks, tools)
- Soft skills (leadership, communication)
- Domain expertise (cloud, ML, finance)
- Certifications or degrees mentioned
- Methodologies (Agile, Scrum, CI/CD)

Job Description:
${jdText.substring(0, 4000)}`
                }
            ],
            temperature: 0.1
        }, { headers: getHeaders() });

        const content = response.data.choices[0].message.content.trim();
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const keywords = JSON.parse(jsonStr);
        return filterGarbageTerms(keywords);
    } catch (error) {
        console.error('Keyword extraction error:', error.message);
        return fallbackKeywordExtraction(jdText);
    }
}

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
        'required', 'preferred', 'including', 'also', 'well', 'using', 'used',
        // PDF garbage
        'pdf', 'reportlab', 'helvetica', 'courier', 'flatedecode', 'ascii85decode',
        'procset', 'imageb', 'imagec', 'imagei', 'winansiencoding', 'type1',
        'truetype', 'endobj', 'startxref', 'xref', 'trailer'
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
 * Filter out PDF metadata terms that might leak through LLM extraction.
 */
function filterGarbageTerms(terms) {
    const garbage = new Set([
        'pdf', 'reportlab', 'reportlab pdf library', 'ascii85decode', 'flatedecode',
        'type1', 'truetype', 'winansiencoding', 'macromanencoding',
        'helvetica', 'helvetica-bold', 'helvetica-oblique', 'courier', 'courier-bold',
        'times-roman', 'times-bold', 'symbol', 'zapfdingbats',
        'procset', 'imageb', 'imagec', 'imagei', 'xobject',
        'font', 'extgstate', 'baseencoding', 'fontdescriptor',
        'mediabox', 'cropbox', 'contents', 'resources'
    ]);

    return terms.filter(t => {
        const lower = t.toLowerCase().trim();
        if (garbage.has(lower)) return false;
        // Filter single characters and very short non-skill terms
        if (lower.length < 2) return false;
        // Filter hex-looking strings
        if (/^[0-9a-f]{6,}$/i.test(lower)) return false;
        return true;
    });
}

/**
 * Calculate keyword match score.
 * Uses fuzzy matching — "React.js" matches "React", "Node" matches "Node.js"
 */
function calculateKeywordScore(keywords, resumeText) {
    if (!keywords.length) return { score: 0, matchedKeywords: [], missingKeywords: keywords };

    const resumeLower = resumeText.toLowerCase();
    const matchedKeywords = [];
    const missingKeywords = [];

    for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();

        // Exact match
        if (resumeLower.includes(keywordLower)) {
            matchedKeywords.push(keyword);
            continue;
        }

        // Fuzzy: strip dots, dashes, "js" suffix for framework matching
        const normalized = keywordLower.replace(/[.\-]/g, '').replace(/js$/, '');
        const resumeNormalized = resumeLower.replace(/[.\-]/g, '').replace(/js\b/g, '');
        if (normalized.length > 2 && resumeNormalized.includes(normalized)) {
            matchedKeywords.push(keyword);
            continue;
        }

        // Check word stem (e.g., "containerization" matches "container")
        const stem = keywordLower.substring(0, Math.min(keywordLower.length - 2, 6));
        if (stem.length >= 4 && resumeLower.includes(stem)) {
            matchedKeywords.push(keyword);
            continue;
        }

        missingKeywords.push(keyword);
    }

    const matchRatio = matchedKeywords.length / keywords.length;
    const score = Math.round(matchRatio * 25);

    return { score, matchedKeywords, missingKeywords };
}

// ─── 2. Semantic Alignment (30%) ────────────────────────────────────────────

async function calculateSemanticScore(resumeText, jdText) {
    try {
        // Chunk the resume into sections for more granular comparison
        const resumeChunks = chunkText(resumeText, 500);
        const jdChunks = chunkText(jdText, 500);

        // Get embeddings
        const allTexts = [...resumeChunks, ...jdChunks];
        const embeddings = await vectorStore.getEmbeddings(allTexts);

        const resumeEmbeddings = embeddings.slice(0, resumeChunks.length);
        const jdEmbeddings = embeddings.slice(resumeChunks.length);

        // Calculate best-match similarity for each JD chunk
        let totalSim = 0;
        for (const jdEmb of jdEmbeddings) {
            let bestSim = 0;
            for (const resEmb of resumeEmbeddings) {
                const sim = vectorStore.cosineSimilarity(resEmb, jdEmb);
                bestSim = Math.max(bestSim, sim);
            }
            totalSim += bestSim;
        }

        const avgSimilarity = totalSim / Math.max(jdEmbeddings.length, 1);

        // Map 0.3–0.85 range to 0–30 (realistic similarity range)
        const normalizedScore = Math.max(0, Math.min(1, (avgSimilarity - 0.3) / 0.55));
        const score = Math.round(normalizedScore * 30);

        return { score, similarity: Math.round(avgSimilarity * 100) / 100 };
    } catch (error) {
        console.error('Semantic similarity error:', error.message);
        return { score: 0, similarity: 0 };
    }
}

function chunkText(text, chunkSize = 500) {
    const words = text.split(/\s+/);
    const chunks = [];
    for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(' '));
    }
    return chunks.length > 0 ? chunks : [text];
}

// ─── 3. Experience Relevance (20%) ──────────────────────────────────────────

async function calculateExperienceRelevance(resumeText, jdText) {
    try {
        const response = await axios.post(OPENROUTER_URL, {
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: `You are an expert recruiter evaluating resume-to-job-description fit.
Score the candidate's EXPERIENCE RELEVANCE on a scale of 0-20.

Consider:
- Do their past roles/responsibilities align with the JD requirements?
- Is their seniority level appropriate?
- Do they have domain experience mentioned in the JD?
- Do they have relevant project experience?

Output ONLY a JSON object: {"score": <0-20>, "reasoning": "<1 sentence>"}`
                },
                {
                    role: 'user',
                    content: `Resume (first 2000 chars):
${resumeText.substring(0, 2000)}

Job Description (first 2000 chars):
${jdText.substring(0, 2000)}

Rate experience relevance (0-20).`
                }
            ],
            temperature: 0.2
        }, { headers: getHeaders() });

        const content = response.data.choices[0].message.content.trim();
        const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const result = JSON.parse(jsonStr);
        return {
            score: Math.min(20, Math.max(0, Math.round(result.score))),
            reasoning: result.reasoning || ''
        };
    } catch (error) {
        console.error('Experience relevance error:', error.message);
        return { score: 10, reasoning: 'Unable to evaluate — default score applied.' };
    }
}

// ─── 4. Formatting Quality (15%) ────────────────────────────────────────────

function calculateFormattingScore(resumeText) {
    let score = 0;
    const checks = {};

    // Check for key resume sections (3 pts each, max 9)
    const sections = [
        { name: 'skillsSection', pattern: /\b(skills|technical skills|core competencies|technologies|proficiencies)\b/i },
        { name: 'experienceSection', pattern: /\b(experience|work experience|professional experience|employment|work history)\b/i },
        { name: 'educationSection', pattern: /\b(education|academic|qualification|degree|university|college)\b/i }
    ];

    for (const { name, pattern } of sections) {
        if (pattern.test(resumeText)) {
            score += 3;
            checks[name] = true;
        } else {
            checks[name] = false;
        }
    }

    // Check for contact info (2 pts)
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(resumeText);
    const hasPhone = /[\+]?\d[\d\-\s]{7,}\d/.test(resumeText);
    if (hasEmail || hasPhone) {
        score += 2;
        checks.contactInfo = true;
    } else {
        checks.contactInfo = false;
    }

    // Check for bullet points / structured content (2 pts)
    const lines = resumeText.split('\n');
    const bulletLines = lines.filter(line =>
        /^\s*[\u2022\u2023\u25E6\u2043\u2219•\-\*]\s/.test(line) ||
        /^\s*\d+[\.)\]]\s/.test(line)
    );
    const bulletRatio = bulletLines.length / Math.max(lines.length, 1);
    if (bulletRatio > 0.1) {
        score += 2;
        checks.bulletPoints = true;
    } else {
        checks.bulletPoints = false;
    }

    return { score: Math.min(15, score), checks };
}

// ─── 5. Quantifiable Impact (10%) ───────────────────────────────────────────

function calculateImpactScore(resumeText) {
    let score = 0;
    const details = {};

    // Check for numbers/percentages indicating quantified achievements
    const percentMatches = resumeText.match(/\d+\s*%/g) || [];
    const dollarMatches = resumeText.match(/\$[\d,]+[kKmMbB]?/g) || [];
    const numberMatches = resumeText.match(/\b\d{2,}\b/g) || []; // 2+ digit numbers

    // Action verbs that indicate measurable impact
    const impactVerbs = [
        'increased', 'decreased', 'improved', 'reduced', 'achieved',
        'delivered', 'generated', 'saved', 'grew', 'launched',
        'built', 'developed', 'designed', 'implemented', 'automated',
        'led', 'managed', 'mentored', 'optimized', 'scaled',
        'streamlined', 'accelerated', 'consolidated', 'transformed'
    ];
    const resumeLower = resumeText.toLowerCase();
    const verbCount = impactVerbs.filter(v => resumeLower.includes(v)).length;

    // Score: quantified metrics (up to 5 pts)
    const metricCount = percentMatches.length + dollarMatches.length;
    if (metricCount >= 5) score += 5;
    else if (metricCount >= 3) score += 4;
    else if (metricCount >= 1) score += 2;

    details.quantifiedMetrics = metricCount;

    // Score: action verbs (up to 5 pts)
    if (verbCount >= 8) score += 5;
    else if (verbCount >= 5) score += 4;
    else if (verbCount >= 3) score += 3;
    else if (verbCount >= 1) score += 1;

    details.actionVerbs = verbCount;

    return { score: Math.min(10, score), details };
}

// ─── Summary Generation ─────────────────────────────────────────────────────

async function generateSummary(breakdown, keywordData, experienceData, impactData) {
    const totalScore = breakdown.keywordMatch + breakdown.semanticAlignment +
        breakdown.experienceRelevance + breakdown.formatting + breakdown.quantifiableImpact;

    try {
        const response = await axios.post(OPENROUTER_URL, {
            model: MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are an ATS expert. Write a concise 2-3 sentence summary. Be specific and actionable. No markdown.'
                },
                {
                    role: 'user',
                    content: `ATS Score Breakdown (total ${totalScore}/100):
- Keyword Match: ${breakdown.keywordMatch}/25 (matched: ${keywordData.matchedKeywords.length}, missing: ${keywordData.missingKeywords.length})
- Semantic Alignment: ${breakdown.semanticAlignment}/30
- Experience Relevance: ${breakdown.experienceRelevance}/20 — ${experienceData.reasoning}
- Formatting: ${breakdown.formatting}/15
- Quantifiable Impact: ${breakdown.quantifiableImpact}/10 (${impactData.details.quantifiedMetrics} metrics, ${impactData.details.actionVerbs} action verbs)

Top missing keywords: ${keywordData.missingKeywords.slice(0, 8).join(', ')}
Top matched keywords: ${keywordData.matchedKeywords.slice(0, 8).join(', ')}

Write a helpful, specific summary of this resume's ATS performance and top 2-3 improvements to make.`
                }
            ],
            temperature: 0.3
        }, { headers: getHeaders() });

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Summary generation error:', error.message);
        if (totalScore >= 75) return 'Strong match. Your resume aligns well with the job description across keywords, experience, and skills.';
        if (totalScore >= 50) return `Moderate match (${totalScore}/100). Focus on adding missing keywords: ${keywordData.missingKeywords.slice(0, 5).join(', ')}.`;
        return `Low match (${totalScore}/100). Significant gaps in keywords and experience. Prioritize: ${keywordData.missingKeywords.slice(0, 5).join(', ')}.`;
    }
}

// ─── Main Scoring Function ──────────────────────────────────────────────────

async function calculateATSScore(resumeText, jdText) {
    // Run independent analyses in parallel
    const [keywords, semanticResult, experienceResult] = await Promise.all([
        extractKeywordsFromJD(jdText),
        calculateSemanticScore(resumeText, jdText),
        calculateExperienceRelevance(resumeText, jdText)
    ]);

    // Calculate keyword match
    const keywordResult = calculateKeywordScore(keywords, resumeText);

    // Calculate formatting score
    const formattingResult = calculateFormattingScore(resumeText);

    // Calculate impact score
    const impactResult = calculateImpactScore(resumeText);

    const breakdown = {
        keywordMatch: keywordResult.score,
        semanticAlignment: semanticResult.score,
        experienceRelevance: experienceResult.score,
        formatting: formattingResult.score,
        quantifiableImpact: impactResult.score
    };

    const totalScore = breakdown.keywordMatch + breakdown.semanticAlignment +
        breakdown.experienceRelevance + breakdown.formatting + breakdown.quantifiableImpact;

    // Generate summary
    const summary = await generateSummary(breakdown, keywordResult, experienceResult, impactResult);

    return {
        score: totalScore,
        breakdown,
        details: {
            matchedKeywords: keywordResult.matchedKeywords,
            missingKeywords: keywordResult.missingKeywords,
            semanticSimilarity: semanticResult.similarity,
            formattingChecks: formattingResult.checks,
            experienceReasoning: experienceResult.reasoning,
            impactMetrics: impactResult.details
        },
        summary
    };
}

module.exports = { calculateATSScore };
