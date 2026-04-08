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
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gray-200" />
                    <div className="h-5 w-32 bg-gray-200 rounded" />
                </div>
                <div className="flex justify-center mb-6">
                    <div className="w-40 h-40 rounded-full bg-gray-200" />
                </div>
                <div className="space-y-3">
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-4 w-5/6 bg-gray-200 rounded" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { score, breakdown, summary, details } = data;

    // Color based on score
    const getScoreColor = (s) => {
        if (s >= 75) return { text: 'text-emerald-600', bg: 'bg-emerald-500', ring: 'stroke-emerald-500', light: 'bg-emerald-50' };
        if (s >= 50) return { text: 'text-amber-600', bg: 'bg-amber-500', ring: 'stroke-amber-500', light: 'bg-amber-50' };
        return { text: 'text-red-600', bg: 'bg-red-500', ring: 'stroke-red-500', light: 'bg-red-50' };
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
            max: 30,
            icon: <Target size={16} />,
            color: 'bg-blue-500',
            trackColor: 'bg-blue-100'
        },
        {
            label: 'Semantic Similarity',
            score: breakdown.semanticSimilarity,
            max: 50,
            icon: <Sparkles size={16} />,
            color: 'bg-violet-500',
            trackColor: 'bg-violet-100'
        },
        {
            label: 'Formatting',
            score: breakdown.formatting,
            max: 20,
            icon: <FileCheck size={16} />,
            color: 'bg-teal-500',
            trackColor: 'bg-teal-100'
        }
    ];

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
                <div className="flex items-center gap-3 mb-1">
                    <div className="text-blue-600 bg-blue-50 p-2 rounded-lg">
                        <TrendingUp size={18} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">ATS Score</h3>
                </div>
            </div>

            {/* Circular Score */}
            <div className="flex justify-center pb-4">
                <div className="relative w-36 h-36">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 140 140">
                        <circle
                            cx="70" cy="70" r={radius}
                            fill="transparent"
                            stroke="#f1f5f9"
                            strokeWidth="12"
                        />
                        <circle
                            cx="70" cy="70" r={radius}
                            fill="transparent"
                            className={colors.ring}
                            strokeWidth="12"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-4xl font-black ${colors.text}`}>
                            {animatedScore}
                        </span>
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            / 100
                        </span>
                    </div>
                </div>
            </div>

            {/* Breakdown Bars */}
            <div className="px-6 pb-4 space-y-3">
                {breakdownItems.map((item) => (
                    <div key={item.label}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="text-gray-400">{item.icon}</span>
                                {item.label}
                            </div>
                            <span className="text-sm font-semibold text-gray-800">
                                {item.score}/{item.max}
                            </span>
                        </div>
                        <div className={`w-full h-2 rounded-full ${item.trackColor}`}>
                            <div
                                className={`h-full rounded-full ${item.color} transition-all duration-1000 ease-out`}
                                style={{ width: `${(item.score / item.max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary */}
            <div className="px-6 pb-4">
                <div className={`p-3 rounded-lg ${colors.light}`}>
                    <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
                </div>
            </div>

            {/* Expandable Details */}
            {details && (
                <div className="border-t border-gray-100">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="w-full px-6 py-3 flex items-center justify-between text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                        <span>View Details</span>
                        {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    {showDetails && (
                        <div className="px-6 pb-4 space-y-4">
                            {/* Matched Keywords */}
                            {details.matchedKeywords?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        ✅ Matched Keywords
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {details.matchedKeywords.map((kw, i) => (
                                            <span key={i} className="px-2 py-0.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Missing Keywords */}
                            {details.missingKeywords?.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        ❌ Missing Keywords
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {details.missingKeywords.map((kw, i) => (
                                            <span key={i} className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 rounded-full border border-red-200">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Formatting Checks */}
                            {details.formattingChecks && (
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        📋 Structure Checks
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(details.formattingChecks).map(([key, val]) => (
                                            <div key={key} className="flex items-center gap-2 text-xs text-gray-600">
                                                <span className={val === true ? 'text-emerald-500' : val === 'partial' ? 'text-amber-500' : 'text-red-400'}>
                                                    {val === true ? '✓' : val === 'partial' ? '~' : '✗'}
                                                </span>
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
