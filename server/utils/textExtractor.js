// Use direct path to avoid pdf-parse test file read on require
const pdf = require('pdf-parse/lib/pdf-parse.js');
const mammoth = require('mammoth');

/**
 * Extract text from a buffer based on file mimetype.
 * @param {Buffer} buffer - The file buffer.
 * @param {string} mimetype - The mimetype of the file.
 * @returns {Promise<string>} - The extracted text.
 */
async function extractText(buffer, mimetype) {
    try {
        if (mimetype === 'application/pdf') {
            const data = await pdf(buffer);
            return cleanText(data.text);
        } else if (
            mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            mimetype === 'application/msword'
        ) {
            const result = await mammoth.extractRawText({ buffer });
            return cleanText(result.value);
        } else {
            throw new Error(`Unsupported file type: ${mimetype}`);
        }
    } catch (error) {
        console.error('Error extracting text:', error);
        throw new Error(`Failed to extract text from file: ${error.message}`);
    }
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
