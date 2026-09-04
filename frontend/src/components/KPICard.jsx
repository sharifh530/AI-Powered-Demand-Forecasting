import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const KPICard = ({
  title,
  value,
  subtitle,
  change,
  changeType = 'neutral', // 'positive' | 'negative' | 'neutral'
  icon: Icon,
  badge,
  accentColor = 'emerald'
}) => {
  const getChangeBadge = () => {
    if (!change) return null;
    if (changeType === 'positive') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <TrendingUp className="w-3 h-3" />
          {change}
        </span>
      );
    }
    if (changeType === 'negative') {
      return (
        <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
          <TrendingDown className="w-3 h-3" />
          {change}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
        <Minus className="w-3 h-3" />
        {change}
      </span>
    );
  };

  const getBorderColor = () => {
    switch (accentColor) {
      case 'emerald': return 'hover:border-emerald-500/40';
      case 'amber': return 'hover:border-amber-500/40';
      case 'rose': return 'hover:border-rose-500/40';
      case 'teal': return 'hover:border-teal-500/40';
      case 'indigo': return 'hover:border-indigo-500/40';
      default: return 'hover:border-slate-700';
    }
  };

  return (
    <div className={`p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl transition-all duration-200 ${getBorderColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-300">
            <Icon className="w-4 h-4 text-emerald-400" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-black tracking-tight text-white font-mono">{value}</div>
        {getChangeBadge()}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400 flex items-center gap-1.5">
          {badge && (
            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px] font-semibold">
              {badge}
            </span>
          )}
          <span>{subtitle}</span>
        </p>
      )}
    </div>
  );
};
