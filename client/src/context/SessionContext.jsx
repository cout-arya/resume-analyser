import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
    const [sessionId, setSessionId] = useState(null);
    const [resumeFile, setResumeFile] = useState(null);
    const [jdFile, setJdFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const [atsData, setAtsData] = useState(null);
    const [skillGapData, setSkillGapData] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [analysisError, setAnalysisError] = useState(null);

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
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:4000/api/upload', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setSessionId(response.data.sessionId);
                if (type === 'resume') setResumeFile(file);
                if (type === 'jd') setJdFile(file);

                // Reset analysis on new file
                setAtsData(null);
                setSkillGapData(null);
                setAnalysisError(null);
            }
        } catch (error) {
            console.error('Upload failed', error);
            alert('Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const runAnalysis = async () => {
        if (!sessionId) return;
        setAnalyzing(true);
        setAnalysisError(null);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [atsRes, skillGapRes] = await Promise.all([
                axios.post('http://localhost:4000/api/analyze/score', { sessionId }, config),
                axios.post('http://localhost:4000/api/analyze/skills', { sessionId }, config)
            ]);

            setAtsData(atsRes.data);
            setSkillGapData(skillGapRes.data);
        } catch (error) {
            console.error('Analysis failed', error);
            setAnalysisError('Analysis failed. Please try again.');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <SessionContext.Provider value={{
            sessionId, resumeFile, jdFile, uploading, isReady,
            atsData, skillGapData, analyzing, analysisError,
            handleUpload, runAnalysis
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => useContext(SessionContext);
