# Product Requirements Document (PRD)
## Smart Resume & JD Analyzer

**Version:** 1.0  
**Date:** February 11, 2026  
**Project Type:** RAG-based Text Intelligence Platform  
**Tech Stack:** MERN + RAG + Docker + CI/CD

---

## 1. Executive Summary

### 1.1 Product Vision
A RAG-powered web application that intelligently analyzes resumes against job descriptions, providing contextual insights on candidate suitability, skill gaps, and improvement recommendations through natural language queries.

### 1.2 Core Value Proposition
- **Unique Differentiation**: Combines vector-based semantic search with LLM reasoning for contextual resume analysis
- **Real-World Relevance**: Solves actual hiring pain points (candidate screening, skill gap analysis)
- **Demo-Friendly**: Interactive Q&A interface with instant, explainable results
- **Production-Ready**: Containerized deployment with automated CI/CD pipeline

### 1.3 Target Audience
- **Primary**: Job seekers optimizing resumes for specific roles
- **Secondary**: Recruiters performing initial candidate screening
- **Tertiary**: Career coaches providing resume feedback

---

## 2. Technical Architecture

### 2.1 System Overview

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React UI]
        Upload[File Upload Component]
        Chat[Q&A Interface]
    end
    
    subgraph "Backend Layer"
        API[Express.js API]
        RAG[RAG Engine]
        VectorDB[Vector Store]
    end
    
    subgraph "AI Layer"
        Embed[Embedding Service<br/>OpenRouter API]
        LLM[LLM Service<br/>Meta Llama 3.3 70B]
    end
    
    subgraph "Storage Layer"
        MongoDB[(MongoDB)]
        VectorJSON[Vector JSON Store]
        Files[File Storage]
    end
    
    subgraph "DevOps Layer"
        Docker[Docker Containers]
        CICD[GitHub Actions CI/CD]
        Registry[Container Registry]
    end
    
    UI --> API
    Upload --> API
    Chat --> API
    API --> RAG
    RAG --> VectorDB
    RAG --> LLM
    RAG --> Embed
    API --> MongoDB
    VectorDB --> VectorJSON
    API --> Files
    
    Docker -.-> UI
    Docker -.-> API
    Docker -.-> MongoDB
    CICD -.-> Docker
    CICD -.-> Registry
```

### 2.2 Technology Stack

#### Frontend
- **Framework**: React 18+
- **UI Library**: Material-UI (MUI) or Chakra UI
- **State Management**: React Context API + Hooks
- **File Handling**: react-dropzone
- **HTTP Client**: Axios

#### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **File Processing**: 
  - `pdf-parse` for PDF extraction
  - `mammoth` for DOCX parsing
- **Authentication**: JWT (JSON Web Tokens)

#### RAG Infrastructure
- **Embedding Model**: `openai/text-embedding-3-small` (via OpenRouter)
  - Dimension: 1536
  - Cost: ~$0.0001 per 1K tokens
- **LLM**: `meta-llama/llama-3.3-70b-instruct` (via OpenRouter)
  - Cost: ~$0.0005 per request
  - Fallback: `qwen/qwen-2.5-7b-instruct`
- **Vector Store**: Custom JSON-based implementation with cosine similarity
- **Chunking Strategy**: Semantic chunking (~500 characters with overlap)

#### DevOps & Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Container Registry**: Docker Hub or GitHub Container Registry
- **Deployment**: Render / Railway / AWS ECS
- **Environment Management**: dotenv

---

## 3. Core Features & Requirements

### 3.1 Feature: Document Upload & Processing

#### User Story
> "As a job seeker, I want to upload my resume and a job description so that the system can analyze them contextually."

#### Acceptance Criteria
- [ ] Support PDF and DOCX formats for both resume and JD
- [ ] File size limit: 5MB per document
- [ ] Extract text content with formatting preservation
- [ ] Display upload progress and validation feedback
- [ ] Store original files and extracted text in MongoDB
- [ ] Generate unique session ID for each upload pair

#### Technical Implementation
```javascript
// Backend: File processing pipeline
POST /api/upload/resume
POST /api/upload/job-description

