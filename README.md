# 🧠 Smart Resume & JD Analyzer (v3.0)

![SmartMatch AI](https://img.shields.io/badge/Status-Production%20Ready-success)
![Version](https://img.shields.io/badge/Version-3.0-blue)
![Stack](https://img.shields.io/badge/Stack-MERN-informational)
![AI](https://img.shields.io/badge/AI-RAG%20%2B%20Llama%203.3-orange)

A production-ready, RAG-powered web application that intelligently analyzes resumes against job descriptions, providing **multi-dimensional ATS compatibility scores**, **skill gap analysis**, **tailored interview preparation**, and **contextual Q&A insights** through natural language queries.

---

## 🌟 Key Features (v3.0 Upgrades)

- **🤖 Multi-Dimensional ATS Scoring:** Evaluates Keyword Match (25%), Semantic Alignment (30%), Experience Relevance (20%), Formatting Quality (15%), and Quantifiable Impact (10%).
- **🧠 Advanced Skill Gap Analysis:** AI-driven categorization of matched, partial, and missing skills with actionable suggestions. Smart filtering of PDF artifacts.
- **💬 Interactive RAG Q&A:** Threaded conversational memory with predefined suggestion chips and LLM-powered context awareness.
- **🎯 Interview Prep Generation:** Automatically generates behavioral, technical, and situational interview questions with difficulty levels and answering strategies.
- **📄 Downloadable PDF Reports:** Professional A4-formatted ATS and Skill Gap reports for offline sharing.
- **🔒 Secure Architecture:** JWT-based authentication with auto-refreshing tokens, CORS whitelisting, tiered rate limiting, and MongoDB-backed session persistence.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, Lucide React, Axios
- **Backend:** Node.js 20, Express 5, Mongoose 9, JWT, PDFKit, Multer
- **AI / LLM Layer:** OpenRouter API (`meta-llama/llama-3.3-70b-instruct`)
- **Vector Search:** Cosine Similarity via Custom Embedding Store (`openai/text-embedding-3-small` equivalent logic)
- **Database:** MongoDB Atlas / Local MongoDB
- **Testing:** Jest, Supertest, MongoDB Memory Server (24/24 passing suites)
- **DevOps:** Docker, Docker Compose, GitHub Actions (CI/CD)

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas URI)
- OpenRouter API Key

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/resume-analyzer.git
cd resume-analyzer

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Variables
Create `server/.env`:
```env
PORT=4000
OPENROUTER_API_KEY=your_openrouter_key
MONGO_URI=mongodb://localhost:27017/resume-analyzer
APP_URL=http://localhost:4000
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://localhost:3005
```

### 3. Run Locally
**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```
*App will run at `http://localhost:3005`.*

### 4. Run via Docker
```bash
docker-compose up --build
```

---

## 🧪 Testing

The backend includes a comprehensive Jest test suite using `mongodb-memory-server` for isolated integration testing.

```bash
cd server
npm test
# To generate a coverage report:
npm run test:coverage
```

## 📁 Project Structure

```text
resume-analyzer/
├── client/                 # React 19 Frontend
│   ├── src/
│   │   ├── components/     # UI Components (ATSScoreCard, FileUpload, etc.)
│   │   ├── context/        # Auth & Session React Contexts
│   │   ├── pages/          # Dashboard, InterviewPrep, Landing Pages
│   │   └── index.css       # Tailwind & Global Styles
├── server/                 # Node.js + Express Backend
│   ├── __tests__/          # Jest Test Suites
│   ├── controllers/        # Request Handlers (Analyze, Auth)
│   ├── models/             # Mongoose Schemas (User, Session)
│   ├── routes/             # Express API Routers
│   ├── services/           # Core Logic (ATS, Skill Gap, Interview Prep, PDF)
│   └── utils/              # PDF Parsers, Vector Store
├── docker-compose.yml      # Multi-container Orchestration
├── PRD.md                  # Product Requirements Document
└── SPRINT_PROGRESS.md      # v3.0 Upgrade Sprint Log
```

---
*Developed with focus on code quality, security, and exceptional user experience.*
