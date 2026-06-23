import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileSignature, Download, RefreshCw, Loader2, Send, FileText } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const tones = [
    { value: 'formal', label: 'Formal', emoji: '🎩', desc: 'Polished & professional' },
    { value: 'confident', label: 'Confident', emoji: '💪', desc: 'Direct & assertive' },
    { value: 'concise', label: 'Concise', emoji: '⚡', desc: 'Under 200 words' }
];

export default function CoverLetterPage() {
    const { sessionId, isReady, atsData } = useSession();
    const { api } = useAuth();

    const [tone, setTone] = useState('formal');
    const [personalNotes, setPersonalNotes] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);

    const handleGenerate = async () => {
        if (!sessionId || !isReady) return;
        setGenerating(true);
        setError(null);
        setCoverLetter('');
        setGenerated(false);

        try {
            // Get resume and JD text from cached analysis
            const textsRes = await api.get(`/api/analyze/cached/${sessionId}`);
            const cached = textsRes.data;

            const resumeText = cached.atsData?.resumeText || '';
            const jobDescription = cached.atsData?.jdText || '';

            if (!resumeText || !jobDescription) {
                setError('Please complete ATS analysis first so we have your resume and JD text.');
                setGenerating(false);
                return;
            }

            const token = localStorage.getItem('accessToken');
            const controller = new AbortController();
            abortRef.current = controller;

            const response = await fetch(`${API_URL}/api/cover-letter/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    sessionId,
                    resumeText,
                    jobDescription,
                    companyName,
                    jobTitle,
                    tone,
                    personalNotes
                }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error('Failed to start cover letter generation');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') continue;
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.content) {
                                setCoverLetter(prev => prev + parsed.content);
                            }
                            if (parsed.error) {
                                setError(parsed.error);
                            }
                        } catch {
                            // skip
                        }
                    }
                }
            }

            setGenerated(true);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Cover letter generation error:', err);
                setError('Failed to generate cover letter. Please try again.');
            }
        } finally {
            setGenerating(false);
            abortRef.current = null;
        }
    };

    const handleDownloadTxt = () => {
        const blob = new Blob([coverLetter], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cover-letter-${(companyName || 'draft').toLowerCase().replace(/\s+/g, '-')}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = async () => {
        try {
            const response = await api.post('/api/cover-letter/download-pdf', {
                text: coverLetter,
                companyName,
                jobTitle,
                tone
            }, { responseType: 'blob' });

            const url = URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `cover-letter-${(companyName || 'draft').toLowerCase().replace(/\s+/g, '-')}.pdf`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('PDF download error:', err);
            setError('Failed to download PDF.');
        }
    };

    if (!isReady) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <FileSignature size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">Upload Both Documents First</p>
                <p className="text-sm mt-1">A cover letter requires a completed analysis session.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-violet-100 rounded-xl">
                    <FileSignature size={22} className="text-violet-600" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Cover Letter Generator</h1>
                    <p className="text-sm text-gray-500">AI-crafted, tailored to this specific JD</p>
                </div>
            </div>

            {/* Configuration */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                {/* Company + Job Title */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Company Name</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            placeholder="e.g., Google"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 mb-1 block">Job Title</label>
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={e => setJobTitle(e.target.value)}
                            placeholder="e.g., Senior Software Engineer"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Tone Selector */}
                <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Tone</label>
                    <div className="flex gap-3">
                        {tones.map(t => (
                            <button
                                key={t.value}
                                onClick={() => setTone(t.value)}
                                className={`flex-1 p-3 rounded-xl border-2 transition-all text-center ${tone === t.value
                                    ? 'border-violet-500 bg-violet-50 shadow-sm'
                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                    }`}
                            >
                                <span className="text-lg">{t.emoji}</span>
                                <p className={`text-sm font-semibold mt-1 ${tone === t.value ? 'text-violet-700' : 'text-gray-700'}`}>
                                    {t.label}
                                </p>
                                <p className="text-xs text-gray-500">{t.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Personal Notes */}
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="text-sm font-medium text-gray-700">Anything specific to highlight?</label>
                        <span className={`text-xs ${personalNotes.length > 280 ? 'text-red-500' : 'text-gray-400'}`}>
                            {personalNotes.length}/300
                        </span>
                    </div>
                    <textarea
                        value={personalNotes}
                        onChange={e => e.target.value.length <= 300 && setPersonalNotes(e.target.value)}
                        placeholder="e.g., I'm passionate about their recent AI product launch..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
                    />
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-lg shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {generating ? (
                        <><Loader2 size={18} className="animate-spin" /> Generating...</>
                    ) : generated ? (
                        <><RefreshCw size={18} /> Regenerate</>
                    ) : (
                        <><Send size={18} /> Generate Cover Letter</>
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Output */}
            {(coverLetter || generating) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-gray-200 p-6"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Your Cover Letter</h2>
                        {generated && (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDownloadTxt}
                                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <Download size={14} />
                                    TXT
                                </button>
                                <button
                                    onClick={handleDownloadPdf}
                                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
                                >
                                    <FileText size={14} />
                                    PDF
                                </button>
                            </div>
                        )}
                    </div>

                    {generating && !coverLetter && (
                        <div className="flex items-center gap-2 text-violet-600 mb-4">
                            <Loader2 size={16} className="animate-spin" />
                            <span className="text-sm">Writing your cover letter...</span>
                        </div>
                    )}

                    <textarea
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                        readOnly={generating}
                        rows={16}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y bg-gray-50 font-[system-ui]"
                        placeholder={generating ? 'Generating...' : ''}
                    />
                </motion.div>
            )}
        </div>
    );
}
