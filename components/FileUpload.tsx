
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onFileAnalysis: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileAnalysis }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileAnalysis(e.dataTransfer.files[0]);
    }
  }, [onFileAnalysis]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileAnalysis(e.target.files[0]);
    }
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-semibold mb-2 text-white">Step 1: Upload Your Data</h2>
      <p className="text-gray-400 mb-6">Upload a CSV file with URL, Clicks, and Impressions columns to begin.</p>
      
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center w-full h-64 p-8 border-2 border-dashed rounded-xl transition-all duration-300 ${isDragging ? 'border-cyan-400 bg-gray-700/50' : 'border-gray-600 bg-gray-800/50'}`}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".csv"
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center justify-center text-gray-400">
            <UploadIcon className="w-12 h-12 mb-4" />
            <p className="text-lg font-semibold">
                <label htmlFor="file-upload" className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 rounded">
                    Click to upload
                </label>
                {' '}or drag and drop
            </p>
            <p className="text-sm">CSV files only</p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
