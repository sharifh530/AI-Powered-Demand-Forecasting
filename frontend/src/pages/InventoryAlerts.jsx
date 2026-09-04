import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  ShoppingCart,
  RefreshCw,
  Search,
  CheckCircle2,
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

  const severityTag = (severity) => {
    const map = {
      critical: { text: 'Critical', className: 'text-status-critical' },
      warning: { text: 'Warning', className: 'text-status-warning' },
      healthy: { text: 'Healthy', className: 'text-status-healthy' },
    };
    const s = map[severity];
    if (!s) return null;
    return <span className={`text-[10px] font-semibold ${s.className}`}>{s.text}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-display font-bold text-paper flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-status-critical" />
            <span>AI-driven stockout risk &amp; replenishment orders</span>
          </h2>
          <p className="text-xs text-paper-muted mt-0.5">
            Real-time days of supply (DOS) calculated against 14-day forward AI demand projections.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
          className="p-2 bg-graphite-800 hover:bg-graphite-850 text-paper-muted border border-hairline text-xs font-medium transition flex items-center gap-1.5"
          title="Refresh Inventory"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="panel grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-hairline">
        <div
          onClick={() => setSeverityFilter('critical')}
          className={`p-4 cursor-pointer transition border-l-[3px] ${
            severityFilter === 'critical' ? 'border-l-status-critical bg-graphite-850' : 'border-l-transparent hover:bg-graphite-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-status-critical">Critical stockouts</span>
            <span className="w-1.5 h-1.5 rounded-full bg-status-critical animate-pulse"></span>
          </div>
          <p className="text-2xl font-display font-bold text-paper mt-2">{criticalCount} nodes</p>
          <p className="text-[11px] text-paper-muted mt-0.5">&lt; 3 days supply remaining</p>
        </div>

        <div
          onClick={() => setSeverityFilter('warning')}
          className={`p-4 cursor-pointer transition border-l-[3px] ${
            severityFilter === 'warning' ? 'border-l-status-warning bg-graphite-850' : 'border-l-transparent hover:bg-graphite-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-status-warning">Low stock warnings</span>
          </div>
          <p className="text-2xl font-display font-bold text-paper mt-2">{warningCount} nodes</p>
          <p className="text-[11px] text-paper-muted mt-0.5">3.0 to 7.0 days supply</p>
        </div>

        <div
          onClick={() => setSeverityFilter('healthy')}
          className={`p-4 cursor-pointer transition border-l-[3px] ${
            severityFilter === 'healthy' ? 'border-l-status-healthy bg-graphite-850' : 'border-l-transparent hover:bg-graphite-850'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-status-healthy">Adequate stock</span>
            <ShieldCheck className="w-4 h-4 text-status-healthy" />
          </div>
          <p className="text-2xl font-display font-bold text-paper mt-2">{healthyCount} nodes</p>
          <p className="text-[11px] text-paper-muted mt-0.5">&ge; 7.0 days safety buffer</p>
        </div>
      </div>

      {/* PO Success Notification Toast */}
      {poCreatedSku && (
        <div className="panel border-l-[3px] border-l-status-healthy p-4 text-status-healthy text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <div>
              <p className="font-semibold">Automated replenishment purchase order created</p>
              <p className="text-[11px] opacity-80">
                PO #PO-2026-{Math.floor(1000 + Math.random() * 9000)} dispatched to supplier for SKU: <strong>{poCreatedSku}</strong>.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold">EDI sent</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium transition ${
              severityFilter === 'all' ? 'bg-graphite-800 text-paper border border-hairline' : 'text-paper-muted hover:text-paper'
            }`}
          >
            All severities ({alerts.length})
          </button>
          <button
            onClick={() => setSeverityFilter('critical')}
            className={`px-3 py-1.5 text-xs font-medium transition ${
              severityFilter === 'critical' ? 'text-status-critical border-b-2 border-status-critical' : 'text-paper-muted hover:text-paper'
            }`}
          >
            Critical only ({criticalCount})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-paper-dim absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Search SKU, name, or DC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-graphite-950 border border-hairline text-xs text-paper focus:outline-none focus:border-signal-amber font-mono"
          />
        </div>
      </div>

      {/* Alerts Table */}
      <div className="panel p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-hairline text-paper-muted font-medium text-[11px]">
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Product / SKU</th>
                <th className="py-2.5 px-3">Fulfillment center</th>
                <th className="py-2.5 px-3">Current on-hand</th>
                <th className="py-2.5 px-3">Daily run rate</th>
                <th className="py-2.5 px-3">Days of supply</th>
                <th className="py-2.5 px-3">AI recommended order</th>
                <th className="py-2.5 px-3 text-right">Replenishment action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {filteredAlerts.map((item, idx) => (
                <tr key={idx} className="hover:bg-graphite-850 transition">
                  <td className="py-3 px-3">
                    {severityTag(item.severity)}
                  </td>

                  <td className="py-3 px-3">
                    <p className="font-semibold text-paper">{item.name}</p>
                    <p className="text-[11px] font-mono text-paper-muted">{item.sku}</p>
                  </td>

                  <td className="py-3 px-3 text-paper-muted">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-paper-dim" />
                      <span>{item.location}</span>
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono font-semibold text-paper">
                    {item.current_stock.toLocaleString()} units
                  </td>

                  <td className="py-3 px-3 font-mono text-paper-muted">
                    {item.daily_run_rate} units/day
                  </td>

                  <td className="py-3 px-3 font-mono">
                    <span
                      className={`font-semibold ${
                        item.days_of_supply < 3.0
                          ? 'text-status-critical'
                          : item.days_of_supply < 7.0
                          ? 'text-status-warning'
                          : 'text-status-healthy'
                      }`}
                    >
                      {item.days_of_supply} days
                    </span>
                  </td>

                  <td className="py-3 px-3 font-mono text-signal-amber font-semibold">
                    +{item.recommended_order.toLocaleString()} units
                  </td>

                  <td className="py-3 px-3 text-right">
                    {item.recommended_order > 0 ? (
                      <button
                        onClick={() => handleGeneratePO(item.sku, item.recommended_order)}
                        className="px-3 py-1.5 bg-signal-amber hover:bg-signal-amber/90 text-graphite-950 text-[11px] font-semibold transition flex items-center gap-1.5 ml-auto"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Order PO</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-paper-dim">No action</span>
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
