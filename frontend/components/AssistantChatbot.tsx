"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  X, 
  Minimize2, 
  Maximize2,
  HelpCircle,
  MessageSquare,
  Bot
} from 'lucide-react';
import { ChatMessage } from '../types';

// Mock meeting interface dropdown lists mapping ke liye
interface MeetingListItem {
  id: number;
  title: string;
}

interface AssistantChatbotProps {
  meetingId?: number | null;
  meetingTitle?: string;
  meetings?: MeetingListItem[]; // Dropdown load krne ke liye new safe array prop
  darkMode: boolean;
}

export default function AssistantChatbot({ meetingId, meetingTitle, meetings = [], darkMode }: AssistantChatbotProps) {
  // Safe internal dropdown control state (Default shifts between active page ID or 0 for global)
  const [currentContextId, setCurrentContextId] = useState<number>(meetingId || 0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Sync internal context selector state if parent meetingId changes reactively
  useEffect(() => {
    setCurrentContextId(meetingId || 0);
  }, [meetingId]);

  // Suggested prompt pills depending on whether there's an active selector context
  const suggestions = currentContextId > 0
    ? [
        "What are the action items?",
        "Give me a 3-sentence summary.",
        "Who talked the most?",
        "What are the next deadlines?"
      ]
    : [
        "How do I upload a meeting?",
        "What does Fireflies.ai do?",
        "How does transcript syncing work?"
      ];

  // Initialize welcoming chat messages safely depending on current dropdown context active
  useEffect(() => {
    let welcomeText = "Hello! I'm Fred, your Fireflies.ai meeting assistant. How can I help you today?";
    
    if (currentContextId > 0) {
      // Find title locally from meetings array or use standard parent fallback string
      const selectedTitle = meetings.find(m => m.id === currentContextId)?.title || meetingTitle || 'Active Meeting';
      welcomeText = `Hi there! I'm ready to answer questions about our meeting: **"${selectedTitle}"**. Ask me for action items, summaries, or specific details!`;
    }
    
    setMessages([
      {
        id: 'welcome',
        sender: 'assistant',
        text: welcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [currentContextId, meetingTitle, meetings]);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: textToSend, 
          meetingId: currentContextId === 0 ? null : currentContextId // 0 active standard handles global search (null)[cite: 1]
        })
      });

      if (!response.ok) throw new Error();
      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: "I ran into a connection glitch while processing your response. Please verify that the Express server and API services are running.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  return (
    <div className={`w-full flex flex-col justify-between overflow-hidden h-full transition-all duration-300 ${
      darkMode 
        ? 'bg-slate-900 border-slate-800 text-slate-100' 
        : 'bg-white border-slate-200 text-slate-900'
    }`}>
      
      {/* Header Area with conditional context control */}
      <div className="p-4 border-b flex flex-col gap-2 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-violet-600/10 text-violet-500">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-xs">Ask Fred (AI)</h3>
            </div>
          </div>
          <div className="p-1 bg-emerald-500/15 text-emerald-500 text-[9px] font-mono font-bold uppercase rounded px-1.5">
            Online
          </div>
        </div>

        {/* Injected Dropdown with conditional toggle check */}
        <div className="flex flex-col gap-1 mt-1">
          <label className="text-[9px] uppercase font-bold text-slate-400">Search Context:</label>
          
          {meetingId && meetingId > 0 ? (
            // Meeting Detail Page Mode: No dropdown arrow, just flat static string capsule lock
            <div className={`w-full text-[11px] py-1.5 px-2 rounded-lg border font-medium truncate ${
              darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600 shadow-sm'
            }`}>
              📄 {meetings.find(m => m.id === meetingId)?.title || meetingTitle || 'Active Meeting'}
            </div>
          ) : (
            // Global Sidebar Workspace Mode: Interactive Dropdown list menu active[cite: 1]
            <select
              value={currentContextId}
              onChange={(e) => setCurrentContextId(Number(e.target.value))}
              className={`w-full text-[11px] py-1 px-1.5 rounded-lg border outline-none cursor-pointer font-medium transition-all ${
                darkMode 
                  ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-violet-600' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-violet-500 shadow-sm'
              }`}
            >
              <option value={0}>🌐 All Meetings (Global Search)</option>
              {meetings.map((m) => (
                <option key={m.id} value={m.id}>
                  📄 {m.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${
              msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            {/* Sender and Time */}
            <span className="text-[9px] font-mono text-slate-400 mb-1">
              {msg.sender === 'user' ? 'You' : 'Fred'} • {msg.timestamp}
            </span>
            
            {/* Bubble */}
            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-violet-600 text-white rounded-tr-none shadow-md shadow-violet-600/10'
                : darkMode
                  ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                  : 'bg-slate-100 text-slate-800 rounded-tl-none'
            }`}>
              <p className="whitespace-pre-line">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="self-start flex flex-col items-start max-w-[85%] animate-pulse">
            <span className="text-[9px] font-mono text-slate-400 mb-1">Fred is typing...</span>
            <div className={`p-3 rounded-2xl text-xs rounded-tl-none flex items-center gap-1 ${
              darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100'
            }`}>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-[bounce_1s_infinite_0ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-[bounce_1s_infinite_200ms]" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-[bounce_1s_infinite_400ms]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggestion Pills */}
      {suggestions.length > 0 && (
        <div className={`p-3 border-t flex flex-col gap-1.5 transition-all ${
          darkMode ? 'border-slate-850 bg-slate-950/25' : 'border-slate-100 bg-slate-50/40'
        }`}>
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Suggested Prompts
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className={`text-[10px] font-medium py-1 px-2.5 rounded-lg border text-left truncate max-w-full transition-all active:scale-95 ${
                  darkMode 
                    ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input box */}
      <form onSubmit={handleSubmit} className={`p-3.5 border-t dark:border-slate-800`}>
        <div className="relative">
          <input
            type="text"
            placeholder={currentContextId === 0 ? "Ask Fred about any marketing or meeting data..." : "Ask Fred about this active layout..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className={`w-full py-2.5 pl-3.5 pr-10 rounded-xl border text-xs outline-none transition-all ${
              darkMode 
                ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-violet-600' 
                : 'bg-white border-slate-200 text-slate-800 focus:border-violet-500'
            }`}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-violet-600 disabled:opacity-40 text-white transition-all hover:bg-violet-700"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}