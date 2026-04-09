import React, { useEffect } from 'react';
import { useSession } from '../context/SessionContext';
import { useNavigate } from 'react-router-dom';
import ATSScoreCard from '../components/ATSScoreCard';
import { TrendingUp, Upload } from 'lucide-react';

const ATSScorePage = () => {
    const { isReady, atsData, analyzing, analysisError, runAnalysis } = useSession();
    const navigate = useNavigate();

    useEffect(() => {
        if (isReady && !atsData && !analyzing && !analysisError) {
            runAnalysis();
        }
    }, [isReady]);

    if (!isReady) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-blue-50 p-6 rounded-2xl mb-6">
                    <Upload size={48} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload Documents First</h2>
                <p className="text-gray-500 mb-6 max-w-md">
                    Please upload both your resume and a job description on the Analyzer page before viewing your ATS score.
                </p>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                >
                    Go to Analyzer
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="text-blue-600 bg-blue-50 p-2.5 rounded-xl">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">ATS Score Analysis</h2>
                        <p className="text-sm text-gray-500">See how well your resume matches the job description</p>
                    </div>
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

            <ATSScoreCard data={atsData} loading={analyzing} />
        </div>
    );
};

export default ATSScorePage;
