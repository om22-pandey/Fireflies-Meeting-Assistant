"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';
import MeetingDetail from '../components/MeetingDetail';
import UploadModal from '../components/UploadModal';
import AssistantChatbot from '../components/AssistantChatbot';
import { 
  Sparkles, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle, 
  X,
  MessageSquare,
  Bot,
  Video
} from 'lucide-react';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('meetings');
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<number | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  // Fetch all meetings
  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/meetings');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMeetings(data);
    } catch (err) {
      showToast('Failed to fetch meeting entries from SQLite db.', 'error');
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleDeleteMeeting = async (id: number) => {
    if (confirm('Are you sure you want to delete this meeting? This will permanently wipe all transcripts, summaries, and action items from the SQLite database.')) {
      try {
        const res = await fetch(`/api/meetings/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error();
        showToast('Meeting successfully deleted from SQLite.');
        fetchMeetings();
        if (selectedMeetingId === id) {
          setSelectedMeetingId(null);
        }
      } catch (err) {
        showToast('Failed to delete meeting.', 'error');
      }
    }
  };

  const handleUploadSuccess = (newId: number) => {
    setIsUploadOpen(false);
    showToast('AI Synthesis Completed! New entry stored in SQLite.', 'success');
    fetchMeetings();
    setSelectedMeetingId(newId); // auto-navigate to detail page
  };

  // Identify active selected meeting title for chatbot context
  const activeMeetingTitle = meetings.find(m => m.id === selectedMeetingId)?.title || '';

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans select-none transition-colors duration-300 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Toast Notification Popup */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 py-3.5 px-4.5 rounded-2xl border shadow-xl animate-bounce transition-all ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-500'
            : toast.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/25 text-rose-500'
              : 'bg-violet-500/10 border-violet-500/25 text-violet-500'
        }`}>
          {toast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.type === 'info' && <Sparkles className="w-5 h-5 flex-shrink-0" />}
          
          <span className="text-xs font-semibold leading-tight">{toast.message}</span>
          
          <button
            onClick={() => setToast(null)}
            className="p-0.5 rounded-full hover:bg-slate-500/15 text-slate-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main SaaS Sidebar Navigation */}
      <Sidebar 
        activeTab={selectedMeetingId ? '' : activeTab}
        setActiveTab={(tab) => {
          setSelectedMeetingId(null);
          setActiveTab(tab);
        }}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Center Layout Container */}
      <div className="flex-1 flex overflow-hidden h-full relative">
        {selectedMeetingId ? (
          /* detailed view */
          <MeetingDetail
            meetingId={selectedMeetingId}
            onBack={() => setSelectedMeetingId(null)}
            darkMode={darkMode}
          />
        ) : (
          /* general tab dashboard views */
          activeTab === 'meetings' ? (
            <Dashboard
              meetings={meetings}
              onSelectMeeting={setSelectedMeetingId}
              onDeleteMeeting={handleDeleteMeeting}
              onOpenUpload={() => setIsUploadOpen(true)}
              darkMode={darkMode}
            />
          ) : (
            /* Dedicated full-page assistant space */
            <div className="flex-1 flex flex-col h-full bg-slate-900/5">
              {/* Header Title Bar */}
              <div className={`px-8 py-5 border-b flex items-center justify-between transition-all ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Ask Fred Workspace</h1>
                  <p className="text-xs text-slate-400 mt-0.5">Query across your global meeting records using AI</p>
                </div>
              </div>

              {/* Chat View Layout (Jo full container me open hoga) */}
              <div className="flex-1 overflow-hidden p-6 flex justify-center items-center">
                <div className={`w-full max-w-5xl h-full rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all ${
                  darkMode ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-200'
                }`}>
                  <AssistantChatbot
                    meetings={meetings}
                    meetingId={0} // 0 matlab by default 'All Meetings' select rahega global context ke liye
                    meetingTitle="Global Workspace"
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {/* Right Column Context Assistant Chatbot (LOCKED SIDEBAR FOR MEETING PAGE) */}
      {selectedMeetingId && isRightSidebarOpen && (
        <div className="w-80 h-full flex-shrink-0 z-10 border-l dark:border-slate-800">
          <AssistantChatbot
            meetings={meetings}
            meetingId={selectedMeetingId}
            meetingTitle={activeMeetingTitle}
            darkMode={darkMode}
          />
        </div>
      )}

      {/* Upload Form Modal */}
      {isUploadOpen && (
        <UploadModal
          onClose={() => setIsUploadOpen(false)}
          onSuccess={handleUploadSuccess}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}