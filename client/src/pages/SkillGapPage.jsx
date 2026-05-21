import React, { useEffect, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import SkillGapDashboard from '../components/SkillGapDashboard';
import { BarChart3, Upload, Download, Loader2 } from 'lucide-react';

const SkillGapPage = () => {
    const { isReady, skillGapData, analyzing, analysisError, runAnalysis, downloadReport, loadingCachedData } = useSession();
    const navigate = useNavigate();
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        // Only run analysis if ready, no data, not already analyzing, and cache isn't loading
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
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-violet-50 p-6 rounded-2xl mb-6">
                    <Upload size={48} className="text-violet-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Documents First</h2>
                <p className="text-gray-500 mb-6 max-w-md">
                    Please upload both your resume and a job description on the Analyzer page before viewing your skill gap analysis.
                </p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2.5 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors shadow-sm"
                >
                    Go to Analyzer
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="text-violet-600 bg-violet-50 p-2.5 rounded-xl">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Skill Gap Analysis</h2>
                            <p className="text-sm text-gray-500">Identify matched, partial, and missing skills compared to the job description</p>
                        </div>
                    </div>

                    {skillGapData && (
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            Download Report
                        </button>
                    )}
                </div>
            </div>

            {analysisError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
                    <span>{analysisError}</span>
                    <button
                        onClick={runAnalysis}
                        className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-semibold transition-colors"
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
