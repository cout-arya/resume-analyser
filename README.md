# Smart Resume & JD Analyzer

## 🚀 Overview
A RAG-powered intelligent application that analyzes resumes against job descriptions.
- **Backend**: Node.js, Express, OpenRouter (Llama 3.3 + OpenAI Embeddings)
- **Frontend**: React, Tailwind CSS, Vite
- **Infrastructure**: Docker, MongoDB

## 🛠️ Setup

### Prerequisites
- Docker & Docker Compose
- OpenRouter API Key

### 1. Environment Variables
Create a `.env` file in the `server` directory:
```bash
PORT=5000
OPENROUTER_API_KEY=your_key_here
MONGO_URI=mongodb://localhost:27017/resume-analyzer
APP_URL=http://localhost:5000
```

### 2. Run with Docker
```bash
docker-compose up --build
```
Access the app at `http://localhost:3005` (Frontend) and API at `http://localhost:4000` (Backend).

### 3. Run Locally (Development)

**Backend:**
```bash
cd server
npm install
npm run dev
```
(Starts on port 4000)

**Frontend:**
```bash
cd client
npm install
npm run dev
```
(Starts on port 3005)

## 🧪 Features
1. **Upload**: Drag & drop Resume (PDF/DOCX) and Job Description.
2. **Analyze**: Ask questions like "Am I a good fit?" or "What skills are missing?".
3. **RAG**: The system retrieves relevant sections from your documents to answer accurately.

## 📁 Structure
- `/server`: Node.js API & Vector Store logic
- `/client`: React Frontend
- `.github/workflows`: CI/CD Pipeline
