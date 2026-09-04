import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Bell,
  Sparkles,
  User,
  LogOut,
  LogIn,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu
} from 'lucide-react';

export const Navbar = ({ onOpenLogin, onOpenRetrain }) => {
  const { user, logout, isDemoMode } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Champion Model Status Pill */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 animate-spin text-emerald-400" style={{ animationDuration: '6s' }} />
          <span>Active Champion: <strong>HistGBDT v1.8</strong> (WAPE 12.19%)</span>
        </div>

        {/* Backend Connectivity Status */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${
          isDemoMode
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
          <span>{isDemoMode ? 'Demo / Local Mode' : 'Connected to Django API'}</span>
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-3">
        {/* Retrain Quick Trigger Button */}
        <button
          onClick={onOpenRetrain}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-lg shadow-emerald-600/20"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Trigger ML Retrain</span>
        </button>

        {/* User Role Badge & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-lg hover:bg-slate-800 border border-slate-700/60 transition text-left"
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold text-xs">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block text-xs">
              <p className="font-semibold text-slate-200">{user?.username || 'Guest'}</p>
              <p className="text-[10px] text-slate-400 capitalize">{user?.role || 'Viewer'}</p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-2 border-b border-slate-700/60">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-semibold text-slate-100">{user?.username}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-medium uppercase">
                  Role: {user?.role}
                </span>
              </div>

              <div className="px-2 py-1">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onOpenLogin();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700/50 rounded-lg transition"
                >
                  <LogIn className="w-4 h-4 text-slate-400" />
                  <span>Switch / Sign In</span>
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Reset / Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