// Steps:
1. Validate file type and size
2. Extract text using pdf-parse/mammoth
3. Clean and normalize text (remove excessive whitespace, special chars)
4. Store in MongoDB with metadata (filename, upload date, user ID)
5. Return document ID and preview
```

---

### 3.2 Feature: RAG-Based Vector Indexing

#### User Story
> "As the system, I need to convert uploaded documents into searchable vector embeddings for semantic retrieval."

#### Acceptance Criteria
- [ ] Chunk resume text into semantic segments (~500 chars)
- [ ] Chunk JD text into requirement sections
- [ ] Generate embeddings using OpenRouter API
- [ ] Store vectors in JSON-based vector store
- [ ] Index by document ID for fast retrieval
- [ ] Handle embedding API failures gracefully

#### Technical Implementation

**Chunking Strategy:**
```javascript
// utils/textChunker.js
function semanticChunk(text, maxChars = 500) {
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';
  
  for (const para of paragraphs) {
    if ((currentChunk + para).length > maxChars && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += '\n\n' + para;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}
```

**Embedding Generation:**
```javascript
// utils/embeddings.js
async function generateEmbedding(text) {
  const response = await axios.post(
    'https://openrouter.ai/api/v1/embeddings',
    {
      model: 'openai/text-embedding-3-small',
      input: text
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL,
        'X-Title': 'Resume Analyzer'
      }
    }
  );
  return response.data.data[0].embedding; // 1536-dim vector
}
```

**Vector Store Structure:**
```json
{
  "documentId": "resume_12345",
  "type": "resume",
  "chunks": [
    {
      "id": "chunk_0",
      "text": "Experienced MERN Stack Developer with 3 years...",
      "embedding": [0.123, -0.456, ...], // 1536 dimensions
      "metadata": {
        "section": "summary",
        "position": 0
      }
    }
  ]
}
```

---

### 3.3 Feature: Intelligent Q&A Interface

#### User Story
> "As a user, I want to ask natural language questions about my resume's fit for the job and receive contextual, actionable answers."

#### Acceptance Criteria
- [ ] Accept free-form text questions
- [ ] Retrieve relevant context from both resume and JD vectors
- [ ] Generate answers grounded in retrieved content
- [ ] Cite specific resume/JD sections in responses
- [ ] Support follow-up questions in conversation thread
- [ ] Display confidence scores for answers

#### Predefined Question Templates
1. **"Am I suitable for this role?"**
   - Analyze overall match percentage
   - Highlight matching qualifications
   - Identify red flags or gaps

2. **"What skills are missing from my resume?"**
   - Extract required skills from JD
   - Compare with resume skills
   - Prioritize gaps by importance

3. **"How can I improve my resume for this job?"**
   - Suggest keyword additions
   - Recommend experience rephrasing
   - Identify missing sections (certifications, projects)

4. **"What are my strongest qualifications for this role?"**
   - Match top skills/experiences
   - Quantify alignment scores

#### Technical Implementation

**RAG Query Flow:**
```javascript
// controllers/queryController.js
async function answerQuestion(req, res) {
  const { question, resumeId, jdId } = req.body;
  
  // Step 1: Embed the question
  const queryEmbedding = await generateEmbedding(question);
  
  // Step 2: Retrieve top-k relevant chunks from resume
  const resumeContext = await vectorStore.retrieve(
    resumeId, 
    queryEmbedding, 
    k = 3
  );
  
  // Step 3: Retrieve top-k relevant chunks from JD
  const jdContext = await vectorStore.retrieve(
    jdId, 
    queryEmbedding, 
    k = 3
  );
  
  // Step 4: Construct prompt with retrieved context
  const prompt = buildRAGPrompt(question, resumeContext, jdContext);
  
  // Step 5: Generate answer using LLM
  const answer = await generateAnswer(prompt);
  
  // Step 6: Return answer with citations
  res.json({
    answer: answer.text,
    confidence: answer.confidence,
    citations: {
      resume: resumeContext.map(c => c.text),
      jd: jdContext.map(c => c.text)
    }
  });
}
```

**Prompt Engineering:**
```javascript
function buildRAGPrompt(question, resumeChunks, jdChunks) {
  return `You are an expert career advisor analyzing a resume against a job description.

## Job Description Requirements:
${jdChunks.map((c, i) => `[JD-${i+1}] ${c.text}`).join('\n\n')}

## Candidate Resume:
${resumeChunks.map((c, i) => `[RESUME-${i+1}] ${c.text}`).join('\n\n')}

## User Question:
${question}

## Instructions:
1. Answer the question based ONLY on the provided context
2. Cite specific sections using [JD-X] or [RESUME-X] references
3. Be honest about gaps or mismatches
4. Provide actionable recommendations
5. Use a professional, encouraging tone

## Answer:`;
}
```

**Vector Similarity Search:**
```javascript
// utils/vectorStore.js
class VectorStore {
  constructor(vectorFilePath) {
    this.vectors = JSON.parse(fs.readFileSync(vectorFilePath));
  }
  
  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return dotProduct / (magA * magB);
  }
  
  retrieve(documentId, queryEmbedding, k = 3) {
    const doc = this.vectors.find(d => d.documentId === documentId);
    if (!doc) return [];
    
    const scored = doc.chunks.map(chunk => ({
      ...chunk,
      score: this.cosineSimilarity(chunk.embedding, queryEmbedding)
    }));
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }
}
```

---

### 3.4 Feature: Skill Gap Analysis

#### User Story
> "As a user, I want a visual breakdown of which skills I have vs. what the job requires."

#### Acceptance Criteria
- [ ] Extract skills from JD using NER or keyword matching
- [ ] Extract skills from resume
- [ ] Categorize skills (technical, soft, domain-specific)
- [ ] Display match percentage per category
- [ ] Highlight missing critical skills
- [ ] Suggest learning resources for gaps

#### Technical Implementation
```javascript
// utils/skillExtractor.js
async function extractSkills(text, type) {
  const prompt = `Extract all skills from this ${type}.
Return as JSON array with categories.

Text: ${text}

Format:
{
  "technical": ["React", "Node.js"],
  "soft": ["Leadership", "Communication"],
  "domain": ["Healthcare", "Finance"]
}`;

  const response = await callLLM(prompt);
  return JSON.parse(response);
}

