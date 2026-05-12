# 📋 Smart Resume Analyzer — v3.0 Sprint Progress

**Developer:** Arya Verma  
**Project:** RAG-based Resume & JD Analyzer  
**Upgrade:** v2.0 → v3.0 (10 features across 6 sprints)  
**Started:** May 12, 2026  
**Status:** ✅ Complete  

---

> This document tracks every sprint, decision, and lesson learned during the v3.0 upgrade.
> Written for transparency — so anyone reviewing this (recruiters, collaborators, future-me)
> can follow the engineering process behind the changes.

---

## 🗺️ Sprint Plan Overview

| Sprint | Features | Rationale |
|--------|----------|-----------|
| **Sprint 1** | #8 Session Scoping + #5 CORS & Rate Limiting | Security foundations — every feature after this assumes sessions are user-scoped |
| **Sprint 2** | #3 MongoDB Session Persistence | Replaces fragile in-memory store. All other features depend on persistent sessions |
| **Sprint 3** | #1 Conversation Threading + #7 Confidence Scores + #4 Question Chips | All three modify ChatInterface — doing them together avoids merge conflicts |
| **Sprint 4** | #9 JWT Refresh Token Flow | Auth changes need stability. Done after core features are stable |
| **Sprint 5** | #10 Interview Question Generator | Standalone feature — needs session persistence (Sprint 2) first |
| **Sprint 6** | #2 PDF Report Download + #6 Jest Test Suite | Report aggregates all data, tests cover final API surface |

---

## Sprint 1 — Foundation & Security ✅

**Features:** #8 (Session Scoping by User ID) + #5 (CORS Restriction & Rate Limiting)  
**Status:** Complete  

### What I Built

**Feature #8 — Session Scoping by User ID**

The original codebase had a critical security gap: sessions were stored in a plain JavaScript object (`const sessions = {}`) with no ownership checks. Any authenticated user who guessed (or intercepted) another user's `sessionId` could access their documents and analysis results.

I fixed this by:

1. **Adding `userId` to every session operation.** The `uploadHandler` now extracts `req.user.id` from the verified JWT payload and passes it when creating or fetching sessions.

2. **Ownership verification on every request.** A shared `getSession(sessionId, userId)` helper queries the database and returns `null` if the session doesn't belong to the requesting user. Controllers receiving `null` return a `403 Forbidden`.

3. **Scoping the session listing endpoint.** `GET /api/sessions` filters by `{ userId: req.user.id }`, so users only see their own sessions.

**Files changed:**
- `server/controllers/analyzeController.js` — Replaced entire in-memory session logic with MongoDB-backed operations + ownership checks
- `server/routes/analyzeRoutes.js` — Updated `getSessionTexts()` calls to pass `userId` (now async)
- `server/routes/api.js` — Added `GET /api/sessions` and `DELETE /api/sessions/:sessionId`

**Feature #5 — CORS Restriction & Rate Limiting**

The original server had `app.use(cors())` — completely open to any origin. I replaced it with a configurable whitelist.

```javascript
// Before (wide open):
app.use(cors());

// After (configurable):
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
```

I also added two-tier rate limiting using `express-rate-limit`:
- **API routes:** 100 requests/hour (general protection)
- **Auth routes:** 10 requests/15 minutes (brute-force protection)

**Files changed:**
- `server/server.js` — Replaced open CORS, added rate limiter middleware
- `server/.env` — Added `ALLOWED_ORIGINS` environment variable

**Dependency added:** `express-rate-limit@8.5.1`

### Decisions & Trade-offs

- I chose to apply rate limiting by IP (default behavior of express-rate-limit) rather than by user ID. This is simpler and catches unauthenticated abuse too. If we ever go multi-tenant, we'd want per-user limits — but that's over-engineering for now.

---

## Sprint 2 — Session Persistence ✅

**Feature:** #3 (MongoDB Session Persistence + Session History Sidebar)  
**Status:** Complete  

### What I Built

The original app stored all session data (uploaded files, extracted text, document IDs) in a plain JavaScript object in server memory. This meant:
- A server restart wiped all active sessions
- Users had no way to return to past analyses
- No persistence = no accountability trail

I created a `Session` Mongoose model that stores:

