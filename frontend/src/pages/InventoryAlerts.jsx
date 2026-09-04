import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  Package,
  ShoppingCart,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  Truck,
  MapPin
} from 'lucide-react';
import APIService from '../services/api';

export const InventoryAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [poCreatedSku, setPoCreatedSku] = useState(null);

  const fetchAlerts = async () => {
    setLoading(true);
    const res = await APIService.getInventoryAlerts();
    setAlerts(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleGeneratePO = (sku, recommendedOrder) => {
    setPoCreatedSku(sku);
    setTimeout(() => {
      setPoCreatedSku(null);
    }, 3500);
  };

  const filteredAlerts = alerts.filter(item => {
    const matchesSeverity = severityFilter === 'all' || item.severity === severityFilter;
    const matchesSearch =
      item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const warningCount = alerts.filter(a => a.severity === 'warning').length;
  const healthyCount = alerts.filter(a => a.severity === 'healthy').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <span>AI-Driven Stockout Risk & Replenishment Orders</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Days of Supply (DOS) calculated against 14-day forward AI demand projections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAlerts}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setSeverityFilter('critical')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            severityFilter === 'critical'
              ? 'bg-rose-500/20 border-rose-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Critical Stockouts</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
          </div>
          <p className="text-2xl font-black text-white font-mono mt-2">{criticalCount} Nodes</p>
          <p className="text-[11px] text-slate-400 mt-0.5">&lt; 3 Days Supply Remaining</p>
        </div>

        <div
          onClick={() => setSeverityFilter('warning')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            severityFilter === 'warning'
              ? 'bg-amber-500/20 border-amber-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Low Stock Warnings</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          </div>
          <p className="text-2xl font-black text-white font-mono mt-2">{warningCount} Nodes</p>
          <p className="text-[11px] text-slate-400 mt-0.5">3.0 to 7.0 Days Supply</p>
        </div>

        <div
          onClick={() => setSeverityFilter('healthy')}
          className={`p-4 rounded-xl border cursor-pointer transition ${
            severityFilter === 'healthy'
              ? 'bg-emerald-500/20 border-emerald-500'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Adequate Stock</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-2">{healthyCount} Nodes</p>
          <p className="text-[11px] text-slate-400 mt-0.5">&ge; 7.0 Days Safety Buffer</p>
        </div>
      </div>

      {/* PO Success Notification Toast */}
      {poCreatedSku && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between shadow-xl animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">Automated Replenishment Purchase Order Created!</p>
              <p className="text-[11px] text-emerald-400/80">
                PO #PO-2026-{Math.floor(1000 + Math.random() * 9000)} dispatched to supplier for SKU: <strong>{poCreatedSku}</strong>.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-bold">
            EDI Sent
          </span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              severityFilter === 'all'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Severities ({alerts.length})
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              severityFilter === 'critical'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Critical Only ({criticalCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search SKU, name, or DC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>

      {/* Alerts Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px] bg-slate-950/40">
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Product / SKU</th>
                <th className="py-2.5 px-3">Fulfillment Center</th>
                <th className="py-2.5 px-3 font-mono">Current On-Hand</th>
                <th className="py-2.5 px-3 font-mono">Daily Run Rate</th>
                <th className="py-2.5 px-3 font-mono">Days of Supply</th>
                <th className="py-2.5 px-3 font-mono">AI Recommended Order</th>
                <th className="py-2.5 px-3 text-right">Replenishment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAlerts.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    {item.severity === 'critical' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        CRITICAL
                      </span>
                    )}
                    {item.severity === 'warning' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        WARNING
                      </span>
                    )}
                    {item.severity === 'healthy' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        HEALTHY
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-100">{item.name}</p>
                    <p className="text-[11px] font-mono text-slate-400">{item.sku}</p>
                  </td>

                  <td className="py-3 px-3 text-slate-300 flex items-center gap-1.5 mt-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{item.location}</span>
                  </td>

                  <td className="py-3 px-3 font-mono font-bold text-slate-200">
                    {item.current_stock.toLocaleString()} units
                  </td>

                  <td className="py-3 px-3 font-mono text-slate-400">
                    {item.daily_run_rate} units/day
                  </td>

                  <td className="py-3 px-3 font-mono">
                    <span
                      className={`font-bold ${
                        item.days_of_supply < 3.0
                          ? 'text-rose-400'
                          : item.days_of_supply < 7.0
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {item.days_of_supply} Days
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-emerald-400 font-bold">
                    +{item.recommended_order.toLocaleString()} units
                  </td>

                  <td className="py-3 px-3 text-right">
                    {item.recommended_order > 0 ? (
                      <button
                        onClick={() => handleGeneratePO(item.sku, item.recommended_order)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition shadow-md shadow-emerald-600/20 flex items-center gap-1.5 ml-auto"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Order PO</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-mono">No Action</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
