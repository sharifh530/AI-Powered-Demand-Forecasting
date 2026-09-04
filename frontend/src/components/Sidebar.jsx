import React from 'react';
import {
  LayoutDashboard,
  LineChart,
  Trophy,
  AlertTriangle,
  Package,
  Radio
} from 'lucide-react';

export const Sidebar = ({ activeTab, onSelectTab, setActiveTab }) => {
  const handleSelect = onSelectTab || setActiveTab;
  const menuItems = [
    { id: 'overview', label: 'Executive overview', icon: LayoutDashboard, badge: 'Live' },
    { id: 'forecasts', label: 'Forecast explorer', icon: LineChart, badge: '90% CI' },
    { id: 'leaderboard', label: 'Model tournament', icon: Trophy, badge: 'Champion' },
    { id: 'inventory', label: 'Inventory alerts', icon: AlertTriangle, badge: '3 critical', alert: true },
    { id: 'skus', label: 'SKU catalog', icon: Package },
  ];

  return (
    <aside className="w-60 bg-graphite-900 border-r border-hairline flex flex-col justify-between shrink-0 min-h-[calc(100vh-3.5rem)]">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-hairline flex items-center gap-2.5">
          <Radio className="w-5 h-5 text-signal-amber shrink-0" />
          <div>
            <h1 className="font-display font-bold text-sm tracking-tight text-paper">
              ForecastAI <span className="text-paper-dim font-normal">v2.0</span>
            </h1>
            <p className="text-[11px] text-paper-muted">Demand intelligence engine</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-0.5">
          <p className="px-3 py-2 text-[10px] font-medium tracking-wide text-paper-dim">Modules</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 border-l-[3px] text-xs font-medium transition-colors ${
                  isActive
                    ? 'border-l-signal-amber bg-graphite-800 text-paper'
                    : 'border-l-transparent text-paper-muted hover:text-paper hover:bg-graphite-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-signal-amber' : 'text-paper-dim'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-medium ${
                      item.alert ? 'text-status-critical' : 'text-paper-dim'
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
      <div className="p-4 m-3 border border-hairline text-[11px] text-paper-muted space-y-1.5">
        <div className="flex items-center justify-between text-paper font-medium">
          <span>Inference engine</span>
          <span className="text-signal-amber font-mono text-[10px]">14-day forward</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Dataset depth</span>
          <span className="text-paper font-mono text-[10px]">54,544 rows</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Features computed</span>
          <span className="text-paper font-mono text-[10px]">18 lags &amp; cyclic</span>
        </div>
      </div>
    </aside>
  );
};
