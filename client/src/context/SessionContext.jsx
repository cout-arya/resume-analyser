import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
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
    // Chat messages persist across tab navigation (lifted from ChatInterface)
    const [chatMessages, setChatMessages] = useState([
        { role: 'system', content: 'Upload your Resume and Job Description to start analyzing!' }
    ]);
    const [pastSessions, setPastSessions] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(false);
    const [loadingCachedData, setLoadingCachedData] = useState(false);

    const { api } = useAuth();

    const isReady = !!sessionId && !!resumeFile && !!jdFile;

    // Track whether we've already loaded cached data for the current session
    const cachedSessionRef = useRef(null);

    /**
     * Handle 401 errors by forcing re-login
     */
    const handle401 = (error) => {
        if (error.response?.status === 401) {
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
     * Load cached analysis data from the server when a session becomes ready.
     * This restores ATS score, skill gap, interview prep, and chat history
     * instantly from MongoDB without re-calling the LLM.
     */
    const loadCachedData = useCallback(async (sid) => {
        if (!sid || cachedSessionRef.current === sid) return;
        cachedSessionRef.current = sid;
        setLoadingCachedData(true);

        try {
            const response = await api.get(`/api/analyze/cached/${sid}`);
            const { atsData: cachedAts, skillGapData: cachedSkillGap, interviewData: cachedInterview, conversationHistory: cachedHistory } = response.data;

            if (cachedAts) setAtsData(cachedAts);
            if (cachedSkillGap) setSkillGapData(cachedSkillGap);
            if (cachedInterview) setInterviewData(cachedInterview);

            // Restore conversation history
            if (cachedHistory && cachedHistory.length > 0) {
                setConversationHistory(cachedHistory);
                // Rebuild chat messages from conversation history
                const restoredMessages = [
                    { role: 'system', content: 'Upload your Resume and Job Description to start analyzing!' },
                    { role: 'system', content: 'Documents processed. You can now ask questions specifically about your fit for this role.' },
                    ...cachedHistory.map(h => ({
                        role: h.role === 'user' ? 'user' : 'assistant',
                        content: h.content
                    }))
                ];
                setChatMessages(restoredMessages);
            }
        } catch (error) {
            console.error('Failed to load cached data:', error);
            // Non-fatal — user can still generate fresh results
        } finally {
            setLoadingCachedData(false);
        }
    }, [api]);

    // When session becomes ready, load cached data
    useEffect(() => {
        if (isReady && sessionId) {
            loadCachedData(sessionId);
        }
    }, [isReady, sessionId, loadCachedData]);

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
        // Reset analysis data — loadCachedData will restore from MongoDB
        setAtsData(null);
        setSkillGapData(null);
        setInterviewData(null);
        setAnalysisError(null);
        setConversationHistory([]);
        setChatMessages([
            { role: 'system', content: 'Upload your Resume and Job Description to start analyzing!' }
        ]);
        // Reset cached session ref so loadCachedData triggers for the new session
        cachedSessionRef.current = null;
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
        setChatMessages([
            { role: 'system', content: 'Upload your Resume and Job Description to start analyzing!' }
        ]);
        cachedSessionRef.current = null;
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

                // Reset analysis on new file (cache invalidated on server too)
                setAtsData(null);
                setSkillGapData(null);
                setInterviewData(null);
                setAnalysisError(null);
                setConversationHistory([]);
                setChatMessages([
                    { role: 'system', content: 'Upload your Resume and Job Description to start analyzing!' }
                ]);
                cachedSessionRef.current = null;

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
        // Don't re-run if we already have data
        if (atsData && skillGapData) return;
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
            chatMessages, setChatMessages,
            pastSessions, loadingSessions, loadingCachedData,
            handleUpload, runAnalysis, runInterviewPrep, downloadReport,
            loadSession, newSession, deleteSessionById, fetchSessions
        }}>
            {children}
        </SessionContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSession = () => useContext(SessionContext);
