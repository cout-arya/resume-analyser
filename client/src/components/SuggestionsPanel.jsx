import React, { useState, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Copy, Loader2, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useSession } from '../context/SessionContext';
import { useAuth } from '../context/AuthContext';

const confidenceColors = {
    high: { border: 'border-l-lime-400', badge: 'bg-lime-400 text-zinc-900 border-2 border-zinc-900' },
    medium: { border: 'border-l-amber-400', badge: 'bg-amber-400 text-zinc-900 border-2 border-zinc-900' },
    low: { border: 'border-l-rose-400', badge: 'bg-rose-400 text-zinc-900 border-2 border-zinc-900' }
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


    // Not ready state
    if (!isReady) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-400 border-[3px] border-zinc-200 border-dashed rounded-[2rem] bg-zinc-50">
                <Lightbulb size={48} className="mb-4 opacity-50" strokeWidth={2} />
                <p className="text-xl font-black uppercase tracking-tighter text-zinc-600">Upload Both Documents First</p>
                <p className="text-sm font-bold mt-1 text-zinc-500">Suggestions require a completed ATS analysis.</p>
            </div>
        );
    }

    // Initial state — hasn't loaded yet
    if (!suggestionsData && !loading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center border-[3px] border-zinc-900 rounded-[2rem] shadow-[8px_8px_0px_#18181b] bg-white">
                <div className="w-16 h-16 bg-lime-400 border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b] rounded-2xl flex items-center justify-center mb-6">
                    <Lightbulb size={32} className="text-zinc-900" strokeWidth={2.5} />
                </div>
                <p className="text-2xl font-black text-zinc-900 mb-3 uppercase tracking-tighter">AI-Powered Bullet Improvements</p>
                <p className="text-sm font-bold text-zinc-500 mb-8 max-w-md">
                    Get targeted suggestions to strengthen your resume bullets against this specific job description.
                </p>
                <button
                    onClick={fetchSuggestions}
                    className="px-8 py-4 bg-zinc-900 text-lime-400 rounded-xl font-black text-lg border-[3px] border-zinc-900 shadow-[6px_6px_0px_#a3e635] hover:-translate-y-1 hover:shadow-[8px_8px_0px_#a3e635] transition-all uppercase tracking-widest"
                >
                    Generate
                </button>
            </div>
        );
    }

    // Loading state
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3 text-zinc-900 mb-8 p-4 bg-lime-400 border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b] rounded-2xl w-fit font-black uppercase tracking-widest text-sm">
                    <Loader2 size={24} className="animate-spin" strokeWidth={3} />
                    <span>Analyzing your resume...</span>
                </div>
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse bg-zinc-100 rounded-[2rem] h-40 border-[3px] border-zinc-200" />
                ))}
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16 border-[3px] border-rose-500 bg-rose-50 rounded-[2rem] shadow-[8px_8px_0px_#f43f5e]">
                <p className="text-rose-600 font-black mb-6 flex items-center gap-2"><X size={24} /> {error}</p>
                <button
                    onClick={fetchSuggestions}
                    className="px-6 py-3 bg-zinc-900 text-white border-2 border-zinc-900 rounded-xl font-black shadow-[4px_4px_0px_#18181b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#18181b] transition-all uppercase tracking-widest"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Empty results
    if (totalCount === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 border-[3px] border-zinc-900 bg-lime-50 rounded-[2rem] shadow-[8px_8px_0px_#18181b]">
                <div className="w-16 h-16 bg-lime-400 border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b] rounded-2xl flex items-center justify-center mb-6">
                    <CheckCircle2 size={32} className="text-zinc-900" strokeWidth={3} />
                </div>
                <p className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Your resume looks strong!</p>
                <p className="text-sm font-bold text-zinc-600 mt-2">No significant improvements were identified for this JD.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Regenerate Button */}
            <div className="flex justify-end">
                <button
                    onClick={fetchSuggestions}
                    className="px-6 py-3 text-sm text-zinc-900 bg-white border-[3px] border-zinc-900 font-black rounded-xl shadow-[4px_4px_0px_#18181b] hover:-translate-y-1 transition-all uppercase tracking-widest flex items-center gap-2"
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
                            className={`bg-white rounded-[2rem] border-[3px] border-zinc-900 shadow-[8px_8px_0px_#18181b] p-8 relative overflow-hidden`}
                        >
                            {/* Accent thick left border effect via pseudo-element if you wanted, or just a colored pill. Here we use pill. */}
                            <div className={`absolute top-0 left-0 bottom-0 w-4 ${colors.border.replace('border-l-', 'bg-')} border-r-[3px] border-zinc-900`}></div>

                            <div className="ml-4">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-6">
                                    <span className={`text-xs font-black px-3 py-1.5 rounded-lg shadow-[2px_2px_0px_#18181b] uppercase tracking-widest ${colors.badge}`}>
                                        {suggestion.confidence}
                                    </span>
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest background-white border-2 border-zinc-200 px-3 py-1.5 rounded-lg">
                                        {categoryLabels[suggestion.category] || suggestion.category}
                                    </span>
                                </div>

                                {/* Original bullet */}
                                <div className="mb-6">
                                    <p className="text-xs font-black text-zinc-500 mb-2 uppercase tracking-widest">Original</p>
                                    <p className="text-sm font-semibold text-zinc-500 bg-zinc-50 p-4 rounded-2xl border-2 border-zinc-200 border-dashed line-through decoration-zinc-400">
                                        "{suggestion.originalBullet}"
                                    </p>
                                </div>

                                {/* Reason */}
                                <div className="flex items-start gap-3 bg-white border-2 border-zinc-900 p-4 rounded-xl mb-6 shadow-[4px_4px_0px_#18181b] -translate-y-2 translate-x-2 w-[calc(100%-8px)]">
                                    <Lightbulb size={20} className="text-zinc-900 shrink-0 mt-0.5" strokeWidth={2.5} />
                                    <p className="text-sm font-bold text-zinc-900">
                                        {suggestion.reason}
                                    </p>
                                </div>

                                {/* Rewritten bullet */}
                                <div className="mb-8">
                                    <p className="text-xs font-black text-zinc-500 mb-2 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-5 h-5 bg-lime-400 rounded-md border-[1.5px] border-zinc-900 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[12px] font-bold text-zinc-900">edit</span>
                                        </div>
                                        Suggested Rewrite
                                    </p>
                                    <p className="text-base text-zinc-900 bg-lime-50 p-5 rounded-2xl border-[3px] border-zinc-900 font-bold shadow-[4px_4px_0px_#18181b]">
                                        {suggestion.rewrittenBullet}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3 mt-4">
                                    <button
                                        onClick={() => handleCopy(suggestion)}
                                        className={`flex items-center gap-2 text-sm font-black px-6 py-3 border-[3px] border-zinc-900 rounded-xl transition-all uppercase tracking-widest shadow-[4px_4px_0px_#18181b] hover:-translate-y-1 hover:shadow-[6px_6px_0px_#18181b] ${copiedId === suggestion.id ? 'bg-lime-400 text-zinc-900' : 'bg-zinc-900 text-white'}`}
                                    >
                                        {copiedId === suggestion.id ? (
                                            <><Check size={18} strokeWidth={3} /> Copied!</>
                                        ) : (
                                            <><Copy size={18} strokeWidth={2.5} /> Copy String</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
});

export default SuggestionsPanel;
