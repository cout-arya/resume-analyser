import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Copy, Loader2, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';

const confidenceColors = {
    high: { border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
    medium: { border: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-700' },
    low: { border: 'border-l-red-500', badge: 'bg-red-100 text-red-700' }
};

const categoryLabels = {
    quantification: '📊 Quantification',
    keywords: '🔑 Keywords',
    impact: '💥 Impact',
    clarity: '✏️ Clarity',
    relevance: '🎯 Relevance'
};

const SuggestionsPanel = React.memo(function SuggestionsPanel() {
    const {
        sessionId, isReady, suggestionsData, setSuggestionsData,
        atsData, skillGapData
    } = useSession();
    const { api } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [copiedId, setCopiedId] = useState(null);

    // Fetch suggestions lazily
    const fetchSuggestions = useCallback(async () => {
        if (!sessionId || !isReady) return;
        setLoading(true);
        setError(null);

        try {
            // Get texts from session — we need resume + JD text
            const textsRes = await api.get(`/api/analyze/cached/${sessionId}`);
            const cachedData = textsRes.data;

            // We need resumeText and jdText — fetch from session files
            const sessionsRes = await api.get('/api/sessions');
            const session = sessionsRes.data.find(s => s.sessionId === sessionId);
            if (!session) throw new Error('Session not found');

            // Use ATS/SkillGap data for matched/missing skills
            const matchedSkills = [];
            const missingSkills = [];

            if (skillGapData) {
                if (skillGapData.matched) matchedSkills.push(...skillGapData.matched.map(s => typeof s === 'string' ? s : s.skill || s.jdSkill));
                if (skillGapData.missing) missingSkills.push(...skillGapData.missing.map(s => typeof s === 'string' ? s : s.skill));
            }

            if (atsData?.details) {
                if (atsData.details.matchedKeywords) matchedSkills.push(...atsData.details.matchedKeywords);
                if (atsData.details.missingKeywords) missingSkills.push(...atsData.details.missingKeywords);
            }

            const res = await api.post('/api/analyze/suggestions', {
                sessionId,
                matchedSkills: [...new Set(matchedSkills)],
                missingSkills: [...new Set(missingSkills)]
            });

            setSuggestionsData(res.data);
        } catch (err) {
            console.error('Failed to fetch suggestions:', err);
            setError(err.response?.data?.error || 'Failed to generate suggestions. Please ensure both documents are uploaded and ATS analysis is complete.');
        } finally {
            setLoading(false);
        }
    }, [sessionId, isReady, api, setSuggestionsData, atsData, skillGapData]);

    const handleCopy = async (suggestion) => {
        try {
            await navigator.clipboard.writeText(suggestion.rewrittenBullet);
            setCopiedId(suggestion.id);
            setTimeout(() => setCopiedId(null), 2000);

            await api.patch(`/api/analyze/suggestions/${sessionId}/${suggestion.id}`);

            setSuggestionsData(prev => ({
                ...prev,
                suggestions: prev.suggestions.map(s =>
                    s.id === suggestion.id ? { ...s, accepted: true } : s
                )
            }));
        } catch (err) {
            console.error('Failed to copy suggestion:', err);
        }
    };

    const suggestions = suggestionsData?.suggestions || [];
    const visibleSuggestions = suggestions;
    const acceptedCount = suggestions.filter(s => s.accepted).length;
    const totalCount = suggestions.length;
    const progressPercent = totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0;

    // Not ready state
    if (!isReady) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <Lightbulb size={48} className="mb-4 opacity-50" />
                <p className="text-lg font-medium">Upload Both Documents First</p>
                <p className="text-sm mt-1">Suggestions require a completed ATS analysis.</p>
            </div>
        );
    }

    // Initial state — hasn't loaded yet
    if (!suggestionsData && !loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Lightbulb size={48} className="mb-4 text-amber-400" />
                <p className="text-lg font-semibold text-gray-700 mb-2">AI-Powered Bullet Improvements</p>
                <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                    Get targeted suggestions to strengthen your resume bullets against this specific job description.
                </p>
                <button
                    onClick={fetchSuggestions}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-200"
                >
                    Generate Suggestions
                </button>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 mb-6">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="font-medium">Analyzing your resume bullets...</span>
                </div>
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-gray-100 rounded-xl h-32 border border-gray-200" />
                ))}
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={fetchSuggestions}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Empty results
    if (totalCount === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <CheckCircle2 size={48} className="mb-4 text-emerald-500" />
                <p className="text-lg font-medium text-gray-700">Your resume looks strong!</p>
                <p className="text-sm mt-1">No significant improvements were identified for this JD.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                        {acceptedCount} of {totalCount} suggestions copied
                    </span>
                    <span className="text-xs text-gray-500">{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <motion.div
                        className="bg-gradient-to-r from-emerald-500 to-green-500 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </div>
            </div>

            {/* Regenerate button */}
            <div className="flex justify-end">
                <button
                    onClick={fetchSuggestions}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium px-3 py-1.5 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                    ↻ Regenerate
                </button>
            </div>

            {/* Suggestion Cards */}
            <AnimatePresence mode="popLayout">
                {visibleSuggestions.map(suggestion => {
                    const colors = confidenceColors[suggestion.confidence] || confidenceColors.medium;
                    return (
                        <motion.div
                            key={suggestion.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -200, transition: { duration: 0.3 } }}
                            className={`bg-white rounded-xl border border-gray-200 border-l-4 ${colors.border} p-5 shadow-sm`}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                                    {suggestion.confidence}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {categoryLabels[suggestion.category] || suggestion.category}
                                </span>
                            </div>

                            {/* Original bullet */}
                            <div className="mb-3">
                                <p className="text-xs font-medium text-gray-500 mb-1">Original</p>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                    "{suggestion.originalBullet}"
                                </p>
                            </div>

                            {/* Reason */}
                            <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg mb-3">
                                💡 {suggestion.reason}
                            </p>

                            {/* Rewritten bullet */}
                            <div className="mb-4">
                                <p className="text-xs font-medium text-gray-500 mb-1">Suggested Rewrite</p>
                                <p className="text-sm text-gray-900 bg-indigo-50 p-3 rounded-lg border border-indigo-100 font-medium">
                                    {suggestion.rewrittenBullet}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleCopy(suggestion)}
                                    className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors border border-indigo-100"
                                >
                                    {copiedId === suggestion.id ? (
                                        <><Check size={14} /> Copied!</>
                                    ) : (
                                        <><Copy size={14} /> Copy to Clipboard</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
});

export default SuggestionsPanel;