// Compare skills
function compareSkills(resumeSkills, jdSkills) {
  const categories = ['technical', 'soft', 'domain'];
  const analysis = {};
  
  for (const cat of categories) {
    const required = new Set(jdSkills[cat] || []);
    const possessed = new Set(resumeSkills[cat] || []);
    
    analysis[cat] = {
      matched: [...possessed].filter(s => required.has(s)),
      missing: [...required].filter(s => !possessed.has(s)),
      extra: [...possessed].filter(s => !required.has(s)),
      matchPercentage: (possessed.size / required.size) * 100
    };
  }
  
  return analysis;
}
```

---

## 4. DevOps Requirements

### 4.1 Containerization with Docker

#### Dockerfile Structure

**Frontend Dockerfile:**
```dockerfile
# client/Dockerfile
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile:**
```dockerfile
# server/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Create vector store directory
RUN mkdir -p data/vectors

EXPOSE 5000

CMD ["node", "server.js"]
```

**Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: resume-analyzer-db
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"
    networks:
      - app-network

  backend:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: resume-analyzer-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      MONGO_URI: mongodb://${MONGO_USER}:${MONGO_PASSWORD}@mongodb:27017/resume-analyzer
      OPENROUTER_API_KEY: ${OPENROUTER_API_KEY}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    volumes:
      - ./server/data:/app/data
    networks:
      - app-network

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: resume-analyzer-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

volumes:
  mongo-data:

networks:
  app-network:
    driver: bridge
```

---

### 4.2 CI/CD Pipeline with GitHub Actions

#### Workflow Requirements
- [ ] Automated testing on pull requests
- [ ] Build Docker images on merge to main
- [ ] Push images to container registry
- [ ] Deploy to staging environment
- [ ] Manual approval for production deployment
- [ ] Rollback capability

#### GitHub Actions Workflow
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: |
            server/package-lock.json
            client/package-lock.json
      
      - name: Install Backend Dependencies
        working-directory: ./server
        run: npm ci
      
      - name: Run Backend Tests
        working-directory: ./server
        run: npm test
      
      - name: Install Frontend Dependencies
        working-directory: ./client
        run: npm ci
      
      - name: Run Frontend Tests
        working-directory: ./client
        run: npm test -- --coverage

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    
    strategy:
      matrix:
        service: [frontend, backend]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.service }}
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=semver,pattern={{version}}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.service == 'backend' && 'server' || 'client' }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to Staging
        run: |
          # Add deployment script here
          # Example: SSH to staging server and pull latest images
          echo "Deploying to staging environment"

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Production
        run: |
          # Add production deployment script
          echo "Deploying to production environment"
```

