// Use direct path to avoid pdf-parse test file read on require
const pdf = require('pdf-parse/lib/pdf-parse.js');
const mammoth = require('mammoth');

/**
 * Known PDF structural tokens that should NEVER appear in extracted text.
 * These appear when the raw fallback parser picks up PDF internals.
 */
const PDF_GARBAGE_TOKENS = new Set([
    'pdf', 'reportlab', 'ascii85decode', 'flatedecode', 'type1', 'truetype',
    'winansiencoding', 'macosromanencoding', 'helvetica', 'helvetica-bold',
    'helvetica-oblique', 'helvetica-boldoblique', 'courier', 'courier-bold',
    'courier-oblique', 'courier-boldoblique', 'times-roman', 'times-bold',
    'times-italic', 'times-bolditalic', 'symbol', 'zapfdingbats',
    'procset', 'imageb', 'imagec', 'imagei', 'xobject', 'font',
    'extgstate', 'colorspace', 'pattern', 'shading', 'properties',
    'mediabox', 'cropbox', 'bleedbox', 'trimbox', 'artbox',
    'obj', 'endobj', 'stream', 'endstream', 'xref', 'trailer',
    'startxref', 'catalog', 'pages', 'page', 'contents', 'resources',
    'annots', 'structtreeroot', 'markinfo', 'outputintents',
    'linearized', 'encrypt', 'info', 'cross-reference',
    'reportlab pdf library', 'www.reportlab.com'
]);

/**
 * Extract text from a buffer based on file mimetype.
 * @param {Buffer} buffer - The file buffer.
 * @param {string} mimetype - The mimetype of the file.
 * @returns {Promise<string>} - The extracted text.
 */
async function extractText(buffer, mimetype) {
    try {
        if (mimetype === 'application/pdf') {
            try {
                const data = await pdf(buffer, { max: 50 });
                const cleaned = sanitizePdfText(data.text);
                if (cleaned.length > 50) {
                    return cleanText(cleaned);
                }
                // If pdf-parse returned mostly garbage, try raw extraction
                throw new Error('pdf-parse returned insufficient clean text');
            } catch (pdfError) {
                console.warn('pdf-parse failed, attempting raw text extraction:', pdfError.message);
                const rawText = extractRawTextFromBuffer(buffer);
                if (rawText && rawText.length > 50) {
                    return cleanText(sanitizePdfText(rawText));
                }
                throw pdfError;
            }
        } else if (
            mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimetype === 'application/msword'
        ) {
            const result = await mammoth.extractRawText({ buffer });
            return cleanText(result.value);
        } else if (mimetype === 'text/plain') {
            return cleanText(buffer.toString('utf-8'));
        } else {
            throw new Error(`Unsupported file type: ${mimetype}`);
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error(`Failed to extract text from file: ${error.message}`);
    }
}

/**
 * Remove PDF structural metadata from extracted text.
 * This catches tokens like "ReportLab", "FlateDecode", "Helvetica", etc.
 */
function sanitizePdfText(text) {
    if (!text) return '';

    // Remove common PDF metadata patterns
    let cleaned = text
        // Remove PDF version headers
        .replace(/%PDF-[\d.]+/g, '')
        // Remove PDF object references (e.g., "0 0 obj", "12 0 R")
        .replace(/\b\d+\s+\d+\s+(obj|R)\b/g, '')
        // Remove PDF stream markers
        .replace(/\b(endobj|endstream|startxref|%%EOF)\b/gi, '')
        // Remove PDF dictionary entries like /Type /Page /Resources etc.
        .replace(/\/[A-Z][A-Za-z0-9]+/g, ' ')
        // Remove hex strings << >> 
        .replace(/<<[^>]*>>/g, '')
        // Remove binary-looking sequences
        .replace(/[\x00-\x08\x0E-\x1F\x7F-\xFF]+/g, ' ')
        // Remove PDF font descriptors
        .replace(/\b(TrueType|Type1|CIDFont|FontDescriptor|Encoding|BaseFont)\b/gi, '')
        // Remove ReportLab signatures
        .replace(/ReportLab[^\n]*/gi, '')
        .replace(/www\.reportlab\.com/gi, '')
        // Remove PDF filter names
        .replace(/\b(ASCII85Decode|FlateDecode|LZWDecode|DCTDecode|RunLengthDecode|CCITTFaxDecode)\b/gi, '')
        // Remove font names that aren't real content
        .replace(/\b(Helvetica|Courier|Times-Roman|ZapfDingbats|Symbol)(-Bold|-Oblique|-BoldOblique|-Italic|-BoldItalic)?\b/gi, '')
        // Remove ProcSet references
        .replace(/\bProcSet\b/gi, '')
        // Remove ImageB/ImageC/ImageI
        .replace(/\bImage[BCI]\b/gi, '')
        // Remove WinAnsiEncoding and similar
        .replace(/\b\w*Encoding\b/gi, '');

    // Split into words and filter out any remaining garbage
    const words = cleaned.split(/\s+/);
    const filteredWords = words.filter(word => {
        const lower = word.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!lower || lower.length < 2) return false;
        if (PDF_GARBAGE_TOKENS.has(lower)) return false;
        // Filter out hex-like strings (e.g., "a3f2b1")
        if (/^[0-9a-f]{6,}$/i.test(word)) return false;
        return true;
    });

    return filteredWords.join(' ');
}

/**
 * Last-resort extraction: scan the raw PDF buffer for readable text streams.
 * This works for many PDFs where pdf-parse chokes on XRef tables.
 */
function extractRawTextFromBuffer(buffer) {
    const text = buffer.toString('utf-8');
    const chunks = [];

    // Extract text between BT (Begin Text) and ET (End Text) PDF operators
    const btEtRegex = /BT\s([\s\S]*?)ET/g;
    let match;
    while ((match = btEtRegex.exec(text)) !== null) {
        const block = match[1];
        // Extract text from Tj operators
        const tjRegex = /\(([^)]*)\)\s*Tj/g;
        let tjMatch;
        while ((tjMatch = tjRegex.exec(block)) !== null) {
            const decoded = tjMatch[1]
                .replace(/\\n/g, '\n')
                .replace(/\\r/g, '')
                .replace(/\\t/g, ' ')
                .replace(/\\\(/g, '(')
                .replace(/\\\)/g, ')');
            if (decoded.trim().length > 0) {
                chunks.push(decoded);
            }
        }
        // Extract from TJ arrays
        const tjArrayRegex = /\[([^\]]*)\]\s*TJ/g;
        let arrMatch;
        while ((arrMatch = tjArrayRegex.exec(block)) !== null) {
            const inner = arrMatch[1];
            const strRegex = /\(([^)]*)\)/g;
            let strMatch;
            while ((strMatch = strRegex.exec(inner)) !== null) {
                const decoded = strMatch[1]
                    .replace(/\\n/g, '\n')
                    .replace(/\\r/g, '')
                    .replace(/\\\(/g, '(')
                    .replace(/\\\)/g, ')');
                if (decoded.trim().length > 0) {
                    chunks.push(decoded);
                }
            }
        }
    }

    return chunks.join(' ');
}

/**
 * Clean extracted text by removing excessive whitespace.
 * @param {string} text - The raw text.
 * @returns {string} - The cleaned text.
 */
function cleanText(text) {
    if (!text) return '';
    return text
        .replace(/\r\n/g, '\n')
        .replace(/\t/g, ' ')
        .replace(/ +/g, ' ')
        .replace(/\n\s*\n/g, '\n\n') // Preserve paragraph breaks
        .trim();
}

module.exports = { extractText };
