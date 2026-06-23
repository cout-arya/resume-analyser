import React, { useEffect, useState } from 'react';
import { TrendingUp, Target, FileCheck, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const ATSScoreCard = ({ data, loading }) => {
    const [animatedScore, setAnimatedScore] = useState(0);
    const [showDetails, setShowDetails] = useState(false);

    // Animate score counting up
    useEffect(() => {
        if (!data?.score) return;
        let start = 0;
        const end = data.score;
        const duration = 1200;
        const stepTime = duration / end;

        const timer = setInterval(() => {
            start += 1;
            setAnimatedScore(start);
            if (start >= end) clearInterval(timer);
        }, stepTime);

        return () => clearInterval(timer);
    }, [data?.score]);

    if (loading) {
        return (
            <div className="bg-white rounded-[2rem] border-[3px] border-zinc-900 shadow-[8px_8px_0px_#18181b] p-8 animate-pulse">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-zinc-200" />
                    <div className="h-6 w-40 bg-zinc-200 rounded" />
                </div>
                <div className="flex justify-center mb-8">
                    <div className="w-40 h-40 rounded-full bg-zinc-200" />
                </div>
                <div className="space-y-4">
                    <div className="h-4 w-full bg-zinc-200 rounded" />
                    <div className="h-4 w-3/4 bg-zinc-200 rounded" />
                    <div className="h-4 w-5/6 bg-zinc-200 rounded" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { score, breakdown, summary, details } = data;

    // Color based on score
    const getScoreColor = (s) => {
        if (s >= 75) return { text: 'text-lime-600', bg: 'bg-lime-400', ring: 'stroke-lime-400', light: 'bg-lime-50' };
        if (s >= 50) return { text: 'text-amber-500', bg: 'bg-amber-400', ring: 'stroke-amber-400', light: 'bg-amber-50' };
        return { text: 'text-rose-600', bg: 'bg-rose-500', ring: 'stroke-rose-500', light: 'bg-rose-50' };
    };

    const colors = getScoreColor(score);

    // SVG circle math
    const radius = 62;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedScore / 100) * circumference;

    const breakdownItems = [
        {
            label: 'Keyword Match',
            score: breakdown.keywordMatch,
            max: 25,
            icon: <Target size={16} strokeWidth={3} />,
            color: 'bg-lime-400',
            trackColor: 'bg-zinc-100'
        },
        {
            label: 'Semantic Alignment',
            score: breakdown.semanticAlignment || breakdown.semanticSimilarity || 0,
            max: 30,
            icon: <Sparkles size={16} strokeWidth={3} />,
            color: 'bg-zinc-800',
            trackColor: 'bg-zinc-100'
        },
        {
            label: 'Experience Relevance',
            score: breakdown.experienceRelevance || 0,
            max: 20,
            icon: <TrendingUp size={16} strokeWidth={3} />,
            color: 'bg-zinc-600',
            trackColor: 'bg-zinc-100'
        },
        {
            label: 'Formatting',
            score: breakdown.formatting,
            max: 15,
            icon: <FileCheck size={16} strokeWidth={3} />,
            color: 'bg-teal-400',
            trackColor: 'bg-teal-50'
        },
        {
            label: 'Quantifiable Impact',
            score: breakdown.quantifiableImpact || 0,
            max: 10,
            icon: <Target size={16} strokeWidth={3} />,
            color: 'bg-amber-400',
            trackColor: 'bg-amber-50'
        }
    ];

    return (
        <div className="bg-white rounded-[2rem] border-[3px] border-zinc-900 shadow-[8px_8px_0px_#18181b] overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="text-zinc-900 bg-lime-400 shadow-[2px_2px_0px_#18181b] border-2 border-zinc-900 p-2.5 rounded-xl flex items-center justify-center">
                        <TrendingUp size={20} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 font-headline uppercase tracking-tighter">ATS Score</h3>
                </div>
            </div>

            {/* Circular Score */}
            <div className="flex justify-center pb-6">
                <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                        <circle
                            cx="70" cy="70" r={radius}
                            fill="transparent"
                            stroke="#e4e4e7" /* zinc-200 */
                            strokeWidth="14"
                        />
                        <circle
                            cx="70" cy="70" r={radius}
                            fill="transparent"
                            className={colors.ring}
                            strokeWidth="14"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-5xl font-black font-headline ${colors.text}`}>
                            {animatedScore}
                        </span>
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">
                            / 100
                        </span>
                    </div>
                </div>
            </div>

            {/* Breakdown Bars */}
            <div className="px-8 pb-6 space-y-4">
                {breakdownItems.map((item) => (
                    <div key={item.label}>
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2 text-sm font-bold text-zinc-600">
                                <span className={item.color === 'bg-zinc-800' ? 'text-zinc-400' : 'text-zinc-500'}>{item.icon}</span>
                                {item.label}
                            </div>
                            <span className="text-sm font-black text-zinc-900">
                                {item.score}/{item.max}
                            </span>
                        </div>
                        <div className={`w-full h-3 rounded-full ${item.trackColor} border-2 border-transparent`}>
                            <div
                                className={`h-full rounded-full ${item.color} border-2 border-zinc-900 transition-all duration-1000 ease-out`}
                                style={{ width: `${(item.score / item.max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="px-6 pb-6">
                <div className={`p-4 rounded-2xl ${colors.light} border-2 border-zinc-900 shadow-[4px_4px_0px_rgba(24,24,27,0.1)]`}>
                    <p className="text-sm font-semibold text-zinc-800 leading-relaxed">{summary}</p>
                </div>
            </div>

            {/* Expandable Details */}
            {details && (
                <div className="border-t-[3px] border-zinc-900 bg-zinc-50">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full px-6 py-4 flex items-center justify-between text-sm font-black text-zinc-900 hover:bg-lime-50 transition-colors uppercase tracking-widest"
                    >
                        <span>View Details</span>
                        {showDetails ? <ChevronUp size={20} strokeWidth={3} /> : <ChevronDown size={20} strokeWidth={3} />}
                    </button>

                    {showDetails && (
                        <div className="px-6 pb-6 space-y-6">
                            {/* Matched Keywords */}
                            {details.matchedKeywords?.length > 0 && (
                                <div>
                                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <div className="w-5 h-5 bg-lime-400 rounded-md border-2 border-zinc-900 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[12px] font-bold text-zinc-900">check</span>
                                        </div>
                                        Matched Keywords
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {details.matchedKeywords.map((kw, i) => (
                                            <span key={i} className="px-3 py-1 text-xs font-bold bg-lime-100 text-zinc-900 rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b]">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Missing Keywords */}
                            {details.missingKeywords?.length > 0 && (
                                <div>
                                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <div className="w-5 h-5 bg-rose-400 rounded-md border-2 border-zinc-900 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[12px] font-bold text-zinc-900">close</span>
                                        </div>
                                        Missing Keywords
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {details.missingKeywords.map((kw, i) => (
                                            <span key={i} className="px-3 py-1 text-xs font-bold bg-white text-zinc-900 rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b] opacity-80 line-through decoration-rose-500 decoration-2">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Formatting Checks */}
                            {details.formattingChecks && (
                                <div>
                                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <div className="w-5 h-5 bg-zinc-200 rounded-md border-2 border-zinc-900 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[12px] font-bold text-zinc-900">list</span>
                                        </div>
                                        Structure Checks
                                    </p>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                        {Object.entries(details.formattingChecks).map(([key, val]) => (
                                            <div key={key} className="flex items-center gap-2 text-xs font-bold text-zinc-800 bg-white p-2 border-2 border-zinc-200 rounded-xl">
                                                <div className={`w-5 h-5 rounded-md border-[1.5px] border-zinc-900 flex items-center justify-center ${val === true ? 'bg-lime-400' : val === 'partial' ? 'bg-amber-400' : 'bg-rose-400'}`}>
                                                    <span className="material-symbols-outlined text-[12px] font-bold text-zinc-900">
                                                        {val === true ? 'check' : val === 'partial' ? 'drag_handle' : 'close'}
                                                    </span>
                                                </div>
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ATSScoreCard;
