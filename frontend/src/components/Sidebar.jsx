import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  Trophy,
  AlertTriangle,
  Package,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

export const Sidebar = ({ activeTab, onSelectTab, setActiveTab }) => {
  const handleSelect = onSelectTab || setActiveTab;
  const menuItems = [
    {
      id: 'overview',
      label: 'Executive Overview',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      id: 'forecasts',
      label: 'Forecast Explorer',
      icon: LineChart,
      badge: '90% CI',
    },
    {
      id: 'leaderboard',
      label: 'Model Tournament',
      icon: Trophy,
      badge: 'Champion',
      highlight: true,
    },
    {
      id: 'inventory',
      label: 'Inventory Alerts',
      icon: AlertTriangle,
      badge: '3 Critical',
      alert: true,
    },
    {
      id: 'skus',
      label: 'SKU Catalog',
      icon: Package,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-slate-100 flex items-center gap-1.5">
              ForecastAI
              <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[10px] rounded font-mono">v2.0</span>
            </h1>
            <p className="text-[11px] text-slate-400">Demand Intelligence Engine</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5">
          <p className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-500">Modules</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      item.alert
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : item.highlight
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Spec Info */}
      <div className="p-4 m-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>Inference Engine</span>
          <span className="text-emerald-400 font-mono">14-Day Forward</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Dataset Depth</span>
          <span className="text-slate-200 font-mono">54,544 rows</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Features Computed</span>
          <span className="text-slate-200 font-mono">18 Lags & Cyclic</span>
        </div>
      </div>
    </aside>
  );
};