```javascript
{
    sessionId: String,       // UUID, unique, indexed
    userId: ObjectId,        // Owner — ref to User model
    files: [{                // All uploaded documents
        docId, filename, type, text, fileSize, uploadedAt
    }],
    conversationHistory: [{  // Q&A chat history
        role, content, timestamp
    }],
    lastActiveAt: Date,
    createdAt: Date
}
```

**Key architectural decision:** I chose to store the extracted text directly in the session document rather than in a separate collection. This trades some storage efficiency for simplicity — one query gives you everything you need for ATS scoring, skill gap analysis, or chat context. For a portfolio-scale app, this is the right call.

**Frontend — Session History Sidebar:**

Added a collapsible left sidebar to `DashboardLayout.jsx`:
- Fetches past sessions on mount via `GET /api/sessions`
- Displays resume filename, JD filename, and last active date
- "Load" button restores a past session
- "New Session" button clears current state
- Delete button (trash icon) with hover reveal
- Loading skeletons while sessions are fetching

**Files created:**
- `server/models/Session.js`

**Files changed:**
- `server/controllers/analyzeController.js` — Full rewrite from in-memory to MongoDB
- `server/routes/api.js` — Added session CRUD endpoints
- `client/src/context/SessionContext.jsx` — Added `pastSessions`, `loadSession()`, `newSession()`, `deleteSessionById()`
- `client/src/components/DashboardLayout.jsx` — Added sidebar with session history

---

## Sprint 3 — Chat Enhancements ✅

**Features:** #1 (Conversation Threading) + #7 (Confidence Scores) + #4 (Predefined Question Chips)  
**Status:** Complete  

### What I Built

**Feature #1 — Conversation Threading**

The original chat was stateless — each question was treated independently. Users couldn't say "elaborate on that" or "give me an example" because the LLM had no memory of previous turns.

I implemented multi-turn conversations by:

1. **Adding `conversationHistory` to the API request/response.** The frontend sends the full conversation history alongside each new question. The backend prepends it to the LLM's message array.

2. **Capping at 10 turns (20 messages)** to stay within the LLM's context window. Older messages are trimmed from the front.

3. **Persisting history to MongoDB.** Each chat response updates the session's `conversationHistory` array.

**Message structure sent to the LLM:**
```
[system prompt with RAG context] → [last 10 turns of history] → [new user question]
```

**Feature #7 — Confidence Scores**

The cosine similarity score was already being computed during RAG chunk retrieval but was never surfaced to the user. I now:
- Return `topRelevanceScore` (0–1, 2 decimal places) in the API response
- Display a color-coded badge after each assistant message:
  - ≥80%: green (high confidence)
  - 60–79%: amber (moderate)
  - <60%: red with "Low relevance" warning

This gives users a quick trust signal — if the relevance is low, they know the answer might not be grounded in their actual documents.

**Feature #4 — Predefined Question Chips**

Added 5 clickable prompt suggestions that appear when the chat is empty:
- "Am I a strong fit for this role?"
- "What skills am I missing?"
- "How should I rewrite my professional summary?"
- "What are my top 3 strengths for this job?"
- "What experience gaps should I address?"

