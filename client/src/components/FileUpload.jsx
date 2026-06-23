import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const UploadZone = ({ onUpload, type, label, acceptedFile }) => {
    const [error, setError] = useState(null);

    const onDrop = async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        try {
            onUpload(file);
        } catch {
            setError('Upload failed');
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        maxFiles: 1
    });

    return (
        <div
            {...getRootProps()}
            className={clsx(
                "border-[3px] rounded-2xl p-8 text-center cursor-pointer transition-all duration-300",
                isDragActive ? "border-zinc-900 bg-lime-50 shadow-[6px_6px_0px_#18181b] -translate-y-1" : "border-zinc-900 hover:shadow-[6px_6px_0px_#18181b] hover:-translate-y-1 hover:-translate-x-0.5",
                acceptedFile ? "bg-lime-400 border-zinc-900 shadow-[4px_4px_0px_#18181b]" : "bg-white shadow-[4px_4px_0px_#18181b]"
            )}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
                {acceptedFile ? (
                    <div className="w-14 h-14 bg-white rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b] flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-lime-600" strokeWidth={3} />
                    </div>
                ) : (
                    <div className="w-14 h-14 bg-zinc-100 rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_#18181b] flex items-center justify-center group-hover:bg-lime-400 transition-colors">
                        <Upload className="w-7 h-7 text-zinc-900" strokeWidth={2.5} />
                    </div>
                )}
                <h3 className="font-black text-zinc-900 text-lg uppercase tracking-tight">{label}</h3>
                <p className="text-sm font-bold text-zinc-600 px-4">
                    {acceptedFile ? acceptedFile.name : "Drag & drop or click to browse"}
                </p>
                {error && <p className="text-rose-600 text-sm flex items-center gap-1 font-bold mt-2"><AlertCircle size={16} strokeWidth={3} /> {error}</p>}
            </div>
        </div>
    );
};

export default UploadZone;
