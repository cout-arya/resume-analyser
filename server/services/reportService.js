const PDFDocument = require('pdfkit');

/**
 * Report Generation Service
 * Builds a formatted PDF report from analysis data using PDFKit.
 */

// ─── Color Constants ─────────────────────────────────────────────────────────
const COLORS = {
    primary: '#4F46E5',
    success: '#059669',
    warning: '#D97706',
    danger: '#DC2626',
    gray: '#6B7280',
    lightGray: '#F3F4F6',
    darkText: '#111827',
    bodyText: '#374151'
};

/**
 * Generate a PDF analysis report.
 * @param {Object} data - Report data
 * @param {Object} data.atsScore - ATS score result
 * @param {Object} data.skillGap - Skill gap result
 * @param {Array} data.conversationHistory - Q&A conversation
 * @param {Object} data.interviewPrep - Interview prep questions (optional)
 * @param {string} data.resumeFilename - Resume filename
 * @param {string} data.jdFilename - JD filename
 * @returns {PDFDocument} PDF document (pipeable stream)
 */
function generateReport(data) {
    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
            Title: 'Resume Analysis Report',
            Author: 'Smart Resume Analyzer',
            Subject: 'Resume vs Job Description Analysis'
        }
    });

    // ─── Page 1: Header ──────────────────────────────────────────────────
    doc.fontSize(24)
       .fillColor(COLORS.primary)
       .text('Smart Resume Analyzer', { align: 'center' });

    doc.moveDown(0.3);
    doc.fontSize(12)
       .fillColor(COLORS.gray)
       .text('Analysis Report', { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(10)
       .fillColor(COLORS.bodyText);

    if (data.resumeFilename) {
        doc.text(`Resume: ${data.resumeFilename}`, { continued: false });
    }
    if (data.jdFilename) {
        doc.text(`Job Description: ${data.jdFilename}`, { continued: false });
    }
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);

    doc.moveDown(1);
    drawDivider(doc);

    // ─── Section 1: ATS Score ────────────────────────────────────────────
    if (data.atsScore) {
        doc.moveDown(0.5);
        sectionHeader(doc, 'ATS Score Analysis');

        const score = data.atsScore.score || 0;
        const scoreColor = score >= 75 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.danger;

        doc.fontSize(36)
           .fillColor(scoreColor)
           .text(`${score} / 100`, { align: 'center' });

        doc.moveDown(0.5);

        // Breakdown
        if (data.atsScore.breakdown) {
            const bd = data.atsScore.breakdown;
            doc.fontSize(10).fillColor(COLORS.bodyText);
            doc.text(`Keyword Match:         ${bd.keywordMatch || 0} / 30`);
            doc.text(`Semantic Similarity:   ${bd.semanticSimilarity || 0} / 50`);
            doc.text(`Formatting:            ${bd.formatting || 0} / 20`);
        }

        doc.moveDown(0.5);

        // Keywords
        if (data.atsScore.details) {
            const details = data.atsScore.details;
            if (details.matchedKeywords && details.matchedKeywords.length > 0) {
                doc.fontSize(9).fillColor(COLORS.success);
                doc.text(`✓ Matched: ${details.matchedKeywords.join(', ')}`);
            }
            if (details.missingKeywords && details.missingKeywords.length > 0) {
                doc.fontSize(9).fillColor(COLORS.danger);
                doc.text(`✗ Missing: ${details.missingKeywords.join(', ')}`);
            }
        }

        // Summary
        if (data.atsScore.summary) {
            doc.moveDown(0.5);
            doc.fontSize(10).fillColor(COLORS.bodyText);
            doc.text(data.atsScore.summary, { align: 'left' });
        }

        doc.moveDown(0.5);
        drawDivider(doc);
    }

    // ─── Section 2: Skill Gap Analysis ───────────────────────────────────
    if (data.skillGap) {
        doc.moveDown(0.5);
        sectionHeader(doc, 'Skill Gap Analysis');

        if (data.skillGap.meta) {
            doc.fontSize(10).fillColor(COLORS.bodyText);
            doc.text(`Match Rate: ${data.skillGap.meta.matchRate || 0}% of required skills found`);
            doc.moveDown(0.3);
        }

        // Matched
        if (data.skillGap.matched && data.skillGap.matched.length > 0) {
            doc.fontSize(9).fillColor(COLORS.success);
            doc.text('Matched Skills:');
            data.skillGap.matched.forEach(skill => {
                doc.text(`  ✓ ${skill}`);
            });
            doc.moveDown(0.3);
        }

        // Partial
        if (data.skillGap.partial && data.skillGap.partial.length > 0) {
            doc.fontSize(9).fillColor(COLORS.warning);
            doc.text('Partial Matches:');
            data.skillGap.partial.forEach(p => {
                const jd = typeof p === 'string' ? p : p.jdSkill;
                const resume = typeof p === 'string' ? '' : ` → ${p.resumeSkill}`;
                doc.text(`  ~ ${jd}${resume}`);
            });
            doc.moveDown(0.3);
        }

        // Missing
        if (data.skillGap.missing && data.skillGap.missing.length > 0) {
            doc.fontSize(9).fillColor(COLORS.danger);
            doc.text('Missing Skills:');
            data.skillGap.missing.forEach(m => {
                const skill = typeof m === 'string' ? m : m.skill;
                const suggestion = typeof m === 'object' && m.suggestion ? ` — ${m.suggestion}` : '';
                doc.text(`  ✗ ${skill}${suggestion}`);
            });
        }

        doc.moveDown(0.5);
        drawDivider(doc);
    }

    // ─── Section 3: Interview Prep ───────────────────────────────────────
    if (data.interviewPrep && data.interviewPrep.questions && data.interviewPrep.questions.length > 0) {
        doc.moveDown(0.5);
        sectionHeader(doc, 'Interview Preparation');

        data.interviewPrep.questions.forEach((q, idx) => {
            // Check if we need a new page
            if (doc.y > 700) doc.addPage();

            doc.fontSize(10).fillColor(COLORS.darkText);
            doc.text(`${idx + 1}. ${q.question}`, { continued: false });

            doc.fontSize(8).fillColor(COLORS.gray);
            doc.text(`   [${q.type}] [${q.difficulty}]`);

            if (q.suggestedAnswer) {
                doc.fontSize(8).fillColor(COLORS.bodyText);
                doc.text(`   Strategy: ${q.suggestedAnswer}`, { indent: 12 });
            }
            doc.moveDown(0.3);
        });

        doc.moveDown(0.5);
        drawDivider(doc);
    }

    // ─── Section 4: Q&A Session Highlights ───────────────────────────────
    if (data.conversationHistory && data.conversationHistory.length > 0) {
        if (doc.y > 650) doc.addPage();

        doc.moveDown(0.5);
        sectionHeader(doc, 'Q&A Session Highlights');

        data.conversationHistory.forEach(msg => {
            if (doc.y > 700) doc.addPage();

            if (msg.role === 'user') {
                doc.fontSize(9).fillColor(COLORS.primary);
                doc.text(`Q: ${msg.content}`, { continued: false });
            } else if (msg.role === 'assistant') {
                // Strip markdown formatting for PDF
                const plainText = msg.content
                    .replace(/\*\*(.*?)\*\*/g, '$1')
                    .replace(/\*(.*?)\*/g, '$1')
                    .replace(/#{1,6}\s/g, '')
                    .replace(/`(.*?)`/g, '$1')
                    .replace(/\n{3,}/g, '\n\n');

                doc.fontSize(9).fillColor(COLORS.bodyText);
                doc.text(`A: ${plainText}`, { continued: false });
                doc.moveDown(0.3);
            }
        });
    } else {
        doc.moveDown(0.5);
        doc.fontSize(10).fillColor(COLORS.gray);
        doc.text('No Q&A session recorded.', { align: 'center' });
    }

    // ─── Footer ──────────────────────────────────────────────────────────
    doc.moveDown(2);
    doc.fontSize(8).fillColor(COLORS.gray);
    doc.text('Generated by Smart Resume Analyzer — AI-powered resume analysis', { align: 'center' });

    doc.end();
    return doc;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sectionHeader(doc, title) {
    doc.fontSize(14).fillColor(COLORS.primary).text(title);
    doc.moveDown(0.3);
}

function drawDivider(doc) {
    const y = doc.y;
    doc.strokeColor(COLORS.lightGray)
       .lineWidth(1)
       .moveTo(50, y)
       .lineTo(545, y)
       .stroke();
}

module.exports = { generateReport };
