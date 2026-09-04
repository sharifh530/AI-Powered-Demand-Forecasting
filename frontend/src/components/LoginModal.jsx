import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, User, ShieldAlert } from 'lucide-react';

export const LoginModal = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('planner');
  const [password, setPassword] = useState('PlannerPass123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(username, password);
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Invalid credentials.');
      }
    } catch (err) {
      setError('An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/80">
      <div className="w-full max-w-md bg-graphite-900 border border-hairline shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-paper-muted hover:text-paper transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-hairline">
          <Lock className="w-5 h-5 text-signal-amber shrink-0" />
          <div>
            <h2 className="text-lg font-display font-bold text-paper">Sign in to ForecastAI</h2>
            <p className="text-xs text-paper-muted">JWT authentication &amp; role-based access</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 border-l-[3px] border-l-status-critical bg-status-critical/10 text-status-critical text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-paper-muted mb-1.5">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-paper-dim absolute left-3 top-2.5" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-graphite-950 border border-hairline text-xs text-paper focus:outline-none focus:border-signal-amber transition font-mono"
                placeholder="e.g. planner or admin"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-paper-muted mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-paper-dim absolute left-3 top-2.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2 bg-graphite-950 border border-hairline text-xs text-paper focus:outline-none focus:border-signal-amber transition font-mono"
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="pt-1">
            <p className="text-[11px] text-paper-muted mb-2">Quick test accounts</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreset('planner', 'PlannerPass123!')}
                className="p-2 bg-graphite-850 hover:bg-graphite-800 border border-hairline text-left transition"
              >
                <div className="text-[11px] font-medium text-paper">Demand planner</div>
                <div className="text-[10px] text-paper-muted font-mono">planner / PlannerPass123!</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset('admin', 'AdminPass123!')}
                className="p-2 bg-graphite-850 hover:bg-graphite-800 border border-hairline text-left transition"
              >
                <div className="text-[11px] font-medium text-paper">System admin</div>
                <div className="text-[10px] text-paper-muted font-mono">admin / AdminPass123!</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-signal-amber hover:bg-signal-amber/90 text-graphite-950 font-semibold text-xs transition flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-graphite-950/30 border-t-graphite-950 rounded-full animate-spin"></span>
                Authenticating...
              </span>
            ) : (
              <span>Sign in with JWT</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
