# JDFit — 5-Minute Loom Script (Trimmed)

> **Rule of thumb:** ~150 words per minute when speaking over code. This script is ~750 words total.

---

## SEGMENT 1 — Live Demo (0:00 – 1:30)

**SHOW:** Browser — the deployed app

**SAY:**

> "Hey, I'm Arya. This is JDFit — a full-stack MERN app that uses RAG and LLMs to score your resume against any job description. Quick demo."

| Time | Action | Say |
|------|--------|-----|
| 0:10 | Show landing page | *"Glassmorphism landing page, Vite + Tailwind frontend."* |
| 0:15 | Click **Analyze Resume** → Login with Google | *"Google OAuth — one click to get in."* |
| 0:25 | Upload resume + JD | *"Upload a resume and job description — backend extracts text, generates embeddings, stores in a vector store."* |
| 0:35 | Click **ATS Score** → score animates | *"ATS scoring runs five dimensions in parallel — keyword match, semantic alignment, experience relevance, formatting, and quantifiable impact. Total score out of 100."* |
| 0:50 | Scroll to matched/missing keywords | *"Shows exactly which keywords you hit and which you're missing."* |
| 0:55 | Click **Skill Gap** tab | *"Skill gap uses LLM extraction to categorize skills as matched, partial, or missing — with actionable suggestions."* |
| 1:05 | Click **Interview Prep** tab | *"Interview prep generates 8 role-specific questions with difficulty levels and answer strategies."* |
| 1:10 | Go to **Analyzer** → type a question in chat | *"The RAG chat retrieves relevant chunks via cosine similarity and feeds them to LLaMA 3.3 70B. It returns citations with relevance scores."* |
| 1:25 | Click **Download Report** | *"Everything exports as a PDF report — generated server-side with PDFKit."* |

---

## SEGMENT 2 — Backend Architecture (1:30 – 3:15)

### Project Structure (1:30 – 1:45)

**SHOW:** VS Code file explorer — expand `server/`

> "Clean separation: controllers handle requests, services hold business logic, utils for shared tooling, models for Mongoose schemas. Four dedicated services — ATS scoring, skill gap, interview prep, and PDF reports."

### ATS Scoring Engine (1:45 – 2:30)

**SHOW:** `server/services/atsScoringService.js`

| Time | Lines | Say |
|------|-------|-----|
| 1:45 | **Lines 1-13** (header comment) | *"The ATS engine scores across 5 weighted dimensions — this is the core IP of the app."* |
| 1:55 | **Lines 401-407** (`Promise.all`) | *"The main function runs keyword extraction, semantic analysis, and experience relevance in parallel — cuts response time from 15 seconds to 5."* |
| 2:05 | **Lines 173-210** (`calculateSemanticScore`) | *"Semantic scoring chunks both documents, generates embeddings, and computes best-match cosine similarity between every JD chunk and resume chunk. This is the 30-point dimension."* |
| 2:20 | **Lines 107-127** (`filterGarbageTerms`) | *"Biggest engineering challenge — PDFs embed metadata like font names and encoding types. The LLM was treating 'Helvetica' as a skill. I built a multi-layer garbage filter to catch this."* |

### Vector Store (2:30 – 2:50)

**SHOW:** `server/utils/vectorStore.js`

| Time | Lines | Say |
|------|-------|-----|
| 2:30 | **Lines 84-109** (`getEmbeddings`) | *"Custom vector store using OpenAI's text-embedding-3-small via OpenRouter. 1536-dimensional vectors."* |
| 2:40 | **Lines 111-152** (`search` + `cosineSimilarity`) | *"Search computes cosine similarity against all chunks and returns top-k. This is the R in RAG — retrieval that feeds context to the LLM."* |

### PDF Extraction (2:50 – 3:15)

**SHOW:** `server/utils/textExtractor.js`

| Time | Lines | Say |
|------|-------|-----|
| 2:50 | **Lines 31-63** (`extractText`) | *"Dual-strategy extraction — try pdf-parse first, if it returns garbage, fall back to a custom raw buffer parser that reads BT/ET text blocks from the PDF binary."* |
| 3:05 | **Lines 69-114** (`sanitizePdfText`) | *"15 regex passes strip PDF headers, font descriptors, and hex strings before anything reaches the LLM."* |

---

## SEGMENT 3 — Frontend, Security & DevOps (3:15 – 4:40)

### Auth & Frontend (3:15 – 3:45)

**SHOW:** `client/src/context/AuthContext.jsx`

| Time | Lines | Say |
|------|-------|-----|
| 3:15 | **Lines 12-55** (Axios interceptors) | *"JWT access plus refresh tokens. The Axios interceptor auto-refreshes on 401 — if refresh fails, forces re-login. Also integrated Google OAuth for one-click sign-in."* |

**SHOW:** `client/src/components/ATSScoreCard.jsx`

| Time | Lines | Say |
|------|-------|-----|
| 3:30 | **Lines 9-23, 57-60** (animation + SVG) | *"The score animates from zero using a step interval. The circular ring uses SVG stroke-dasharray math — offset calculated from the score."* |

### Security (3:45 – 4:05)

**SHOW:** `server/server.js` → lines 27-43, then `server/controllers/analyzeController.js` → lines 13-18

> "Two rate limiters — 100 req/hour for APIs, 10 per 15 minutes for auth. Every session access verifies user ownership to prevent cross-user data leaks. Passwords hashed with bcrypt."

### DevOps (4:05 – 4:40)

**SHOW:** `docker-compose.yml`

| Time | Say |
|------|-----|
| 4:05 | *"Docker Compose runs three services — MongoDB with health checks, Express backend, and Vite frontend behind Nginx. Backend waits for MongoDB to be healthy."* |

**SHOW:** `.github/workflows/ci.yml`

| Time | Say |
|------|-----|
| 4:20 | *"CI/CD on every push — backend runs Jest tests with coverage, frontend runs ESLint and builds. Docker images build only after both pass."* |

**SHOW:** Terminal → `git log --oneline -8`

| Time | Say |
|------|-----|
| 4:30 | *"Conventional commits — feat, fix, ci, style. You can trace the full evolution."* |

---

## SEGMENT 4 — Closing (4:40 – 5:00)

**SHOW:** Browser → Landing page

> "So this is a full-stack MERN app with a real RAG pipeline, multi-dimensional AI scoring, Google OAuth, Docker, and CI/CD. The hardest problem was PDF metadata poisoning the LLM — solved it with a multi-layer sanitization system. Everything's on GitHub. Thanks for watching."

---

## Tab Order (pre-open these)

1. Browser: deployed app
2. `server/services/atsScoringService.js`
3. `server/utils/vectorStore.js`
4. `server/utils/textExtractor.js`
5. `client/src/context/AuthContext.jsx`
6. `client/src/components/ATSScoreCard.jsx`
7. `server/server.js`
8. `server/controllers/analyzeController.js`
9. `docker-compose.yml`
10. `.github/workflows/ci.yml`
11. Terminal for `git log`

> **Tips:** Zoom VS Code to 140%. Don't read code — point at function names and explain *why*. Close `.env` tabs before recording.
