import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Briefcase, BrainCircuit } from 'lucide-react';
import UploadZone from './components/FileUpload';
import ChatInterface from './components/ChatInterface';

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Checks if both files are uploaded and processed
  const isReady = !!sessionId && !!resumeFile && !!jdFile;

  const handleUpload = async (file, type) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    try {
      const response = await axios.post('http://localhost:4000/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setSessionId(response.data.sessionId);
        if (type === 'resume') setResumeFile(file);
        if (type === 'jd') setJdFile(file);
      }
    } catch (error) {
      console.error('Upload failed', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-blue-600 bg-blue-50 p-2 rounded-lg">
              <BrainCircuit size={24} />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              Smart Resume & JD Analyzer
            </h1>
          </div>
          <div className="text-sm text-gray-500">
            Powered by RAG & Llama 3.3
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">

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
                <li>Ask the AI Assistant questions about your fit, missing skills, or interview prep.</li>
              </ul>
            </div>
          </div>

          {/* Right Area: Chat */}
          <div className="lg:col-span-8 h-full min-h-[500px]">
            <ChatInterface sessionId={sessionId} isReady={isReady} />
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
