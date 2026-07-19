"use client";

import React, { useState } from 'react';
import { 
  Search, 
  Clock, 
  Users, 
  Calendar, 
  CheckSquare, 
  Trash2, 
  ArrowUpDown, 
  FileText, 
  Plus, 
  Briefcase, 
  UserPlus,
  Play
} from 'lucide-react';
import { Meeting } from '../types';

interface DashboardProps {
  meetings: any[];
  onSelectMeeting: (id: number) => void;
  onDeleteMeeting: (id: number) => void;
  onOpenUpload: () => void;
  darkMode: boolean;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, '0')}s`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function Dashboard({ 
  meetings, 
  onSelectMeeting, 
  onDeleteMeeting, 
  onOpenUpload,
  darkMode 
}: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'duration'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [participantFilter, setParticipantFilter] = useState('');

  // 1. Calculate SaaS statistics
  const totalMeetings = meetings.length;
  const totalTasks = meetings.reduce((acc, m) => acc + (m.actionItemsCount?.total || 0), 0);
  const completedTasks = meetings.reduce((acc, m) => acc + (m.actionItemsCount?.completed || 0), 0);
  const pendingTasks = totalTasks - completedTasks;
  const allParticipants = Array.from(new Set(meetings.flatMap(m => m.participants || [])));

  // 2. Filter & Sort meetings
  const filteredMeetings = meetings
    .filter(m => {
      const matchSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.participants && m.participants.some((p: string) => p.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchParticipant = participantFilter === '' || 
                                (m.participants && m.participants.includes(participantFilter));
      return matchSearch && matchParticipant;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'duration') {
        comparison = a.duration - b.duration;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const toggleSort = (field: 'date' | 'title' | 'duration') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Avatar generator color palette
  const avatarColors = [
    'bg-blue-500 text-blue-100',
    'bg-emerald-500 text-emerald-100',
    'bg-violet-500 text-violet-100',
    'bg-pink-500 text-pink-100',
    'bg-amber-500 text-amber-100',
    'bg-cyan-500 text-cyan-100'
  ];

  const getAvatarStyle = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % avatarColors.length;
    return avatarColors[index];
  };

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      {/* Upper Dashboard Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-3xl tracking-tight">
            My Meetings
          </h1>
          <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Explore automated transcripts, smart AI summaries, and action deliverables.
          </p>
        </div>
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-all shadow-lg shadow-violet-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Meeting</span>
        </button>
      </div>

      {/* adjustable spacing */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8"></div>

      {/* Search, Filter & Sort Controls */}
      <div className={`p-4 rounded-2xl border mb-6 flex flex-col md:flex-row gap-4 items-center justify-between transition-all ${
        darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search meetings by title or speakers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full py-2 pl-10 pr-4 rounded-xl border text-sm outline-none transition-all ${
              darkMode 
                ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-violet-600' 
                : 'bg-white border-slate-200 text-slate-800 focus:border-violet-500'
            }`}
          />
        </div>

        {/* Filter & Sort controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Participant Filter dropdown */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <select
              value={participantFilter}
              onChange={(e) => setParticipantFilter(e.target.value)}
              className={`w-full md:w-44 py-2 px-3 rounded-xl border text-xs outline-none transition-all ${
                darkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-200' 
                  : 'bg-white border-slate-200 text-slate-700'
              }`}
            >
              <option value="">All Speakers</option>
              {allParticipants.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Quick Sort Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => toggleSort('date')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                sortBy === 'date'
                  ? 'bg-violet-600 text-white border-violet-600'
                  : darkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-100' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Date</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>

            <button
              onClick={() => toggleSort('title')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                sortBy === 'title'
                  ? 'bg-violet-600 text-white border-violet-600'
                  : darkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-100' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>A-Z</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>

            <button
              onClick={() => toggleSort('duration')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                sortBy === 'duration'
                  ? 'bg-violet-600 text-white border-violet-600'
                  : darkMode 
                    ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-100' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>Length</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Meeting Library Table/Grid */}
      {filteredMeetings.length === 0 ? (
        /* Empty State */
        <div className={`p-12 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
          darkMode ? 'bg-slate-900/25 border-slate-800' : 'bg-slate-50/50 border-slate-200'
        }`}>
          <div className="p-4 rounded-full bg-violet-500/10 text-violet-500 mb-4">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="font-display font-semibold text-lg">No Meetings Found</h3>
          <p className={`text-sm max-w-sm mt-1 mb-5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {meetings.length === 0 
              ? "Your library is completely empty. Create a meeting by pasting or uploading a session transcript!"
              : "We couldn't find any meetings matching your search query. Try typing another term or adjusting filters."}
          </p>
          {meetings.length === 0 && (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Meeting</span>
            </button>
          )}
        </div>
      ) : (
        /* Meetings Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              onClick={() => onSelectMeeting(meeting.id)}
              className={`group relative p-5 rounded-2xl border cursor-pointer hover:scale-[1.01] transition-all flex flex-col justify-between ${
                darkMode 
                  ? 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/70 hover:border-violet-500/50' 
                  : 'bg-white border-slate-200 shadow-sm hover:shadow hover:border-violet-500/50'
              }`}
            >
              {/* Header Info */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <span className={`text-[10px] font-mono tracking-widest uppercase font-bold py-1 px-2 rounded ${
                    darkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    Interactive Session
                  </span>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteMeeting(meeting.id);
                    }}
                    title="Delete meeting"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-display font-bold text-lg leading-snug group-hover:text-violet-500 transition-colors">
                  {meeting.title}
                </h3>

                <div className="flex flex-wrap items-center gap-3.5 mt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDate(meeting.date)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{formatDuration(meeting.duration)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Avatars & Completeness */}
              <div className={`mt-5 pt-4 border-t flex items-center justify-between gap-4 ${
                darkMode ? 'border-slate-800/80' : 'border-slate-100'
              }`}>
                {/* Avatars */}
                <div className="flex -space-x-2 overflow-hidden">
                  {meeting.participants && meeting.participants.slice(0, 4).map((name: string) => {
                    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
                    return (
                      <div
                        key={name}
                        title={name}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-slate-950 ${getAvatarStyle(name)}`}
                      >
                        {initials}
                      </div>
                    );
                  })}
                  {meeting.participants && meeting.participants.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-100 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[9px] font-bold">
                      +{meeting.participants.length - 4}
                    </div>
                  )}
                </div>

                {/* Progress Deliverable Pill */}
                {meeting.actionItemsCount && meeting.actionItemsCount.total > 0 ? (
                  <div className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full text-[10px] font-semibold ${
                    meeting.actionItemsCount.completed === meeting.actionItemsCount.total
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-violet-500/10 text-violet-500'
                  }`}>
                    <CheckSquare className="w-3 h-3" />
                    <span>
                      {meeting.actionItemsCount.completed}/{meeting.actionItemsCount.total} action items
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">No action items</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
