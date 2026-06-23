import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Upload, Loader2, RefreshCw, ChevronDown, ChevronUp, Download, Lightbulb } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_COLORS = {
    'Behavioral': 'bg-lime-400 text-zinc-900 border-zinc-900',
    'Technical': 'bg-zinc-800 text-white border-zinc-900',
    'Situational': 'bg-amber-400 text-zinc-900 border-zinc-900',
    'Role-specific': 'bg-teal-400 text-zinc-900 border-zinc-900'
};

const DIFFICULTY_COLORS = {
    'Easy': 'bg-lime-100 text-zinc-900 border-zinc-300',
    'Medium': 'bg-amber-100 text-zinc-900 border-zinc-300',
    'Hard': 'bg-rose-100 text-zinc-900 border-zinc-300'
};

const InterviewPrepPage = () => {
    const { isReady, interviewData, runInterviewPrep, downloadReport } = useSession();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [expandedIdx, setExpandedIdx] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        try {
            await runInterviewPrep();
        } catch {
            setError('Failed to generate questions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        setDownloading(true);
        try {
            await downloadReport();
        } finally {
            setDownloading(false);
        }
    };

    if (!isReady) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center border-[3px] border-dashed border-zinc-300 rounded-[2rem] bg-zinc-50">
                <div className="w-20 h-20 bg-zinc-200 border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b] rounded-2xl flex items-center justify-center mb-6">
                    <Upload size={36} className="text-zinc-600" strokeWidth={2} />
                </div>
                <h2 className="text-3xl font-black text-zinc-900 mb-3 uppercase tracking-tighter">Upload Documents First</h2>
                <p className="text-zinc-500 font-bold mb-8 max-w-md">
                    Please upload both your resume and a job description on the Analyzer page before generating interview questions.
                </p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-8 py-4 bg-zinc-900 text-lime-400 border-[3px] border-zinc-900 rounded-xl font-black text-lg shadow-[6px_6px_0px_#a3e635] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#a3e635] transition-all uppercase tracking-widest"
                >
                    Go to Analyzer
                </button>
            </div>
        );
    }

    const questions = interviewData?.questions || [];

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-lime-400 border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b] rounded-2xl flex items-center justify-center">
                    <GraduationCap size={28} className="text-zinc-900" strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter">Interview Prep</h2>
                    <p className="text-sm font-bold text-zinc-500">AI-generated questions based on your resume & JD</p>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="p-5 bg-rose-50 border-[3px] border-rose-500 rounded-2xl shadow-[4px_4px_0px_#f43f5e] text-rose-700 font-bold flex items-center justify-between">
                    <span>{error}</span>
                    <button
                        onClick={handleGenerate}
                        className="px-4 py-2 bg-rose-500 text-white border-2 border-zinc-900 rounded-xl text-xs font-black uppercase tracking-widest"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex items-center gap-2 px-7 py-4 bg-zinc-900 text-lime-400 border-[3px] border-zinc-900 rounded-xl font-black shadow-[6px_6px_0px_#a3e635] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#a3e635] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none transition-all uppercase tracking-widest"
                >
                    {loading ? (
                        <><Loader2 size={20} className="animate-spin" strokeWidth={3} /> Generating...</>
                    ) : questions.length > 0 ? (
                        <><RefreshCw size={20} strokeWidth={3} /> Regenerate</>
                    ) : (
                        <><GraduationCap size={20} strokeWidth={3} /> Generate Questions</>
                    )}
                </button>

                {questions.length > 0 && (
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center gap-2 px-6 py-4 border-[3px] border-zinc-900 text-zinc-900 bg-white rounded-xl font-black shadow-[4px_4px_0px_#18181b] hover:-translate-y-1 transition-all disabled:opacity-50 uppercase tracking-widest"
                    >
                        {downloading ? <Loader2 size={18} className="animate-spin" strokeWidth={3} /> : <Download size={18} strokeWidth={3} />}
                        Download Report
                    </button>
                )}
            </div>

            {/* Loading skeleton */}
            {loading && questions.length === 0 && (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse bg-white rounded-[2rem] border-[3px] border-zinc-200 p-6">
                            <div className="h-5 bg-zinc-200 rounded w-3/4 mb-4" />
                            <div className="flex gap-3">
                                <div className="h-6 bg-zinc-100 rounded-xl w-24" />
                                <div className="h-6 bg-zinc-100 rounded-xl w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Questions list */}
            {questions.length > 0 && (
                <div className="space-y-5">
                    <AnimatePresence>
                        {questions.map((q, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.04 }}
                                className="bg-white rounded-[2rem] border-[3px] border-zinc-900 shadow-[6px_6px_0px_#18181b] overflow-hidden"
                            >
                                <div className="p-7">
                                    <p className="text-base font-bold text-zinc-900 leading-relaxed mb-5">
                                        <span className="font-black text-lime-600">{idx + 1}.</span> {q.question}
                                    </p>

                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className={`text-xs font-black px-3 py-1.5 rounded-xl border-2 uppercase tracking-wider ${TYPE_COLORS[q.type] || 'bg-zinc-100 text-zinc-900 border-zinc-300'}`}>
                                            {q.type}
                                        </span>
                                        <span className={`text-xs font-black px-3 py-1.5 rounded-xl border-2 uppercase tracking-wider ${DIFFICULTY_COLORS[q.difficulty] || 'bg-zinc-100 text-zinc-900 border-zinc-300'}`}>
                                            {q.difficulty}
                                        </span>

                                        <button
                                            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                                            className="ml-auto flex items-center gap-2 text-xs font-black bg-white border-2 border-zinc-900 px-4 py-2 rounded-xl shadow-[2px_2px_0px_#18181b] hover:bg-lime-50 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#18181b] transition-all uppercase tracking-widest"
                                        >
                                            {expandedIdx === idx ? (
                                                <>Hide strategy <ChevronUp size={14} strokeWidth={3} /></>
                                            ) : (
                                                <>Strategy <ChevronDown size={14} strokeWidth={3} /></>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedIdx === idx && q.suggestedAnswer && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-7 pb-7 pt-1 border-t-[3px] border-zinc-900 bg-lime-50">
                                                <div className="flex items-start gap-3 mt-4">
                                                    <div className="w-7 h-7 bg-lime-400 border-2 border-zinc-900 flex items-center justify-center rounded-lg shrink-0 mt-0.5">
                                                        <Lightbulb size={14} className="text-zinc-900" strokeWidth={3} />
                                                    </div>
                                                    <p className="text-sm font-bold text-zinc-800 leading-relaxed">
                                                        {q.suggestedAnswer}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default InterviewPrepPage;
