"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadBankStatement } from "@/api/backendApi";

export default function BankStatementUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { completeOnboarding } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    // Reset error state
    setError(null);
    
    // Validate file type
    if (selectedFile && !selectedFile.name.endsWith('.xlsx')) {
      setError('Please upload an Excel (.xlsx) file');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a bank statement file');
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      await uploadBankStatement(file);
      await completeOnboarding();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload bank statement');
      setIsUploading(false);
    }
  };

  return (
    <div className="w-[90%] max-w-[500px] mx-auto glass rounded-[28px] p-6 md:p-8 flex flex-col items-center justify-between min-h-[420px] animate-fade-in shadow-lg hover:shadow-xl transition-all">
      <h1 className="text-3xl xs:text-4xl md:text-5xl font-bold text-white tracking-tight mt-4 md:mt-6">
        Upload Bank Statement
      </h1>
      
      <p className="text-gray-300 text-center mt-4 mb-6">
        Please upload your last 6 months bank statement as an Excel file to continue.
      </p>
      
      <form onSubmit={handleSubmit} className="w-full max-w-[400px] space-y-5 mt-6">
        <div className="space-y-4 border-b border-gray-700/50 pb-6">
          <label 
            htmlFor="bankStatement" 
            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-700/30 bg-gray-800/50 border-gray-600 hover:border-gray-500"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p className="mb-2 text-sm text-gray-400">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-400">Excel file (.xlsx) only</p>
            </div>
            <input 
              id="bankStatement" 
              type="file" 
              accept=".xlsx" 
              className="hidden" 
              onChange={handleFileChange}
              ref={fileInputRef}
            />
          </label>
          
          {file && (
            <div className="flex items-center justify-between bg-gray-800/80 p-3 rounded-lg border border-gray-700">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-sm text-gray-300 truncate max-w-[200px]">{file.name}</span>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-red-400 hover:text-red-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isUploading || !file}
          className={`w-full py-2.5 mt-8 flex items-center justify-center rounded-lg text-white font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-gray-700/50 ${
            !file ? 'bg-gray-700/50 cursor-not-allowed' : 'btn-primary'
          }`}
        >
          {isUploading ? (
            <>
              <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></span>
              Uploading...
            </>
          ) : (
            'Continue'
          )}
        </button>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mt-4">
            <p className="text-sm text-red-400 text-center">{error}</p>
          </div>
        )}
      </form>
      
      <div className="mt-6 mb-4 text-center">
        <p className="text-gray-400 text-xs">
          Your financial information is securely encrypted and only used to provide personalized services.
        </p>
      </div>
    </div>
  );
}
