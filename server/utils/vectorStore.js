const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const VECTORS_FILE = path.join(__dirname, '../data/vectors.json');

class VectorStore {
    constructor() {
        this.vectors = [];
        this.loadVectors();
    }

    loadVectors() {
        try {
            if (fs.existsSync(VECTORS_FILE)) {
                const data = fs.readFileSync(VECTORS_FILE, 'utf8');
                this.vectors = JSON.parse(data);
            } else {
                // Ensure directory exists
                const dir = path.dirname(VECTORS_FILE);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                this.vectors = [];
            }
        } catch (error) {
            console.error('Error loading vectors:', error);
            this.vectors = [];
        }
    }

    saveVectors() {
        try {
            fs.writeFileSync(VECTORS_FILE, JSON.stringify(this.vectors, null, 2));
        } catch (error) {
            console.error('Error saving vectors:', error);
        }
    }

    async addDocument(docId, text, type) {
        const chunks = this.chunkText(text);
        const embeddings = await this.getEmbeddings(chunks);

        const docEntry = {
            documentId: docId,
            type,
            chunks: chunks.map((chunk, i) => ({
                id: uuidv4(),
                text: chunk,
                embedding: embeddings[i],
                metadata: {
                    chunkIndex: i
                }
            })),
            createdAt: new Date().toISOString()
        };

        // Remove existing document if exists (update)
        this.vectors = this.vectors.filter(d => d.documentId !== docId);
        this.vectors.push(docEntry);
        this.saveVectors();

        return docEntry;
    }

    chunkText(text, maxChars = 500) {
        const paragraphs = text.split(/\n\n+/);
        const chunks = [];
        let currentChunk = '';

        for (const para of paragraphs) {
            if ((currentChunk + para).length > maxChars && currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = para;
            } else {
                currentChunk += (currentChunk ? '\n\n' : '') + para;
            }
        }
        if (currentChunk) chunks.push(currentChunk.trim());
        return chunks;
    }

    async getEmbeddings(texts) {
        if (!texts.length) return [];

        try {
            const response = await axios.post(
                'https://openrouter.ai/api/v1/embeddings',
                {
                    model: 'openai/text-embedding-3-small',
                    input: texts
                },
                {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'HTTP-Referer': process.env.APP_URL || 'http://localhost:5000',
                        'X-Title': 'Resume Analyzer'
                    }
                }
            );

            // OpenRouter/OpenAI returns data in order
            return response.data.data.map(item => item.embedding);
        } catch (error) {
            console.error('Error fetching embeddings:', error.response?.data || error.message);
            throw new Error('Failed to generate embeddings');
        }
    }

    async search(query, filterDocIds = [], k = 3) {
        try {
            // 1. Get query embedding
            const [queryEmbedding] = await this.getEmbeddings([query]);

            // 2. Gather all relevant chunks
            let allChunks = [];
            for (const doc of this.vectors) {
                if (filterDocIds.length > 0 && !filterDocIds.includes(doc.documentId)) {
                    continue;
                }
                allChunks = allChunks.concat(doc.chunks.map(c => ({
                    ...c,
                    docType: doc.type,
                    docId: doc.documentId
                })));
            }

            // 3. Calculate cosine similarity
            const scoredChunks = allChunks.map(chunk => ({
                ...chunk,
                score: this.cosineSimilarity(chunk.embedding, queryEmbedding)
            }));

            // 4. Sort and return top-k
            return scoredChunks
                .sort((a, b) => b.score - a.score)
                .slice(0, k);

        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }

    cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        if (magA === 0 || magB === 0) return 0;
        return dotProduct / (magA * magB);
    }
}

module.exports = new VectorStore();
