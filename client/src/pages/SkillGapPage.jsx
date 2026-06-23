import React, { useEffect, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import SkillGapDashboard from '../components/SkillGapDashboard';
import { Upload, Download, Loader2 } from 'lucide-react';

const SkillGapPage = () => {
    const { isReady, skillGapData, analyzing, analysisError, runAnalysis, downloadReport, loadingCachedData } = useSession();
    const navigate = useNavigate();
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (isReady && !skillGapData && !analyzing && !analysisError && !loadingCachedData) {
            runAnalysis();
        }
    }, [isReady, skillGapData, analyzing, analysisError, loadingCachedData, runAnalysis]);

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
                    Please upload both your resume and a job description on the Analyzer page before viewing your skill gap analysis.
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

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {skillGapData && (
                <div className="flex justify-end">
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex items-center gap-2 px-5 py-2.5 border-[3px] border-zinc-900 text-zinc-900 bg-white rounded-xl text-sm font-black shadow-[4px_4px_0px_#18181b] hover:-translate-y-1 transition-all uppercase tracking-widest disabled:opacity-50"
                    >
                        {downloading ? <Loader2 size={16} className="animate-spin" strokeWidth={3} /> : <Download size={16} strokeWidth={3} />}
                        Download Report
                    </button>
                </div>
            )}

            {analysisError && (
                <div className="p-5 bg-rose-50 border-[3px] border-rose-500 rounded-2xl shadow-[4px_4px_0px_#f43f5e] text-rose-700 font-bold flex items-center justify-between">
                    <span>{analysisError}</span>
                    <button
                        onClick={runAnalysis}
                        className="px-4 py-2 bg-rose-500 text-white border-2 border-zinc-900 rounded-xl text-xs font-black uppercase tracking-widest"
                    >
                        Retry
                    </button>
                </div>
            )}

            <SkillGapDashboard data={skillGapData} loading={analyzing} />
        </div>
    );
};

export default SkillGapPage;
