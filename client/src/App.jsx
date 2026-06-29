import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import UploadZone from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import LandingPage from "./pages/LandingPage"
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import ATSScorePage from './pages/ATSScorePage';
import SkillGapPage from './pages/SkillGapPage';
import InterviewPrepPage from './pages/InterviewPrepPage';
import SuggestionsPanel from './components/SuggestionsPanel';
import CoverLetterPage from './pages/CoverLetterPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider, useSession } from './context/SessionContext';

/**
 * Analyzer page — upload documents + RAG chat
 */
function AnalyzerPage() {
  const { sessionId, resumeFile, jdFile, isReady, handleUpload } = useSession();
  // JD URL Scraping removed

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Sidebar: Uploads */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-[2rem] border-[3px] border-zinc-900 shadow-[6px_6px_0px_#18181b]">
          <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tighter mb-5 flex items-center gap-3">
            <span className="w-8 h-8 bg-lime-400 border-2 border-zinc-900 rounded-xl flex items-center justify-center">
              <FileText size={16} className="text-zinc-900" strokeWidth={3} />
            </span>
            Upload Documents
          </h2>

          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">1. Resume (PDF/DOCX)</p>
              <UploadZone
                type="resume"
                label="Upload Resume"
                onUpload={(f) => handleUpload(f, 'resume')}
                acceptedFile={resumeFile}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">2. Job Description</p>
              <UploadZone
                type="jd"
                label="Upload Job Description"
                onUpload={(f) => handleUpload(f, 'jd')}
                acceptedFile={jdFile}
              />
            </div>
          </div>
        </div>

        <div className="bg-lime-50 p-6 rounded-[2rem] border-[3px] border-zinc-900 shadow-[6px_6px_0px_#18181b]">
          <h3 className="font-black text-zinc-900 mb-3 uppercase tracking-wider text-sm flex items-center gap-2">
            <span className="text-lg">💡</span> How to use
          </h3>
          <ul className="text-sm font-bold text-zinc-700 space-y-2.5">
            <li className="flex items-start gap-2"><span className="text-lime-600 font-black mt-0.5">→</span> Upload your formatted Resume.</li>
            <li className="flex items-start gap-2"><span className="text-lime-600 font-black mt-0.5">→</span> Upload the Job Description file.</li>
            <li className="flex items-start gap-2"><span className="text-lime-600 font-black mt-0.5">→</span> Navigate to <strong>ATS Score</strong>, <strong>Skill Gap</strong>, <strong>Suggestions</strong>, and more.</li>
            <li className="flex items-start gap-2"><span className="text-lime-600 font-black mt-0.5">→</span> Ask the AI Assistant questions about your fit, missing skills, or interview prep.</li>
          </ul>
        </div>
      </div>

      {/* Right Area: Chat */}
      <div className="lg:col-span-8">
        <div className="h-[calc(100vh-10rem)] min-h-[600px]">
          <ChatInterface sessionId={sessionId} isReady={isReady} />
        </div>
      </div>
    </div>
  );
}

/**
 * Landing page wrapper — if already logged in, "Get Started" goes to dashboard directly
 */
function LandingWrapper() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return <LandingPage onStart={handleStart} />;
}

/**
 * Redirect wrapper for auth pages — if already logged in, skip to dashboard
 */
function AuthRedirect({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f6ec]">
        <div className="w-14 h-14 border-[4px] border-zinc-900 border-t-lime-400 rounded-full animate-spin shadow-[4px_4px_0px_#18181b]"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * Dashboard wrapper — provides SessionContext + DashboardLayout around child routes
 */
function DashboardWrapper() {
  return (
    <SessionProvider>
      <DashboardLayout>
        <Routes>
          <Route index element={<AnalyzerPage />} />
          <Route path="ats-score" element={<ATSScorePage />} />
          <Route path="skill-gap" element={<SkillGapPage />} />
          <Route path="interview-prep" element={<InterviewPrepPage />} />
          <Route path="suggestions" element={<SuggestionsPanel />} />
          <Route path="cover-letter" element={<CoverLetterPage />} />
        </Routes>
      </DashboardLayout>
    </SessionProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingWrapper />} />
          <Route path="/login" element={
            <AuthRedirect>
              <Login />
            </AuthRedirect>
          } />
          <Route path="/signup" element={
            <AuthRedirect>
              <Signup />
            </AuthRedirect>
          } />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardWrapper />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
