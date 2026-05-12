import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Upload, Loader2, RefreshCw, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TYPE_COLORS = {
    'Behavioral': 'bg-blue-50 text-blue-700 border-blue-200',
    'Technical': 'bg-purple-50 text-purple-700 border-purple-200',
    'Situational': 'bg-amber-50 text-amber-700 border-amber-200',
    'Role-specific': 'bg-teal-50 text-teal-700 border-teal-200'
};

const DIFFICULTY_COLORS = {
    'Easy': 'bg-green-50 text-green-700',
    'Medium': 'bg-amber-50 text-amber-700',
    'Hard': 'bg-red-50 text-red-700'
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
        } catch (err) {
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-teal-50 p-6 rounded-2xl mb-6">
                    <Upload size={48} className="text-teal-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Documents First</h2>
                <p className="text-gray-500 mb-6 max-w-md">
                    Please upload both your resume and a job description on the Analyzer page before generating interview questions.
                </p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm"
                >
                    Go to Analyzer
                </button>
            </div>
        );
    }

    const questions = interviewData?.questions || [];

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="text-teal-600 bg-teal-50 p-2.5 rounded-xl">
                            <GraduationCap size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Interview Preparation</h2>
                            <p className="text-sm text-gray-500">AI-generated questions based on your resume and the job description</p>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button
                        onClick={handleGenerate}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Generate / Regenerate buttons */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    {loading ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Generating...
                        </>
                    ) : questions.length > 0 ? (
                        <>
                            <RefreshCw size={16} />
                            Regenerate
                        </>
                    ) : (
                        <>
                            <GraduationCap size={16} />
                            Generate Questions
                        </>
                    )}
                </button>

                {questions.length > 0 && (
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        Download Report
                    </button>
                )}
            </div>

            {/* Loading skeleton */}
            {loading && questions.length === 0 && (
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-100 p-5">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                            <div className="flex gap-2">
                                <div className="h-5 bg-gray-100 rounded-full w-20" />
                                <div className="h-5 bg-gray-100 rounded-full w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Questions list */}
            {questions.length > 0 && (
                <div className="space-y-4">
                    <AnimatePresence>
                        {questions.map((q, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                            >
                                <div className="p-5">
                                    <p className="text-sm font-medium text-gray-900 leading-relaxed mb-3">
                                        {idx + 1}. {q.question}
                                    </p>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${TYPE_COLORS[q.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                            {q.type}
                                        </span>
                                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${DIFFICULTY_COLORS[q.difficulty] || 'bg-gray-50 text-gray-600'}`}>
                                            {q.difficulty}
                                        </span>

                                        <button
                                            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                                            className="ml-auto flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                                        >
                                            {expandedIdx === idx ? (
                                                <>Hide strategy <ChevronUp size={12} /></>
                                            ) : (
                                                <>Suggested strategy <ChevronDown size={12} /></>
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
                                            <div className="px-5 pb-4 pt-2 border-t border-gray-50 bg-indigo-50/30">
                                                <p className="text-xs text-gray-600 leading-relaxed">
                                                    💡 {q.suggestedAnswer}
                                                </p>
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
