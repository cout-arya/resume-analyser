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
import { AuthProvider, useAuth } from './context/AuthContext';
import { SessionProvider, useSession } from './context/SessionContext';

/**
 * Analyzer page — upload documents + RAG chat
 */
function AnalyzerPage() {
  const { sessionId, resumeFile, jdFile, uploading, isReady, handleUpload } = useSession();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Sidebar: Uploads */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText size={20} className="text-blue-500" />
            Upload Documents
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">1. Resume (PDF/DOCX)</p>
              <UploadZone
                type="resume"
                label="Upload Resume"
                onUpload={(f) => handleUpload(f, 'resume')}
                acceptedFile={resumeFile}
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">2. Job Description (PDF/DOCX)</p>
              <UploadZone
                type="jd"
                label="Upload Job Description"
                onUpload={(f) => handleUpload(f, 'jd')}
                acceptedFile={jdFile}
              />
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
          <h3 className="font-semibold text-indigo-900 mb-2">How to use</h3>
          <ul className="text-sm text-indigo-800 space-y-2 list-disc pl-4">
            <li>Upload your formatted Resume.</li>
            <li>Upload the Job Description you want to analyze.</li>
            <li>Navigate to <strong>ATS Score</strong>, <strong>Skill Gap</strong>, and <strong>Interview Prep</strong> tabs.</li>
            <li>Ask the AI Assistant questions about your fit, missing skills, or interview prep.</li>
          </ul>
        </div>
      </div>

      {/* Right Area: Chat */}
      <div className="lg:col-span-8">
        <div className="h-[600px]">
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
