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
    const { sessionId, isReady } = useSession();
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
            const textsRes = await api.get(`/api/analyze/cached/${sessionId}`);
            const cached = textsRes.data;
            // Use top-level resumeText/jdText from session files (always available after upload)
            // Fall back to atsData fields for backward compatibility
            const resumeText = cached.resumeText || cached.atsData?.resumeText || '';
            const jobDescription = cached.jdText || cached.atsData?.jdText || '';

            if (!resumeText || !jobDescription) {
                setError('Could not retrieve your resume or JD text. Please re-upload your documents.');
                setGenerating(false);
                return;
            }

            const token = localStorage.getItem('accessToken');
            const controller = new AbortController();
            abortRef.current = controller;

            const response = await fetch(`${API_URL}/api/cover-letter/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ sessionId, resumeText, jobDescription, companyName, jobTitle, tone, personalNotes }),
                signal: controller.signal
            });

            if (!response.ok) throw new Error('Failed to start cover letter generation');

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
                            if (parsed.content) setCoverLetter(prev => prev + parsed.content);
                            if (parsed.error) setError(parsed.error);
                        } catch { /* skip */ }
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
            const response = await api.post('/api/cover-letter/download-pdf', { text: coverLetter, companyName, jobTitle, tone }, { responseType: 'blob' });
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
            <div className="flex flex-col items-center justify-center py-20 text-center border-[3px] border-dashed border-zinc-300 rounded-[2rem] bg-zinc-50">
                <div className="w-20 h-20 bg-zinc-200 border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b] rounded-2xl flex items-center justify-center mb-6">
                    <FileSignature size={36} className="text-zinc-600" strokeWidth={2} />
                </div>
                <h2 className="text-3xl font-black text-zinc-900 mb-3 uppercase tracking-tighter">Upload Both Documents First</h2>
                <p className="text-zinc-500 font-bold">A cover letter requires a completed analysis session.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-lime-400 border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b] rounded-2xl flex items-center justify-center">
                    <FileSignature size={28} className="text-zinc-900" strokeWidth={2.5} />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">Cover Letter Generator</h1>
                    <p className="text-sm font-bold text-zinc-500">AI-crafted, tailored to this specific JD</p>
                </div>
            </div>

            {/* Configuration */}
            <div className="bg-white rounded-[2rem] border-[3px] border-zinc-900 shadow-[8px_8px_0px_#18181b] p-8 space-y-7">
                {/* Company + Job Title */}
                <div className="grid grid-cols-2 gap-5">
                    <div>
                        <label className="text-xs font-black text-zinc-500 mb-2 block uppercase tracking-widest">Company Name</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            placeholder="e.g., Google"
                            className="w-full px-4 py-3 border-[3px] border-zinc-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#18181b] transition-all bg-zinc-50 placeholder-zinc-400"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-black text-zinc-500 mb-2 block uppercase tracking-widest">Job Title</label>
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={e => setJobTitle(e.target.value)}
                            placeholder="e.g., Senior Software Engineer"
                            className="w-full px-4 py-3 border-[3px] border-zinc-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#18181b] transition-all bg-zinc-50 placeholder-zinc-400"
                        />
                    </div>
                </div>

                {/* Tone Selector */}
                <div>
                    <label className="text-xs font-black text-zinc-500 mb-3 block uppercase tracking-widest">Tone</label>
                    <div className="flex gap-4">
                        {tones.map(t => (
                            <button
                                key={t.value}
                                onClick={() => setTone(t.value)}
                                className={`flex-1 p-4 rounded-2xl border-[3px] transition-all text-center ${tone === t.value
                                    ? 'border-zinc-900 bg-lime-400 shadow-[4px_4px_0px_#18181b] -translate-y-1'
                                    : 'border-zinc-200 hover:border-zinc-900 bg-white hover:shadow-[2px_2px_0px_#18181b]'
                                    }`}
                            >
                                <span className="text-2xl">{t.emoji}</span>
                                <p className={`text-sm font-black mt-2 uppercase tracking-wider ${tone === t.value ? 'text-zinc-900' : 'text-zinc-700'}`}>
                                    {t.label}
                                </p>
                                <p className="text-xs font-bold text-zinc-500 mt-1">{t.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Personal Notes */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Anything specific to highlight?</label>
                        <span className={`text-xs font-bold ${personalNotes.length > 280 ? 'text-rose-500' : 'text-zinc-400'}`}>
                            {personalNotes.length}/300
                        </span>
                    </div>
                    <textarea
                        value={personalNotes}
                        onChange={e => e.target.value.length <= 300 && setPersonalNotes(e.target.value)}
                        placeholder="e.g., I'm passionate about their recent AI product launch..."
                        rows={3}
                        className="w-full px-4 py-3 border-[3px] border-zinc-900 rounded-xl text-sm font-bold focus:outline-none focus:shadow-[4px_4px_0px_#18181b] transition-all bg-zinc-50 resize-none placeholder-zinc-400"
                    />
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full py-4 bg-zinc-900 text-lime-400 rounded-xl font-black text-lg border-[3px] border-zinc-900 shadow-[6px_6px_0px_#a3e635] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#a3e635] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3 uppercase tracking-widest"
                >
                    {generating ? (
                        <><Loader2 size={22} className="animate-spin" strokeWidth={3} /> Generating...</>
                    ) : generated ? (
                        <><RefreshCw size={22} strokeWidth={3} /> Regenerate</>
                    ) : (
                        <><Send size={22} strokeWidth={3} /> Generate Cover Letter</>
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="p-5 bg-rose-50 border-[3px] border-rose-500 rounded-2xl shadow-[4px_4px_0px_#f43f5e] text-rose-700 font-bold">
                    {error}
                </div>
            )}

            {/* Output */}
            {(coverLetter || generating) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2rem] border-[3px] border-zinc-900 shadow-[8px_8px_0px_#18181b] p-8"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Your Cover Letter</h2>
                        {generated && (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleDownloadTxt}
                                    className="flex items-center gap-2 text-sm font-black px-4 py-2 bg-white text-zinc-900 rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181b] transition-all uppercase tracking-widest"
                                >
                                    <Download size={16} strokeWidth={3} /> TXT
                                </button>
                                <button
                                    onClick={handleDownloadPdf}
                                    className="flex items-center gap-2 text-sm font-black px-4 py-2 bg-zinc-900 text-lime-400 rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_#a3e635] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#a3e635] transition-all uppercase tracking-widest"
                                >
                                    <FileText size={16} strokeWidth={3} /> PDF
                                </button>
                            </div>
                        )}
                    </div>

                    {generating && !coverLetter && (
                        <div className="flex items-center gap-3 font-black text-zinc-900 p-4 bg-lime-400 border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b] rounded-2xl mb-6 w-fit uppercase tracking-widest text-sm">
                            <Loader2 size={20} className="animate-spin" strokeWidth={3} />
                            <span>Writing your cover letter...</span>
                        </div>
                    )}

                    <textarea
                        value={coverLetter}
                        onChange={e => setCoverLetter(e.target.value)}
                        readOnly={generating}
                        rows={16}
                        className="w-full px-5 py-4 border-[3px] border-zinc-900 rounded-2xl text-sm font-semibold leading-relaxed focus:outline-none focus:shadow-[4px_4px_0px_#18181b] transition-all resize-y bg-zinc-50 text-zinc-900"
                        placeholder={generating ? 'Generating...' : ''}
                    />
                </motion.div>
            )}
        </div>
    );
}