Chips auto-submit on click (don't just fill the input). They disappear after the first message to save space.

**Also added:** A "Clear conversation" button that resets the chat history.

**Files changed:**
- `server/controllers/analyzeController.js` — Conversation threading + relevance scores in response
- `client/src/components/ChatInterface.jsx` — Complete rewrite with threading, chips, badges, clear button

---

## Sprint 4 — Auth Upgrade ✅

**Feature:** #9 (JWT Refresh Token Flow)  
**Status:** Complete  

### What I Built

The original auth issued a single JWT with a 7-day expiry. This is convenient but insecure — if a token is stolen, the attacker has a full week of access with no way to revoke it.

I replaced this with a dual-token strategy:

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access Token | 1 hour | Short-lived, sent with every API request |
| Refresh Token | 7 days | Long-lived, used only to get new access tokens |

**Backend implementation:**
- On login/register: issue both tokens, store a bcrypt hash (6 rounds) of the refresh token in the User document
- `POST /api/auth/refresh`: verify the refresh token against the stored hash, issue a new access token
- `POST /api/auth/logout`: clear the stored refresh token hash (effectively revoking it)

**Frontend implementation:**
- Created a shared Axios instance (`api`) with an automatic interceptor
- On 401 response: the interceptor silently calls `/api/auth/refresh`, retries the original request
- If refresh fails: force logout and redirect to `/login`
- All components now use `api` from `useAuth()` instead of raw `axios` calls

**Why bcrypt the refresh token?** If the database is ever compromised, an attacker can't use the stored hash to impersonate users. They'd need the actual token, which only the client has.

**Files changed:**
- `server/routes/auth.js` — Added `/refresh` and `/logout` endpoints, dual token generation
- `server/models/User.js` — Added `refreshTokenHash` field
- `server/.env` — Added `JWT_REFRESH_SECRET`
- `client/src/context/AuthContext.jsx` — Dual token storage, Axios interceptor, `api` instance

---

## Sprint 5 — New Features ✅

**Feature:** #10 (Interview Question Generator)  
**Status:** Complete  

### What I Built

Added a new dashboard tab: **Interview Preparation**. Given a resume and JD, the LLM generates 8 likely interview questions with:
- **Type classification:** Behavioral, Technical, Situational, or Role-specific
- **Difficulty rating:** Easy, Medium, or Hard
- **Suggested answer strategy:** 2–4 sentences drawn from the candidate's actual resume

**Backend:**
- Created `server/services/interviewPrepService.js` — structured LLM prompt with JSON-only output constraint
- Added `POST /api/analyze/interview-prep` endpoint in `analyzeRoutes.js`
- Built-in fallback: if the LLM returns invalid JSON, the service returns 4 generic questions instead of crashing

**Frontend:**
- Created `client/src/pages/InterviewPrepPage.jsx` with:
  - Generate/Regenerate button
  - Loading skeleton cards (3–6 second generation time)
  - Animated question cards with type badges (color-coded) and difficulty badges
  - Collapsible "Suggested answer strategy" section per question
  - Download Report button integration
- Added `Interview Prep` tab in `DashboardLayout.jsx` (icon: `GraduationCap` from Lucide)
- Added route in `App.jsx`: `/dashboard/interview-prep`

**Files created:**
- `server/services/interviewPrepService.js`
- `client/src/pages/InterviewPrepPage.jsx`

**Files changed:**
- `server/routes/analyzeRoutes.js` — New endpoint
- `client/src/components/DashboardLayout.jsx` — New nav tab
- `client/src/App.jsx` — New route

---

## Sprint 6 — Reporting & Testing ✅

**Features:** #2 (PDF Report Download) + #6 (Jest Test Suite)  
**Status:** Complete  

### What I Built

**Feature #2 — Downloadable PDF Report**

Users can now export their entire analysis as a formatted A4 PDF containing:
1. **Header** — App name, filenames, generation date
2. **ATS Score** — Overall score (large, color-coded), breakdown table, matched/missing keywords
3. **Skill Gap Analysis** — Matched (green), partial (amber), missing (red) skills
4. **Interview Prep** — All generated questions with type, difficulty, and suggested answers
5. **Q&A Session** — Full conversation history with markdown stripped

Built with `pdfkit` — generates a multi-page PDF streamed directly to the response. No temp files on disk.

**Download flow:**
1. User clicks "Download Report" on ATS, Skill Gap, or Interview Prep page
2. Frontend sends POST to `/api/report/generate` with all analysis data + conversation history
3. Backend generates PDF and streams it as `application/pdf`
4. Frontend creates a Blob URL and triggers browser download

**Files created:**
- `server/services/reportService.js` — PDFKit document builder with color-coded sections
- `server/routes/reportRoutes.js` — `POST /api/report/generate` endpoint

**Files changed:**
- `server/server.js` — Registered `/api/report` route
- `client/src/context/SessionContext.jsx` — Added `downloadReport()` function
- `client/src/pages/ATSScorePage.jsx` — Added Download button
- `client/src/pages/SkillGapPage.jsx` — Added Download button
- `client/src/pages/InterviewPrepPage.jsx` — Added Download button

**Dependency added:** `pdfkit@0.18.0`

---

**Feature #6 — Jest Test Suite**

Created a test suite covering the critical API paths. All tests use `mongodb-memory-server` for isolated, repeatable testing — no real database or API calls.

**Test results: ✅ 24 tests passing across 4 suites**

| Suite | Tests | Coverage |
|-------|-------|----------|
| `auth.test.js` | 8 tests | Register (success, duplicate, missing fields), Login (success, wrong password, unknown email), Refresh token (valid, invalid) |
| `upload.test.js` | 2 tests | Auth protection, missing file validation |
| `analyze.test.js` | 6 tests | Auth protection + input validation for ATS score, skill gap, and interview prep |
| `chat.test.js` | 8 tests | Auth protection, input validation, empty-state session listing, session deletion |

**Architecture:**
- Shared `setup.js` utility: creates in-memory MongoDB, manages test users, handles lifecycle
- Each suite creates its own Express app instance (avoids port conflicts)
- No mocking of external APIs needed for these validation tests — they test input guards and auth

**Files created:**
- `server/__tests__/setup.js` — Shared test utilities
- `server/__tests__/auth.test.js`
- `server/__tests__/upload.test.js`
- `server/__tests__/analyze.test.js`
- `server/__tests__/chat.test.js`

**Dependencies added:** `jest`, `supertest`, `mongodb-memory-server` (dev dependencies)

---

## 📊 Summary of All Changes

### New Files Created (10)

| File | Purpose |
|------|---------|
| `server/models/Session.js` | MongoDB session model |
| `server/services/reportService.js` | PDF report generation |
| `server/services/interviewPrepService.js` | LLM-powered interview question generator |
| `server/routes/reportRoutes.js` | Report download endpoint |
| `server/__tests__/setup.js` | Shared test utilities |
| `server/__tests__/auth.test.js` | Auth endpoint tests |
| `server/__tests__/upload.test.js` | Upload endpoint tests |
| `server/__tests__/analyze.test.js` | Analysis endpoint tests |
| `server/__tests__/chat.test.js` | Chat & session tests |
| `client/src/pages/InterviewPrepPage.jsx` | Interview prep UI |

### Files Modified (13)

| File | Changes |
|------|---------|
| `server/server.js` | CORS restriction, rate limiting, report route |
| `server/.env` | Added `JWT_SECRET`, `JWT_REFRESH_SECRET`, `ALLOWED_ORIGINS` |
| `server/package.json` | Jest config, test scripts |
| `server/routes/api.js` | Session CRUD endpoints |
| `server/routes/auth.js` | Refresh/logout endpoints, dual tokens |
| `server/routes/analyzeRoutes.js` | Async session texts, interview prep endpoint |
| `server/controllers/analyzeController.js` | Full rewrite: MongoDB sessions, threading, scoping |
| `server/models/User.js` | Added `refreshTokenHash` field |
| `client/src/context/AuthContext.jsx` | Dual tokens, Axios interceptor |
| `client/src/context/SessionContext.jsx` | Session CRUD, conversation history, PDF download |
| `client/src/components/ChatInterface.jsx` | Threading, chips, confidence badges |
| `client/src/components/DashboardLayout.jsx` | Session sidebar, interview prep tab |
| `client/src/App.jsx` | Interview prep route |
| `client/src/pages/ATSScorePage.jsx` | Download report button |
| `client/src/pages/SkillGapPage.jsx` | Download report button |

### Dependencies Added

| Package | Version | Type | Purpose |
|---------|---------|------|---------|
| `express-rate-limit` | 8.5.1 | prod | API rate limiting |
| `pdfkit` | 0.18.0 | prod | PDF report generation |
| `jest` | latest | dev | Test runner |
| `supertest` | latest | dev | HTTP assertion library |
| `mongodb-memory-server` | latest | dev | In-memory MongoDB for tests |

---

## 🔑 Key Takeaways

1. **Security-first ordering matters.** Implementing session scoping (Sprint 1) before any other feature meant I never accidentally shipped an insecure endpoint. Every feature built on top inherited the ownership checks.

2. **In-memory → MongoDB was the highest-impact change.** A single architectural decision (persisting sessions) unlocked 4 other features: conversation threading, session history, PDF reports, and interview prep all needed persistent data.

3. **The Axios interceptor pattern is elegant.** Instead of adding try/catch refresh logic in every component, a single interceptor in `AuthContext` handles token refresh transparently. Components don't even know it's happening.

4. **PDFKit streams are zero-cost on memory.** Instead of generating a PDF to disk then sending it, I pipe the PDFKit document directly to the HTTP response. No temp files, no cleanup.

5. **Test isolation with mongodb-memory-server is a game-changer.** Each test suite gets its own MongoDB instance that's created in ~2 seconds. No seed data to manage, no shared state between tests.

---

*Document version: 1.0 | Last updated: May 12, 2026*
