import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import clsx from 'clsx';

const UploadZone = ({ onUpload, type, label, acceptedFile }) => {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const onDrop = async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        // Determine sessionId from local storage or parent, but for MVP simpler to just pass or let backend handle new
        // logic: if session exists in parent, use it, else backend creates new

        try {
            // We'll let parent handle the actual API call to keep session sync simple, 
            // or we return the file object and parent uploads. 
            // Actually, let's just upload here for simplicity and pass callback.
            onUpload(file);
        } catch (err) {
            setError('Upload failed');
        } finally {
            setUploading(false);
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
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-400",
                acceptedFile ? "bg-green-50 border-green-500" : "bg-white"
            )}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2">
                {acceptedFile ? (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                    <Upload className="w-8 h-8 text-gray-400" />
                )}
                <p className="font-medium text-gray-700">{label}</p>
                <p className="text-sm text-gray-500">
                    {acceptedFile ? acceptedFile.name : "Drag & drop or click to upload"}
                </p>
                {error && <p className="text-red-500 text-sm flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
            </div>
        </div>
    );
};

export default UploadZone;
