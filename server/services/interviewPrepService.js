const axios = require('axios');

/**
 * Interview Preparation Service
 * Generates likely interview questions with suggested answer strategies
 * based on the candidate's resume and target job description.
 */

/**
 * Generate interview questions using LLM.
 * @param {string} resumeText - Resume text content.
 * @param {string} jdText - Job description text content.
 * @returns {Object} Interview prep result with questions array.
 */
async function generateInterviewQuestions(resumeText, jdText) {
    try {
        const response = await axios.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: 'meta-llama/llama-3.3-70b-instruct',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert technical interviewer. Given a resume and job description, generate exactly 8 interview questions the candidate is likely to face.

For each question:
- Classify it: Behavioral / Technical / Situational / Role-specific
- Write a suggested answer strategy drawn ONLY from the candidate's resume (2-4 sentences)
- Rate difficulty: Easy / Medium / Hard

Respond ONLY in this JSON format, no markdown, no explanations:
[
  {
    "question": "string",
    "type": "Behavioral | Technical | Situational | Role-specific",
    "difficulty": "Easy | Medium | Hard",
    "suggestedAnswer": "string"
  }
]`
                    },
                    {
                        role: 'user',
                        content: `Resume:\n${resumeText}\n\nJob Description:\n${jdText}\n\nGenerate 8 interview questions.`
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
        const questions = JSON.parse(jsonStr);

        return {
            questions,
            meta: {
                totalQuestions: questions.length,
                generatedAt: new Date().toISOString()
            }
        };
    } catch (error) {
        console.error('Interview question generation error:', error.message);
        // Fallback: return 4 generic questions
        return {
            questions: [
                {
                    question: 'Tell me about yourself and your relevant experience for this role.',
                    type: 'Behavioral',
                    difficulty: 'Easy',
                    suggestedAnswer: 'Walk through your career chronologically, emphasizing experiences that match the job description requirements.'
                },
                {
                    question: 'Describe a challenging technical problem you solved recently.',
                    type: 'Technical',
                    difficulty: 'Medium',
                    suggestedAnswer: 'Pick a specific project from your resume. Describe the problem, your approach, and the measurable outcome.'
                },
                {
                    question: 'How do you handle tight deadlines and competing priorities?',
                    type: 'Situational',
                    difficulty: 'Medium',
                    suggestedAnswer: 'Use a specific example from your work experience. Describe how you prioritized tasks and communicated with stakeholders.'
                },
                {
                    question: 'Where do you see yourself in 3 years?',
                    type: 'Behavioral',
                    difficulty: 'Easy',
                    suggestedAnswer: 'Align your growth goals with the career path this role offers. Show enthusiasm for deepening expertise in the relevant domain.'
                }
            ],
            meta: {
                totalQuestions: 4,
                generatedAt: new Date().toISOString(),
                fallback: true
            }
        };
    }
}

module.exports = { generateInterviewQuestions };
