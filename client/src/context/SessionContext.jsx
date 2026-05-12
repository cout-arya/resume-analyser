import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
    const [sessionId, setSessionId] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);
    const [jdFile, setJdFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [atsData, setAtsData] = useState(null);
    const [skillGapData, setSkillGapData] = useState(null);
    const [interviewData, setInterviewData] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState(null);

    const [conversationHistory, setConversationHistory] = useState([]);
    const [pastSessions, setPastSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);

    const { api, logout } = useAuth();

    const isReady = !!sessionId && !!resumeFile && !!jdFile;

    /**
     * Handle 401 errors by forcing re-login
     */
    const handle401 = (error) => {
        if (error.response?.status === 401) {
            // The interceptor in AuthContext handles refresh automatically.
            // If we still get 401 here, the refresh also failed.
            return true;
        }
        return false;
    };

    /**
     * Fetch past sessions from the server.
     */
    const fetchSessions = useCallback(async () => {
        setLoadingSessions(true);
        try {
            const response = await api.get('/api/sessions');
            setPastSessions(response.data);
        } catch (error) {
            console.error('Failed to fetch sessions', error);
        } finally {
            setLoadingSessions(false);
        }
    }, [api]);

    // Fetch sessions on mount
    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    /**
     * Load a past session by setting the sessionId and file info.
     */
    const loadSession = (session) => {
        setSessionId(session.sessionId);
        const resume = session.files?.find(f => f.type === 'resume');
        const jd = session.files?.find(f => f.type === 'jd');
        // Create pseudo file objects with just the name for display
        setResumeFile(resume ? { name: resume.filename } : null);
        setJdFile(jd ? { name: jd.filename } : null);
        // Reset analysis data for the loaded session
        setAtsData(null);
        setSkillGapData(null);
        setInterviewData(null);
        setAnalysisError(null);
        setConversationHistory([]);
    };

    /**
     * Start a fresh session.
     */
    const newSession = () => {
        setSessionId(null);
        setResumeFile(null);
        setJdFile(null);
        setAtsData(null);
        setSkillGapData(null);
        setInterviewData(null);
        setAnalysisError(null);
        setConversationHistory([]);
    };

    /**
     * Delete a session.
     */
    const deleteSessionById = async (sid) => {
        try {
            await api.delete(`/api/sessions/${sid}`);
            setPastSessions(prev => prev.filter(s => s.sessionId !== sid));
            // If we deleted the active session, reset
            if (sid === sessionId) {
                newSession();
            }
        } catch (error) {
            console.error('Failed to delete session', error);
        }
    };

    const handleUpload = async (file, type) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (sessionId) {
            formData.append('sessionId', sessionId);
        }

        try {
            const response = await api.post('/api/upload', formData);

            if (response.data.success) {
                setSessionId(response.data.sessionId);
                if (type === 'resume') setResumeFile(file);
                if (type === 'jd') setJdFile(file);

                // Reset analysis on new file
                setAtsData(null);
                setSkillGapData(null);
                setInterviewData(null);
                setAnalysisError(null);
                setConversationHistory([]);

                // Refresh session list
                fetchSessions();
            }
        } catch (error) {
            console.error('Upload failed', error);
            if (!handle401(error)) {
                alert('Failed to upload file');
            }
        } finally {
            setUploading(false);
        }
    };

    const runAnalysis = async () => {
        if (!sessionId) return;
        setAnalyzing(true);
        setAnalysisError(null);
        try {
            const [atsRes, skillGapRes] = await Promise.all([
                api.post('/api/analyze/score', { sessionId }),
                api.post('/api/analyze/skills', { sessionId })
            ]);

            setAtsData(atsRes.data);
            setSkillGapData(skillGapRes.data);
        } catch (error) {
            console.error('Analysis failed', error);
            if (!handle401(error)) {
                setAnalysisError('Analysis failed. Please try again.');
            }
        } finally {
            setAnalyzing(false);
        }
    };

    const runInterviewPrep = async () => {
        if (!sessionId) return;
        try {
            const res = await api.post('/api/analyze/interview-prep', { sessionId });
            setInterviewData(res.data);
            return res.data;
        } catch (error) {
            console.error('Interview prep failed', error);
            throw error;
        }
    };

    const downloadReport = async () => {
        try {
            const response = await api.post('/api/report/generate', {
                sessionId,
                atsScore: atsData,
                skillGap: skillGapData,
                conversationHistory,
                interviewPrep: interviewData,
                resumeFilename: resumeFile?.name || 'Resume',
                jdFilename: jdFile?.name || 'Job Description'
            }, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'analysis-report.pdf');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Report download failed', error);
            alert('Failed to download report');
        }
    };

    return (
        <SessionContext.Provider value={{
            sessionId, resumeFile, jdFile, uploading, isReady,
            atsData, skillGapData, interviewData, analyzing, analysisError,
            conversationHistory, setConversationHistory,
            pastSessions, loadingSessions,
            handleUpload, runAnalysis, runInterviewPrep, downloadReport,
            loadSession, newSession, deleteSessionById, fetchSessions
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => useContext(SessionContext);