---

## 5. Data Models

### 5.1 MongoDB Schemas

```javascript
// models/User.js
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: String,
  createdAt: { type: Date, default: Date.now }
});

// models/Document.js
const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['resume', 'job_description'], required: true },
  filename: String,
  originalText: String,
  cleanedText: String,
  metadata: {
    fileSize: Number,
    uploadDate: { type: Date, default: Date.now },
    processingStatus: { type: String, enum: ['pending', 'completed', 'failed'] }
  },
  vectorStoreId: String // Reference to vector store entry
});

// models/Analysis.js
const analysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  jobDescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  questions: [{
    question: String,
    answer: String,
    confidence: Number,
    citations: {
      resume: [String],
      jobDescription: [String]
    },
    timestamp: { type: Date, default: Date.now }
  }],
  skillGapAnalysis: {
    technical: {
      matched: [String],
      missing: [String],
      matchPercentage: Number
    },
    soft: {
      matched: [String],
      missing: [String],
      matchPercentage: Number
    },
    domain: {
      matched: [String],
      missing: [String],
      matchPercentage: Number
    }
  },
  overallMatchScore: Number,
  createdAt: { type: Date, default: Date.now }
});
```

---

## 6. API Endpoints

### 6.1 Authentication
```
POST   /api/auth/register          - Create new user account
POST   /api/auth/login             - Authenticate user
POST   /api/auth/refresh           - Refresh JWT token
```

### 6.2 Document Management
```
POST   /api/documents/upload       - Upload resume or JD
GET    /api/documents/:id          - Get document details
DELETE /api/documents/:id          - Delete document
GET    /api/documents/user/:userId - List user's documents
```

### 6.3 Analysis
```
POST   /api/analysis/create        - Create new analysis session
POST   /api/analysis/:id/query     - Ask question about analysis
GET    /api/analysis/:id           - Get analysis results
GET    /api/analysis/:id/skills    - Get skill gap analysis
```

### 6.4 Vector Operations (Internal)
```
POST   /api/vectors/embed          - Generate embeddings for text
POST   /api/vectors/search         - Semantic search in vector store
```

---

## 7. UI/UX Requirements

### 7.1 Page Structure

#### Landing Page
- Hero section with value proposition
- Feature highlights (RAG, AI-powered, instant analysis)
- Demo video/GIF
- CTA: "Analyze Your Resume Now"

#### Upload Page
- Drag-and-drop zones for resume and JD
- File validation feedback
- Processing progress indicators
- Preview of extracted text

#### Analysis Dashboard
- **Left Panel**: Document previews (resume + JD)
- **Center Panel**: Q&A chat interface
- **Right Panel**: Skill gap visualization
  - Donut chart for match percentage
  - Categorized skill lists
  - Missing skills with priority badges

#### Results Page
- Overall match score (0-100)
- Strengths section (top 3 matching qualifications)
- Improvement recommendations
- Downloadable PDF report

### 7.2 Design System
- **Color Palette**: 
  - Primary: #4F46E5 (Indigo)
  - Success: #10B981 (Green)
  - Warning: #F59E0B (Amber)
  - Error: #EF4444 (Red)
- **Typography**: Inter (headings), Roboto (body)
- **Components**: Material-UI with custom theme

---

## 8. Performance & Scalability

### 8.1 Performance Targets
- [ ] Page load time: < 2 seconds
- [ ] Document processing: < 10 seconds per file
- [ ] Query response time: < 3 seconds
- [ ] Embedding generation: < 5 seconds per document

### 8.2 Scalability Considerations
- **Vector Store**: Migrate to Pinecone/Weaviate for >10K documents
- **Caching**: Redis for frequently accessed embeddings
- **Rate Limiting**: 100 requests/hour per user (free tier)
- **File Storage**: Move to S3/CloudFlare R2 for production

