import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, LogIn, Cpu } from 'lucide-react';

export const Navbar = ({ onOpenLogin, onOpenRetrain }) => {
  const { user, logout, isDemoMode } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="h-14 border-b border-hairline bg-graphite-900 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Champion Model Status + Connectivity */}
      <div className="flex items-center gap-4 text-xs">
        <div className="hidden sm:flex items-center gap-2 text-paper-muted">
          <span className="w-1.5 h-1.5 bg-signal-amber shrink-0" />
          <span>Active champion: <strong className="text-paper font-medium">HistGBDT v1.8</strong> (WAPE 12.19%)</span>
        </div>

        <div className="flex items-center gap-1.5 pl-4 border-l border-hairline text-paper-muted">
          <span className={`w-1.5 h-1.5 rounded-full ${isDemoMode ? 'bg-status-warning' : 'bg-status-healthy'}`} />
          <span>{isDemoMode ? 'Demo / local mode' : 'Connected to Django API'}</span>
        </div>
      </div>

      {/* Right: Actions & User Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenRetrain}
          className="flex items-center gap-2 px-3 py-1.5 bg-signal-amber hover:bg-signal-amber/90 text-graphite-950 text-xs font-semibold transition"
        >
          <Cpu className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Retrain models</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 py-1 pl-1 pr-2.5 hover:bg-graphite-800 border border-transparent hover:border-hairline transition text-left"
          >
            <div className="w-7 h-7 rounded-full bg-graphite-800 border border-hairline flex items-center justify-center text-signal-amber font-semibold text-xs">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block text-xs">
              <p className="font-medium text-paper">{user?.username || 'Guest'}</p>
              <p className="text-[10px] text-paper-muted capitalize">{user?.role || 'Viewer'}</p>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-1 w-56 bg-graphite-900 border border-hairline shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-hairline">
                <p className="text-xs text-paper-muted">Signed in as</p>
                <p className="text-sm font-medium text-paper">{user?.username}</p>
                <span className="inline-block mt-1 text-[10px] text-signal-amber font-medium capitalize">
                  Role: {user?.role}
                </span>
              </div>

              <div className="px-2 py-1">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    onOpenLogin();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-paper-muted hover:bg-graphite-800 hover:text-paper transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Switch / sign in</span>
                </button>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-status-critical hover:bg-status-critical/10 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Reset / sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
