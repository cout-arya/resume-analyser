import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Lightbulb, ChevronRight, BarChart3 } from 'lucide-react';

const SkillGapDashboard = ({ data, loading }) => {
    const [expandedMissing, setExpandedMissing] = useState(new Set());

    const toggleExpand = (idx) => {
        setExpandedMissing(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gray-200" />
                    <div className="h-5 w-40 bg-gray-200 rounded" />
                </div>
                <div className="space-y-4">
                    <div className="h-16 bg-gray-200 rounded-lg" />
                    <div className="h-16 bg-gray-200 rounded-lg" />
                    <div className="h-16 bg-gray-200 rounded-lg" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { matched = [], partial = [], missing = [], meta = {} } = data;

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-2">
                <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-3">
                        <div className="text-violet-600 bg-violet-50 p-2 rounded-lg">
                            <BarChart3 size={18} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Skill Gap Analysis</h3>
                    </div>
                </div>

                {/* Match Rate Badge */}
                {meta.matchRate !== undefined && (
                    <div className="mt-3 flex items-center gap-3 text-sm">
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ${
                                    meta.matchRate >= 70 ? 'bg-emerald-500' :
                                    meta.matchRate >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${meta.matchRate}%` }}
                            />
                        </div>
                        <span className="text-gray-600 font-semibold whitespace-nowrap">
                            {meta.matchRate}% match
                        </span>
                    </div>
                )}
            </div>

            <div className="p-6 pt-4 space-y-5">

                {/* ✅ Matched Skills */}
                {matched.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 size={16} className="text-emerald-500" />
                            <h4 className="text-sm font-semibold text-gray-700">
                                Matched Skills
                                <span className="ml-2 text-xs font-normal text-gray-400">({matched.length})</span>
                            </h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {matched.map((skill, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200"
                                >
                                    <CheckCircle2 size={12} />
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ⚠️ Partial Matches */}
                {partial.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle size={16} className="text-amber-500" />
                            <h4 className="text-sm font-semibold text-gray-700">
                                Partial Matches
                                <span className="ml-2 text-xs font-normal text-gray-400">({partial.length})</span>
                            </h4>
                        </div>
                        <div className="space-y-2">
                            {partial.map((item, i) => {
                                const jdSkill = typeof item === 'string' ? item : item.jdSkill;
                                const resumeSkill = typeof item === 'string' ? null : item.resumeSkill;

                                return (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200 text-sm"
                                    >
                                        <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                        <span className="text-amber-800 font-medium">{jdSkill}</span>
                                        {resumeSkill && (
                                            <>
                                                <ChevronRight size={14} className="text-amber-400" />
                                                <span className="text-amber-600 text-xs">
                                                    You have: <strong>{resumeSkill}</strong>
                                                </span>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ❌ Missing Skills */}
                {missing.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <XCircle size={16} className="text-red-500" />
                            <h4 className="text-sm font-semibold text-gray-700">
                                Missing Skills
                                <span className="ml-2 text-xs font-normal text-gray-400">({missing.length})</span>
                            </h4>
                        </div>
                        <div className="space-y-2">
                            {missing.map((item, i) => {
                                const skill = typeof item === 'string' ? item : item.skill;
                                const suggestion = typeof item === 'string' ? null : item.suggestion;
                                const isExpanded = expandedMissing.has(i);

                                return (
                                    <div
                                        key={i}
                                        className="rounded-lg border border-red-200 overflow-hidden transition-all"
                                    >
                                        <button
                                            onClick={() => suggestion && toggleExpand(i)}
                                            className="w-full flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 transition-colors text-left"
                                        >
                                            <XCircle size={14} className="text-red-500 shrink-0" />
                                            <span className="text-red-800 font-medium text-sm flex-1">{skill}</span>
                                            {suggestion && (
                                                <ChevronRight
                                                    size={14}
                                                    className={`text-red-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                />
                                            )}
                                        </button>

                                        {isExpanded && suggestion && (
                                            <div className="px-3 py-2 bg-white border-t border-red-100">
                                                <div className="flex gap-2">
                                                    <Lightbulb size={14} className="text-amber-500 shrink-0 mt-0.5" />
                                                    <p className="text-xs text-gray-600 leading-relaxed">
                                                        {suggestion}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {matched.length === 0 && partial.length === 0 && missing.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                        <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No skill data available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillGapDashboard;