---

## 9. Security Requirements

### 9.1 Authentication & Authorization
- [ ] JWT-based authentication with 1-hour expiry
- [ ] Refresh tokens with 7-day expiry
- [ ] Password hashing with bcrypt (10 rounds)
- [ ] Role-based access control (user, admin)

### 9.2 Data Protection
- [ ] Encrypt sensitive data at rest (MongoDB encryption)
- [ ] HTTPS-only communication
- [ ] Sanitize user inputs to prevent injection attacks
- [ ] Rate limiting on API endpoints
- [ ] CORS configuration for allowed origins

### 9.3 Privacy
- [ ] User data isolation (users can only access their own documents)
- [ ] Option to delete all user data (GDPR compliance)
- [ ] No storage of API keys in database
- [ ] Anonymize analytics data

---

## 10. Testing Strategy

### 10.1 Unit Tests
- [ ] Backend: Jest + Supertest (80% coverage target)
  - API endpoint tests
  - Vector store operations
  - Text extraction utilities
- [ ] Frontend: React Testing Library (70% coverage target)
  - Component rendering
  - User interactions
  - State management

### 10.2 Integration Tests
- [ ] End-to-end document upload → analysis flow
- [ ] RAG pipeline (embedding → retrieval → generation)
- [ ] Authentication flow

### 10.3 Manual Testing Checklist
- [ ] Upload various resume formats (PDF, DOCX)
- [ ] Test with different JD lengths and complexities
- [ ] Verify skill extraction accuracy
- [ ] Check response quality for predefined questions
- [ ] Test on mobile devices (responsive design)

---

## 11. Deployment Plan

### 11.1 Environment Setup
- **Development**: Local Docker Compose
- **Staging**: Render/Railway with separate MongoDB Atlas cluster
- **Production**: AWS ECS or Render with auto-scaling

### 11.2 Environment Variables
```bash
# Backend (.env)
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=<random-256-bit-key>
JWT_EXPIRE=1h
REFRESH_TOKEN_SECRET=<random-256-bit-key>
REFRESH_TOKEN_EXPIRE=7d

# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-...
APP_URL=https://resume-analyzer.com
EMBEDDING_MODEL=openai/text-embedding-3-small
LLM_MODEL=meta-llama/llama-3.3-70b-instruct

# File Upload
MAX_FILE_SIZE=5242880  # 5MB in bytes
ALLOWED_FILE_TYPES=pdf,docx

# Frontend (.env)
REACT_APP_API_URL=https://api.resume-analyzer.com
REACT_APP_ENV=production
```

### 11.3 Deployment Steps
1. **Build Docker images** via GitHub Actions
2. **Push to container registry** (GHCR/Docker Hub)
3. **Deploy to staging** for QA testing
4. **Run smoke tests** on staging
5. **Manual approval** for production
6. **Deploy to production** with zero-downtime strategy
7. **Monitor logs and metrics** for 24 hours

---

## 12. Monitoring & Observability

### 12.1 Metrics to Track
- **Application Metrics**:
  - Request count and latency (p50, p95, p99)
  - Error rate by endpoint
  - Document processing success rate
  - LLM API call success rate and latency
  
- **Business Metrics**:
  - Daily active users
  - Documents analyzed per day
  - Average match scores
  - Most common questions asked

### 12.2 Logging Strategy
- **Structured JSON logs** with Winston
- **Log Levels**: ERROR, WARN, INFO, DEBUG
- **Centralized logging**: CloudWatch / Datadog / Logtail

### 12.3 Alerting
- [ ] API error rate > 5% for 5 minutes
- [ ] LLM API failures > 10% for 5 minutes
- [ ] Database connection failures
- [ ] Disk space > 80% usage

---

## 13. Future Enhancements (Post-MVP)

### Phase 2 Features
- [ ] **Multi-resume comparison**: Compare multiple resumes against one JD
- [ ] **ATS optimization**: Check resume against ATS parsing rules
- [ ] **Interview prep**: Generate potential interview questions based on JD
- [ ] **Resume builder**: AI-assisted resume creation from scratch

