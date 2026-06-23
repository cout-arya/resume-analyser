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
            <div className="bg-white rounded-[2rem] border-[3px] border-zinc-900 shadow-[8px_8px_0px_#18181b] p-8 animate-pulse">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-zinc-200" />
                    <div className="h-6 w-40 bg-zinc-200 rounded" />
                </div>
                <div className="space-y-4">
                    <div className="h-20 bg-zinc-200 rounded-[1.5rem] border-2 border-zinc-300" />
                    <div className="h-20 bg-zinc-200 rounded-[1.5rem] border-2 border-zinc-300" />
                    <div className="h-20 bg-zinc-200 rounded-[1.5rem] border-2 border-zinc-300" />
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { matched = [], partial = [], missing = [], meta = {} } = data;

    return (
        <div className="bg-white rounded-[2rem] border-[3px] border-zinc-900 shadow-[8px_8px_0px_#18181b] overflow-hidden">
            {/* Header */}
            <div className="px-8 pt-6 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <div className="text-zinc-900 bg-lime-400 shadow-[2px_2px_0px_#18181b] border-2 border-zinc-900 p-2.5 rounded-xl flex items-center justify-center">
                            <BarChart3 size={20} strokeWidth={2.5} />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 font-headline uppercase tracking-tighter">Skill Gap</h3>
                    </div>
                </div>

                {/* Match Rate Badge */}
                {meta.matchRate !== undefined && (
                    <div className="mt-4 flex items-center gap-4 text-sm bg-zinc-50 border-2 border-zinc-200 p-3 rounded-2xl">
                        <div className="flex-1 h-4 rounded-full bg-white border-[3px] border-zinc-900 overflow-hidden relative">
                            <div
                                className={`h-full border-r-[3px] border-zinc-900 absolute left-0 top-0 transition-all duration-1000 ${meta.matchRate >= 70 ? 'bg-lime-400' :
                                        meta.matchRate >= 40 ? 'bg-amber-400' : 'bg-rose-400'
                                    }`}
                                style={{ width: `${meta.matchRate}%` }}
                            />
                        </div>
                        <span className="text-zinc-900 font-black text-lg whitespace-nowrap uppercase tracking-widest">
                            {meta.matchRate}% MATCH
                        </span>
                    </div>
                )}
            </div>

            <div className="p-8 pt-4 space-y-8">

                {/* ✅ Matched Skills */}
                {matched.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-lime-400 rounded-md border-2 border-zinc-900 flex items-center justify-center">
                                <CheckCircle2 size={14} className="text-zinc-900" strokeWidth={3} />
                            </div>
                            <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">
                                Matched Skills
                                <span className="ml-2 text-xs font-bold text-zinc-400">({matched.length})</span>
                            </h4>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                            {matched.map((skill, i) => (
                                <span
                                    key={i}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-lime-100 text-zinc-900 rounded-xl text-xs font-black border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b]"
                                >
                                    <CheckCircle2 size={14} strokeWidth={3} />
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* ⚠️ Partial Matches */}
                {partial.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-amber-400 rounded-md border-2 border-zinc-900 flex items-center justify-center">
                                <AlertTriangle size={14} className="text-zinc-900" strokeWidth={3} />
                            </div>
                            <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">
                                Partial Matches
                                <span className="ml-2 text-xs font-bold text-zinc-400">({partial.length})</span>
                            </h4>
                        </div>
                        <div className="space-y-3">
                            {partial.map((item, i) => {
                                const jdSkill = typeof item === 'string' ? item : item.jdSkill;
                                const resumeSkill = typeof item === 'string' ? null : item.resumeSkill;

                                return (
                                    <div
                                        key={i}
                                        className="flex items-center gap-3 px-4 py-3 bg-amber-50 rounded-2xl border-2 border-zinc-900 shadow-[4px_4px_0px_#18181b] text-sm"
                                    >
                                        <AlertTriangle size={18} className="text-zinc-900 shrink-0" strokeWidth={2.5} />
                                        <span className="text-zinc-900 font-bold">{jdSkill}</span>
                                        {resumeSkill && (
                                            <>
                                                <ChevronRight size={16} className="text-zinc-400" strokeWidth={3} />
                                                <span className="text-zinc-600 font-bold text-xs bg-white border-2 border-zinc-200 px-2 py-1 rounded-lg">
                                                    You have: <strong className="text-zinc-900">{resumeSkill}</strong>
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
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-6 h-6 bg-rose-400 rounded-md border-2 border-zinc-900 flex items-center justify-center">
                                <XCircle size={14} className="text-zinc-900" strokeWidth={3} />
                            </div>
                            <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">
                                Missing Skills
                                <span className="ml-2 text-xs font-bold text-zinc-400">({missing.length})</span>
                            </h4>
                        </div>
                        <div className="space-y-3">
                            {missing.map((item, i) => {
                                const skill = typeof item === 'string' ? item : item.skill;
                                const suggestion = typeof item === 'string' ? null : item.suggestion;
                                const isExpanded = expandedMissing.has(i);

                                return (
                                    <div
                                        key={i}
                                        className={`rounded-2xl border-2 border-zinc-900 overflow-hidden transition-all ${isExpanded ? 'shadow-[4px_4px_0px_#18181b] bg-zinc-50' : 'shadow-[2px_2px_0px_#18181b] bg-white'}`}
                                    >
                                        <button
                                            onClick={() => suggestion && toggleExpand(i)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isExpanded ? 'bg-zinc-50 border-b-2 border-zinc-200' : 'hover:bg-rose-50'}`}
                                        >
                                            <XCircle size={18} className="text-zinc-900 shrink-0" strokeWidth={2.5} />
                                            <span className="text-zinc-900 font-bold text-sm flex-1 uppercase tracking-wider">{skill}</span>
                                            {suggestion && (
                                                <ChevronRight
                                                    size={18}
                                                    className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                                    strokeWidth={3}
                                                />
                                            )}
                                        </button>

                                        {isExpanded && suggestion && (
                                            <div className="px-5 py-4 bg-white border-t border-zinc-200 flex gap-3">
                                                <div className="w-6 h-6 bg-lime-400 rounded-md border-2 border-zinc-900 flex items-center justify-center shrink-0 mt-0.5">
                                                    <Lightbulb size={12} className="text-zinc-900" strokeWidth={3} />
                                                </div>
                                                <p className="text-xs font-bold text-zinc-600 leading-relaxed pt-1">
                                                    {suggestion}
                                                </p>
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
                    <div className="text-center py-10 text-zinc-400 bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-300">
                        <BarChart3 size={40} className="mx-auto mb-3 opacity-50" strokeWidth={1} />
                        <p className="text-sm font-bold uppercase tracking-widest">No skill data available</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SkillGapDashboard;
