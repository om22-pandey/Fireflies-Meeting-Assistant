"use client";

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle,
  FileCheck2,
  AlertCircle
} from 'lucide-react';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: (newMeetingId: number) => void;
  darkMode: boolean;
}

export default function UploadModal({ onClose, onSuccess, darkMode }: UploadModalProps) {
  const [meetingTitle, setMeetingTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Loading & Step execution states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');

  const loadingMessages = [
    "Uploading session logs to server memory...",
    "Parsing dialogue schemas and participants...",
    "Consulting Fred (Gemini AI Summarizer Engine)...",
    "Structuring bulleted milestones and chronologies...",
    "Formulating action items and assigning owners...",
    "Writing relational entries to SQLite database..."
  ];

  // Rotate loading messages
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => {
          if (prev < loadingMessages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const ext = droppedFile.name.split('.').pop()?.toLowerCase();
      if (['txt', 'json', 'vtt'].includes(ext || '')) {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Unsupported format. Please upload .txt, .json, or .vtt files.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !pastedText.trim()) {
      setError('Please provide transcript text or upload a file.');
      return;
    }

    try {
      setLoading(true);
      setLoadingStep(0);
      setError('');

      const formData = new FormData();
      formData.append('title', meetingTitle);

      if (file) {
        formData.append('file', file);
      } else {
        formData.append('text', pastedText);
      }

      const res = await fetch('/api/meetings', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to analyze transcript');
      }

      const data = await res.json();
      onSuccess(data.id);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to upload and analyze. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {/* Loading Overlay */}
      {loading ? (
        <div className={`p-8 rounded-3xl border w-full max-w-md text-center shadow-2xl flex flex-col items-center justify-center animate-fade-in ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="relative flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-full border-4 border-violet-600/20 border-t-violet-600 animate-spin" />
            <Sparkles className="w-7 h-7 text-violet-500 absolute animate-pulse" />
          </div>
          
          <h3 className="font-display font-extrabold text-lg">AI Meeting Synthesizer</h3>
          
          <div className="mt-3.5 flex flex-col gap-1 w-full max-w-xs">
            <p className={`text-sm h-12 leading-relaxed flex items-center justify-center font-medium ${
              darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {loadingMessages[loadingStep]}
            </p>
            
            {/* Step indicators */}
            <div className="flex justify-center gap-1.5 mt-2">
              {loadingMessages.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === loadingStep
                      ? 'w-6 bg-violet-600'
                      : idx < loadingStep
                        ? 'w-2 bg-emerald-500'
                        : 'w-2 bg-slate-700/50 dark:bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Form Card */
        <div className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all duration-300 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Header */}
          <div className="p-5 border-b flex items-center justify-between dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              <h3 className="font-display font-extrabold text-base">Upload Meeting Transcript</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-slate-500/10 text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
            {/* Optional Title input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Meeting Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Q3 Sales Alignment Sync"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className={`py-2 px-3.5 rounded-xl border text-sm outline-none transition-all ${
                  darkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-violet-600' 
                    : 'bg-white border-slate-200 text-slate-800 focus:border-violet-500'
                }`}
              />
            </div>

            {/* Selector: File vs Paste */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Transcript Input Source
              </label>
              
              {!file ? (
                /* Textarea for paste */
                <div className="flex flex-col gap-3">
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                      isDragOver
                        ? 'border-violet-600 bg-violet-500/5'
                        : darkMode
                          ? 'border-slate-800 hover:border-slate-700 bg-slate-950/20'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
                    }`}
                  >
                    <input
                      type="file"
                      id="transcript-file"
                      accept=".txt,.json,.vtt"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="transcript-file" className="cursor-pointer flex flex-col items-center">
                      <Upload className="w-8 h-8 text-violet-500 mb-2 animate-bounce" />
                      <span className="text-sm font-semibold block">Drag & drop your transcript file</span>
                      <span className="text-xs text-slate-400 mt-1 block">Supports .txt, .json, and .vtt formats</span>
                    </label>
                  </div>

                  {/* Text Separator */}
                  <div className="relative flex items-center justify-center py-1">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t dark:border-slate-800" />
                    </div>
                    <span className="relative px-3 text-[10px] font-bold uppercase text-slate-400 bg-white dark:bg-slate-900">
                      Or manually paste text
                    </span>
                  </div>

                  {/* Plain Text editor */}
                  <textarea
                    rows={5}
                    placeholder="Sarah Jenkins: Welcome team...&#10;Alex Rivera: Hi, let's discuss our progress..."
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs font-mono outline-none transition-all resize-none ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-violet-600' 
                        : 'bg-white border-slate-200 text-slate-800 focus:border-violet-500'
                    }`}
                  />
                </div>
              ) : (
                /* Selected File Card */
                <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                  darkMode ? 'bg-slate-950/65 border-slate-850' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold block truncate">{file.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 block">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-500/10 text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Error alerts */}
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-start gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-end mt-2 pt-4 border-t dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className={`py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                  darkMode ? 'hover:bg-slate-850 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!file && !pastedText.trim()}
                className="py-2.5 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-45 text-white text-xs font-semibold transition-all shadow-lg shadow-violet-600/15"
              >
                Synthesize Transcript
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