### Phase 3 Features
- [ ] **Chrome extension**: Analyze JDs directly from job boards
- [ ] **LinkedIn integration**: Import profile data as resume
- [ ] **Collaborative features**: Share analysis with mentors/coaches
- [ ] **Premium tier**: Advanced analytics, unlimited queries

---

## 14. Success Metrics

### 14.1 Technical KPIs
- [ ] 99.5% uptime
- [ ] < 3s average query response time
- [ ] < 2% error rate
- [ ] 90%+ test coverage

### 14.2 Product KPIs
- [ ] 100 users in first month
- [ ] 70%+ user satisfaction (NPS score)
- [ ] 50%+ return user rate
- [ ] 10+ documents analyzed per user (avg)

---

## 15. Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| OpenRouter API downtime | High | Low | Implement fallback LLM, cache common queries |
| Poor embedding quality | High | Medium | Use proven models, validate with test dataset |
| Slow document processing | Medium | Medium | Implement async job queue (Bull/BullMQ) |
| High API costs | Medium | Low | Set usage limits, implement caching |
| Security breach | High | Low | Regular security audits, penetration testing |

---

## 16. Glossary

- **RAG**: Retrieval-Augmented Generation - AI technique combining vector search with LLM generation
- **Embedding**: Numerical vector representation of text for semantic similarity
- **Vector Store**: Database optimized for storing and searching high-dimensional vectors
- **Cosine Similarity**: Metric for measuring similarity between two vectors
- **Chunking**: Breaking large text into smaller, semantically meaningful segments
- **LLM**: Large Language Model (e.g., GPT, Llama)
- **ATS**: Applicant Tracking System - Software used by recruiters to filter resumes

---

## 17. Appendix

### A. Sample API Request/Response

**Request:**
```bash
POST /api/analysis/abc123/query
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "question": "Am I suitable for this role?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Based on the job description and your resume, you are a **strong candidate** for this role. Here's why:\n\n**Matching Qualifications:**\n- [RESUME-1] You have 3 years of MERN stack experience, which exceeds the required 2+ years [JD-1]\n- [RESUME-2] Your expertise in React and Node.js directly aligns with the core tech stack [JD-2]\n- [RESUME-3] You've led a team of 4 developers, matching the leadership requirement [JD-3]\n\n**Potential Gaps:**\n- [JD-4] The role requires Docker/Kubernetes experience, which isn't mentioned in your resume\n- [JD-5] AWS certification is preferred but not mandatory\n\n**Recommendation:** Highlight your containerization knowledge (if any) and consider adding a Docker project to your portfolio.",
    "confidence": 0.87,
    "citations": {
      "resume": [
        "Experienced MERN Stack Developer with 3 years of building scalable web applications...",
        "Technical Skills: React, Node.js, Express, MongoDB, Redux, TypeScript...",
        "Led a team of 4 developers in migrating legacy PHP application to React..."
      ],
      "jobDescription": [
        "Requirements: 2+ years of experience with MERN stack development",
        "Must have strong proficiency in React and Node.js",
        "Experience leading small development teams",
        "Preferred: Docker/Kubernetes experience",
        "Nice to have: AWS Certified Solutions Architect"
      ]
    },
    "timestamp": "2026-02-11T12:03:45Z"
  }
}
```

### B. Vector Store JSON Structure Example
```json
{
  "version": "1.0",
  "documents": [
    {
      "documentId": "resume_abc123",
      "type": "resume",
      "userId": "user_xyz789",
      "createdAt": "2026-02-11T12:00:00Z",
      "chunks": [
        {
          "id": "chunk_0",
          "text": "Experienced MERN Stack Developer with 3 years of building scalable web applications. Proficient in React, Node.js, Express, and MongoDB.",
          "embedding": [0.0234, -0.0456, 0.0789, ...], // 1536 dimensions
          "metadata": {
            "section": "summary",
            "position": 0,
            "charStart": 0,
            "charEnd": 142
          }
        }
      ]
    }
  ]
}
```

---

**Document Control:**
- **Author**: AI Product Team
- **Reviewers**: Engineering Lead, DevOps Lead, Product Manager
- **Approval Date**: TBD
- **Next Review**: 2026-03-11
