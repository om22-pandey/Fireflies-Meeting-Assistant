"use client";

import React from 'react';
import { 
  Video, 
  Upload, 
  MessageSquareCode, 
  Settings, 
  Moon, 
  Sun, 
  Sparkles, 
  HelpCircle,
  BarChart2,
  Share2
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onOpenUpload: () => void;
}

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  darkMode, 
  setDarkMode,
  onOpenUpload
}: SidebarProps) {
  const menuItems = [
    { id: 'meetings', label: 'Meeting Library', icon: Video },
    { id: 'assistant', label: 'Ask Fred (AI Chat)', icon: MessageSquareCode },
    { id: 'analytics', label: 'Analytics', icon: BarChart2, comingSoon: true },
    { id: 'integrations', label: 'Integrations', icon: Share2, comingSoon: true },
    { id: 'settings', label: 'Settings', icon: Settings, comingSoon: true },
  ];

  return (
    <aside 
      className={`w-64 flex-shrink-0 flex flex-col justify-between border-r transition-all duration-300 ${
        darkMode 
          ? 'bg-slate-900 border-slate-800 text-slate-100' 
          : 'bg-white border-slate-200 text-slate-700'
      }`}
    >
      {/* Upper Content */}
      <div className="p-5 flex flex-col gap-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="font-display font-bold text-lg leading-none tracking-tight block">
              fireflies<span className="text-violet-500">.ai</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-semibold block">
              Meeting Assistant
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex flex-col gap-1 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                disabled={item.comingSoon}
                onClick={() => setActiveTab(item.id)}
                className={`relative group w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-sm font-medium transition-all ${
                  item.comingSoon 
                    ? 'opacity-50 cursor-not-allowed' 
                    : isActive
                      ? darkMode
                        ? 'bg-violet-950/40 text-violet-400'
                        : 'bg-violet-50 text-violet-700'
                      : darkMode
                        ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-100'
                        : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-violet-500' : 'text-slate-400 group-hover:text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.comingSoon && (
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    darkMode 
                      ? 'bg-slate-800 text-slate-400' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Content */}
      <div className={`p-4 border-t flex flex-col gap-3 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        {/* User Card */}
        <div className="flex items-center gap-3 p-2 rounded-xl">
          <div className="relative">
            {/* Real Profile Photo Block */}
            <img 
              src="https://media.licdn.com/dms/image/v2/D5603AQHcpZmtROvqmQ/profile-displayphoto-crop_800_800/B56Z9HZjBTGQAI-/0/1783609308773?e=1785974400&v=beta&t=Bhx1P11TaQx7VHOk3_aSb_DNFeVDPHhcKf2WOl10bUM" // 👈 Agar public folder me photo daal di hai. Nahi toh yahan LinkedIn se copy kiya hua link paste kar do
              alt="Om Pandey Profile" 
              className="w-9 h-9 rounded-full object-cover ring-2 ring-violet-500/30"
              onError={(e) => {
                // Fallback: Agar kisi wajah se photo load na ho, toh broken icon na dikhe, ek clean standard avatar aa jaye
                e.currentTarget.src = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=256";
              }}
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            {/* 👈 Apna naam yahan badal lijiye */}
            <span className="text-xs font-semibold block truncate text-slate-200 dark:text-slate-100">
              Om Pandey
            </span>
            {/* 👈 Apna Subtitle/Role yahan badal lijiye */}
            <span className="text-[9px] font-mono text-violet-400 uppercase tracking-wider block truncate">
              Lead Developer
            </span>
          </div>
        </div>

        {/* Theme and Help Actions */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {darkMode ? (
              <>
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </>
            )}
          </button>
          
          <button
            title="Help Support"
            className={`p-2 rounded-xl border transition-all ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-100' 
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}