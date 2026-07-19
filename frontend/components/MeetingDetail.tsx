"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  Search, 
  Sparkles, 
  CheckSquare, 
  Clock, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  UserPlus, 
  Users, 
  Calendar,
  X,
  Volume2,
  ChevronRight,
  MessageSquare,
  Bookmark
} from 'lucide-react';
import { Meeting, TranscriptSegment, ActionItem, Chapter } from '../types';
import { formatDuration, formatDate } from './Dashboard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://fireflies-meeting-assistant.onrender.com";
interface MeetingDetailProps {
  meetingId: number;
  onBack: () => void;
  darkMode: boolean;
}

export default function MeetingDetail({ meetingId, onBack, darkMode }: MeetingDetailProps) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://fireflies-meeting-assistant.onrender.com";
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(0.8);
  
  // Edit metadata states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [newParticipant, setNewParticipant] = useState('');

  // Search & Filter state
  const [activeLeftTab, setActiveLeftTab] = useState<'summary' | 'actionItems'>('summary');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  
  // New action item state
  const [newActionText, setNewActionText] = useState('');
  const [newActionAssignee, setNewActionAssignee] = useState('');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const transcriptContainerRef = useRef<HTMLDivElement | null>(null);
  const activeSegmentRef = useRef<HTMLDivElement | null>(null);

  // Fetch meeting detail
  const fetchMeetingDetail = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/meetings/${meetingId}`);
      if (!res.ok) {
        throw new Error('Failed to load meeting details');
      }
      const data = await res.json();
      setMeeting(data);
      setEditedTitle(data.title);
      setError('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetingDetail();
    // Stop audio if running
    setIsPlaying(false);
    setCurrentTime(0);
    setPlaybackSpeed(1);
  }, [meetingId]);

  // Sync active scroll inside transcript
  useEffect(() => {
    if (isPlaying && activeSegmentRef.current && transcriptContainerRef.current) {
      activeSegmentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [currentTime, isPlaying]);

  // Audio elements control
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log('Audio playback prevented', e));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const seekTo = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
      setCurrentTime(seconds);
    }
  };

  const handleSeekBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Update title handler
  const saveTitle = async () => {
    if (!meeting || !editedTitle.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: editedTitle,
          participants: meeting.participants
        })
      });
      if (res.ok) {
        setMeeting({ ...meeting, title: editedTitle });
        setIsEditingTitle(false);
      }
    } catch (err) {
      console.error('Failed to update title', err);
    }
  };

  // Participant Management CRUD
  const removeParticipant = async (nameToRemove: string) => {
    if (!meeting) return;
    const filtered = meeting.participants.filter(p => p !== nameToRemove);
    try {
      const res = await fetch(`${API_BASE}/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: meeting.title,
          participants: filtered
        })
      });
      if (res.ok) {
        setMeeting({ ...meeting, participants: filtered });
      }
    } catch (err) {
      console.error('Failed to remove participant', err);
    }
  };

  const addParticipant = async () => {
    if (!meeting || !newParticipant.trim()) return;
    const updated = [...meeting.participants, newParticipant.trim()];
    try {
      const res = await fetch(`${API_BASE}/api/meetings/${meetingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: meeting.title,
          participants: updated
        })
      });
      if (res.ok) {
        setMeeting({ ...meeting, participants: updated });
        setNewParticipant('');
        setIsAddingParticipant(false);
      }
    } catch (err) {
      console.error('Failed to add participant', err);
    }
  };

  // Action Items CRUD
  const handleToggleActionItem = async (item: ActionItem) => {
    if (!meeting) return;
    try {
      const res = await fetch(`${API_BASE}/api/meetings/${meetingId}/action-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !item.completed })
      });
      if (res.ok) {
        const updatedItems = meeting.actionItems.map(ai => 
          ai.id === item.id ? { ...ai, completed: !ai.completed } : ai
        );
        setMeeting({ ...meeting, actionItems: updatedItems });
      }
    } catch (err) {
      console.error('Failed to toggle action item', err);
    }
  };

  const handleAddActionItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting || !newActionText.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/meetings/${meetingId}/action-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: newActionText, 
          assignee: newActionAssignee 
        })
      });
      if (res.ok) {
        const newItem = await res.json();
        setMeeting({
          ...meeting,
          actionItems: [...meeting.actionItems, newItem]
        });
        setNewActionText('');
        setNewActionAssignee('');
      }
    } catch (err) {
      console.error('Failed to add action item', err);
    }
  };

  const handleDeleteActionItem = async (itemId: number) => {
    if (!meeting) return;
    try {
      const res = await fetch(`${API_BASE}/api/meetings/${meetingId}/action-items/${itemId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const updated = meeting.actionItems.filter(ai => ai.id !== itemId);
        setMeeting({ ...meeting, actionItems: updated });
      }
    } catch (err) {
      console.error('Failed to delete action item', err);
    }
  };

  // Helper formatting for timestamps e.g. "01:23"
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Speaker label styling indexer
  const getSpeakerStyle = (speaker: string) => {
    const hash = speaker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'border-l-4 border-blue-500 bg-blue-500/5 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400',
      'border-l-4 border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      'border-l-4 border-violet-500 bg-violet-500/5 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400',
      'border-l-4 border-amber-500 bg-amber-500/5 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400',
      'border-l-4 border-pink-500 bg-pink-500/5 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400',
    ];
    return colors[hash % colors.length];
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-violet-600/30 border-t-violet-600 animate-spin" />
          <Sparkles className="w-5 h-5 text-violet-500 absolute animate-pulse" />
        </div>
        <p className={`text-sm mt-4 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Retrieving meeting detail & transcripts...
        </p>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="p-4 rounded-full bg-rose-500/10 text-rose-500 mb-4">
          <X className="w-8 h-8" />
        </div>
        <h3 className="font-display font-semibold text-lg">Failed to Load Meeting</h3>
        <p className="text-sm text-slate-500 max-w-sm text-center mt-1 mb-5">{error || 'Could not find meeting'}</p>
        <button
          onClick={onBack}
          className="py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      {/* Hidden HTML5 Audio Element for media player syncing */}
      <audio
        ref={audioRef}
        src={meeting.audio_url || "https://actions.google.com/sounds/v1/ambient/morning_birds.ogg"}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
      />

      {/* Top Breadcrumb Navigation Header */}
      <header className={`px-6 py-4 border-b flex flex-col gap-3 transition-all ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between gap-4">
          {/* Back Button & Title Edit */}
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            <button
              onClick={onBack}
              className={`p-2 rounded-xl border hover:scale-95 transition-all ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700 hover:text-slate-100' 
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="min-w-0 flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 max-w-xl">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
                    className={`text-xl font-display font-bold py-1 px-2.5 rounded-lg border outline-none w-full ${
                      darkMode 
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-violet-600' 
                        : 'bg-white border-slate-200 text-slate-950 focus:border-violet-500'
                    }`}
                    autoFocus
                  />
                  <button
                    onClick={saveTitle}
                    className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-all"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditedTitle(meeting.title);
                      setIsEditingTitle(false);
                    }}
                    className={`p-1.5 rounded-lg border transition-all ${
                      darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 group">
                  <h2 className="text-xl font-display font-bold truncate leading-none">
                    {meeting.title}
                  </h2>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-slate-500/10 transition-all text-slate-400 hover:text-violet-500"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Date and Duration Info */}
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDate(meeting.date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDuration(meeting.duration)}</span>
            </div>
          </div>
        </div>

        {/* Participants Management Section */}
        {/* <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-400">
          <div className="flex items-center gap-1 mr-1">
            <Users className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-400">Speakers:</span>
          </div>
          
          {meeting.participants.map(name => (
            <div 
              key={name}
              className={`flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full border transition-all ${
                darkMode 
                  ? 'bg-slate-850 border-slate-800 text-slate-300' 
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <span>{name}</span>
              <button
                onClick={() => removeParticipant(name)}
                title={`Remove ${name}`}
                className="hover:bg-rose-500/15 hover:text-rose-500 p-0.5 rounded-full transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}

          {isAddingParticipant ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="Speaker Name"
                value={newParticipant}
                onChange={(e) => setNewParticipant(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addParticipant()}
                className={`py-0.5 px-2 rounded border text-xs outline-none ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                }`}
                autoFocus
              />
              <button
                onClick={addParticipant}
                className="p-1 rounded bg-violet-600 text-white"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsAddingParticipant(false)}
                className="p-1 rounded border"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingParticipant(true)}
              className="flex items-center gap-1 py-1 px-2.5 rounded-full border border-dashed border-slate-500 hover:border-violet-500 hover:text-violet-500 transition-colors"
            >
              <UserPlus className="w-3 h-3" />
              <span>Add Speaker</span>
            </button>
          )}
        </div> */}
      </header>

      {/* Main Double Column Layout */}
      <div className="flex-1 flex overflow-hidden pt-2">
        {/* LEFT COLUMN: Summary Panels & Action items (Tabs) */}
        <div className={`w-1/2 flex flex-col border-r overflow-hidden ${
          darkMode ? 'border-slate-800' : 'border-slate-200'
        }`}>
          {/* Tab buttons */}
          <div className={`flex border-b text-sm font-semibold transition-all ${
            darkMode ? 'bg-slate-900/55 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveLeftTab('summary')}
              className={`flex-1 py-3 px-4 border-b-2 text-center transition-all flex items-center justify-center gap-2 ${
                activeLeftTab === 'summary'
                  ? 'border-violet-600 text-violet-500'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>AI Summaries & Chapters</span>
            </button>
            <button
              onClick={() => setActiveLeftTab('actionItems')}
              className={`flex-1 py-3 px-4 border-b-2 text-center transition-all flex items-center justify-center gap-2 ${
                activeLeftTab === 'actionItems'
                  ? 'border-violet-600 text-violet-500'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Checklist Deliverables</span>
              {meeting.actionItems.length > 0 && (
                <span className="text-[10px] bg-violet-600 text-white rounded-full px-1.5 py-0.5 leading-none">
                  {meeting.actionItems.filter(a => !a.completed).length}
                </span>
              )}
            </button>
          </div>

          {/* Left Column Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeLeftTab === 'summary' ? (
              /* Summaries panel */
              <div className="flex flex-col gap-6">
                {/* Concise Summary paragraph */}
                <div>
                  <h3 className="font-display font-bold text-base flex items-center gap-2 text-violet-500 mb-2.5">
                    <Sparkles className="w-4.5 h-4.5" />
                    <span>Concise Executive Summary</span>
                  </h3>
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {meeting.summary.concise}
                  </p>
                </div>

                {/* Key Discussion Topics */}
                {meeting.summary.keyTopics && meeting.summary.keyTopics.length > 0 && (
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-400 mb-2.5">
                      Key Discussion Topics
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {meeting.summary.keyTopics.map(topic => (
                        <span
                          key={topic}
                          className={`text-xs font-medium py-1.5 px-3 rounded-xl border ${
                            darkMode 
                              ? 'bg-slate-900 border-slate-800 text-slate-300' 
                              : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                          }`}
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chapters/Outline List with Click-to-Seek */}
                {meeting.summary.chapters && meeting.summary.chapters.length > 0 && (
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-400 mb-3">
                      Chapters & Timelines
                    </h3>
                    <div className="flex flex-col gap-3">
                      {meeting.summary.chapters.map((chapter: Chapter) => {
                        const isChapterActive = currentTime >= chapter.startTime && currentTime <= chapter.endTime;
                        return (
                          <div
                            key={chapter.title}
                            onClick={() => seekTo(chapter.startTime)}
                            className={`p-4 rounded-xl border cursor-pointer hover:border-violet-500/50 transition-all ${
                              isChapterActive
                                ? darkMode
                                  ? 'bg-violet-950/20 border-violet-500/60'
                                  : 'bg-violet-50 border-violet-300 shadow-sm'
                                : darkMode
                                  ? 'bg-slate-900/40 border-slate-850'
                                  : 'bg-slate-50/50 border-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={`font-display font-bold text-sm ${
                                isChapterActive ? 'text-violet-500' : ''
                              }`}>
                                {chapter.title}
                              </span>
                              <span className="text-[10px] font-mono font-bold bg-slate-500/10 text-slate-400 py-0.5 px-2 rounded">
                                {formatTime(chapter.startTime)} - {formatTime(chapter.endTime)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              {chapter.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Checklist / Action Items Panel */
              <div className="flex flex-col h-full justify-between">
                <div>
                  <h3 className="font-display font-bold text-base text-slate-400 mb-4">
                    Assigned Action Items Checklist
                  </h3>

                  {meeting.actionItems.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-slate-500">No action items found or assigned.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {meeting.actionItems.map((item: ActionItem) => (
                        <div
                          key={item.id}
                          className={`flex items-start justify-between gap-3 p-3.5 rounded-xl border transition-all ${
                            item.completed
                              ? darkMode
                                ? 'bg-slate-950/30 border-slate-900 opacity-60'
                                : 'bg-slate-50 border-slate-200 opacity-60 line-through'
                              : darkMode
                                ? 'bg-slate-900/50 border-slate-800'
                                : 'bg-white border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            {/* Complete checkbox */}
                            <button
                              onClick={() => handleToggleActionItem(item)}
                              className={`mt-0.5 p-0.5 rounded-md border flex items-center justify-center transition-all ${
                                item.completed
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : darkMode
                                    ? 'border-slate-700 hover:border-slate-500'
                                    : 'border-slate-300 hover:border-slate-400'
                              }`}
                            >
                              <Check className={`w-3.5 h-3.5 ${item.completed ? 'opacity-100' : 'opacity-0'}`} />
                            </button>

                            <div className="min-w-0 flex-1">
                              <p className={`text-sm leading-snug ${
                                item.completed ? 'text-slate-500' : darkMode ? 'text-slate-200' : 'text-slate-800'
                              }`}>
                                {item.text}
                              </p>
                              {item.assignee && (
                                <span className={`text-[10px] font-mono font-bold mt-1.5 inline-block uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  @{item.assignee}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete Action Button */}
                          <button
                            onClick={() => handleDeleteActionItem(item.id)}
                            title="Delete task"
                            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-500/10 transition-all flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form to append new action items */}
                <form 
                  onSubmit={handleAddActionItem} 
                  className={`mt-6 pt-5 border-t flex flex-col gap-3 ${
                    darkMode ? 'border-slate-800' : 'border-slate-100'
                  }`}
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Assign New Action Item
                  </h4>
                  
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Type the deliverables details..."
                      value={newActionText}
                      onChange={(e) => setNewActionText(e.target.value)}
                      className={`py-2 px-3.5 rounded-xl border text-sm outline-none transition-all ${
                        darkMode 
                          ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-violet-600' 
                          : 'bg-white border-slate-200 text-slate-800 focus:border-violet-500'
                      }`}
                    />
                    
                    <div className="flex gap-2">
                      <select
                        value={newActionAssignee}
                        onChange={(e) => setNewActionAssignee(e.target.value)}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs outline-none transition-all ${
                          darkMode 
                            ? 'bg-slate-950 border-slate-800 text-slate-200' 
                            : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <option value="">Unassigned</option>
                        {meeting.participants.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        disabled={!newActionText.trim()}
                        className="py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Transcript */}
        <div className="w-1/2 flex flex-col h-full overflow-hidden">
          {/* Transcript Search */}
          <div className={`p-4 border-b flex items-center justify-between transition-all ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transcript matches..."
                value={transcriptSearch}
                onChange={(e) => setTranscriptSearch(e.target.value)}
                className={`w-full py-1.5 pl-9 pr-3 rounded-xl border text-xs outline-none transition-all ${
                  darkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-violet-600' 
                    : 'bg-white border-slate-200 text-slate-800 focus:border-violet-500'
                }`}
              />
              {transcriptSearch && (
                <button
                  onClick={() => setTranscriptSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-500/10 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Transcript dialogues blocks container */}
          <div 
            ref={transcriptContainerRef}
            className="flex-1 overflow-y-auto p-6 flex flex-col gap-4"
          >
            {meeting.transcript
              .filter((segment: TranscriptSegment) => 
                segment.text.toLowerCase().includes(transcriptSearch.toLowerCase()) || 
                segment.speaker.toLowerCase().includes(transcriptSearch.toLowerCase())
              )
              .map((segment: TranscriptSegment) => {
                const isSegmentActive = currentTime >= segment.startTime && currentTime <= segment.endTime;
                
                // Text search highlighting logic
                const highlightText = (text: string, search: string) => {
                  if (!search) return text;
                  const parts = text.split(new RegExp(`(${search})`, 'gi'));
                  return (
                    <span>
                      {parts.map((part, i) => 
                        part.toLowerCase() === search.toLowerCase() ? (
                          <mark key={i} className="bg-amber-300 dark:bg-amber-500 dark:text-slate-950 font-semibold px-0.5 rounded">
                            {part}
                          </mark>
                        ) : (
                          part
                        )
                      )}
                    </span>
                  );
                };

                return (
                  <div
                    key={segment.id || segment.startTime}
                    ref={isSegmentActive ? activeSegmentRef : null}
                    onClick={() => seekTo(segment.startTime)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      isSegmentActive
                        ? darkMode
                          ? 'bg-violet-950/20 border-violet-500/60 shadow-[0_0_12px_rgba(124,58,237,0.15)] scale-[1.01]'
                          : 'bg-violet-50 border-violet-300 shadow-sm scale-[1.01]'
                        : darkMode
                          ? 'bg-slate-900/20 border-transparent hover:bg-slate-900/50 hover:border-slate-800'
                          : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-150'
                    }`}
                  >
                    {/* Speaker and Timestamp line */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold font-display px-2 py-0.5 rounded-md ${getSpeakerStyle(segment.speaker)}`}>
                          {segment.speaker}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-500/5 py-0.5 px-2 rounded">
                        {formatTime(segment.startTime)}
                      </span>
                    </div>

                    {/* Dialogue Paragraph text */}
                    <p className={`text-sm leading-relaxed transition-all ${
                      isSegmentActive 
                        ? darkMode 
                          ? 'text-slate-100 font-medium' 
                          : 'text-slate-950 font-medium' 
                        : darkMode 
                          ? 'text-slate-300' 
                          : 'text-slate-600'
                    }`}>
                      {highlightText(segment.text, transcriptSearch)}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* BOTTOM STICKY SAAS MEDIA PLAYER BAR */}
      <footer className={`px-6 py-4 border-t flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-lg'
      }`}>
        {/* Play/Pause Button, Titles, Waves */}
        <div className="flex items-center gap-4 w-full md:w-1/3">
          <button
            onClick={togglePlay}
            className="w-11 h-11 rounded-full bg-violet-600 hover:bg-violet-700 active:scale-90 text-white flex items-center justify-center transition-all shadow-md shadow-violet-600/25 flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>
          
          <div className="min-w-0">
            <span className="text-xs font-bold block truncate leading-tight group-hover:text-violet-500">
              {meeting.title}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-slate-400">
                Playing at {playbackSpeed}x
              </span>
              
              {/* Dynamic Audio Waves Animation */}
              {isPlaying && (
                <div className="flex items-end gap-0.5 h-3.5 mb-1.5 ml-1">
                  <div className="w-0.5 bg-violet-500 animate-[bounce_0.6s_infinite_0s] h-1" />
                  <div className="w-0.5 bg-violet-500 animate-[bounce_0.6s_infinite_0.1s] h-3" />
                  <div className="w-0.5 bg-violet-500 animate-[bounce_0.6s_infinite_0.3s] h-2" />
                  <div className="w-0.5 bg-violet-500 animate-[bounce_0.6s_infinite_0.2s] h-4" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seek timeline controls */}
        <div className="flex items-center gap-3 w-full md:w-1/2">
          <span className="text-2xs font-mono font-bold text-slate-400 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          
          <input
            type="range"
            min={0}
            max={meeting.duration}
            step={0.1}
            value={currentTime}
            onChange={handleSeekBarChange}
            className="flex-1 accent-violet-600 h-1.5 rounded-lg bg-slate-300 dark:bg-slate-700 cursor-pointer outline-none"
          />

          <span className="text-2xs font-mono font-bold text-slate-400 w-10">
            {formatTime(meeting.duration)}
          </span>
        </div>

        {/* Playback speed selector */}
        <div className="flex items-center justify-end gap-3 w-full md:w-1/6">
          <div className="flex items-center gap-1.5">
            {[1, 1.25, 1.5, 2].map(speed => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-all ${
                  playbackSpeed === speed
                    ? 'bg-violet-600 text-white'
                    : darkMode
                      ? 'bg-slate-800 text-slate-400 hover:text-slate-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
