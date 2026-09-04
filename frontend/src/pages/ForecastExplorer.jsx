import React, { useState, useEffect } from 'react';
import { ConfidenceChart } from '../components/ConfidenceChart';
import {
  LineChart,
  Download,
  Filter,
  RefreshCw,
  Search,
  Layers,
  Sparkles,
  Calendar,
  MapPin,
  TrendingUp,
  Table as TableIcon
} from 'lucide-react';
import APIService from '../services/api';

export const ForecastExplorer = () => {
  const [sku, setSku] = useState('BEV-001');
  const [locationId, setLocationId] = useState('1');
  const [horizon, setHorizon] = useState('14');
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [tableSearch, setTableSearch] = useState('');

  useEffect(() => {
    const loadMetadata = async () => {
      const [prodRes, locRes] = await Promise.all([
        APIService.getProducts(),
        APIService.getLocations()
      ]);
      setProducts(prodRes.data);
      setLocations(locRes.data);
    };
    loadMetadata();
  }, []);

  const fetchForecasts = async () => {
    setLoading(true);
    const res = await APIService.getForecasts({
      sku,
      location: locationId,
      horizon
    });
    setForecasts(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchForecasts();
  }, [sku, locationId, horizon]);

  // Aggregate statistics for selected slice
  const totalDemand = forecasts.reduce((sum, f) => sum + (f.predicted_demand || 0), 0);
  const avgDaily = forecasts.length > 0 ? (totalDemand / forecasts.length).toFixed(1) : 0;
  const peakForecast = forecasts.reduce((max, f) => f.predicted_demand > max.predicted_demand ? f : max, forecasts[0] || { predicted_demand: 0, forecast_date: 'N/A' });

  // Export to CSV
  const handleExportCSV = () => {
    if (forecasts.length === 0) return;
    const headers = ['SKU', 'Location_ID', 'Date', 'Horizon_Day', 'Predicted_Demand', 'Lower_Bound_90', 'Upper_Bound_90', 'Confidence_Level', 'Model_Version'];
    const rows = forecasts.map(f => [
      f.sku,
      f.location,
      f.forecast_date,
      f.forecast_horizon,
      f.predicted_demand,
      f.lower_bound,
      f.upper_bound,
      `${f.confidence_level}%`,
      f.model_version
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `forecast_${sku}_loc${locationId}_${horizon}d.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredForecasts = forecasts.filter(f =>
    f.forecast_date.includes(tableSearch) ||
    f.forecast_horizon.toString().includes(tableSearch) ||
    f.predicted_demand.toString().includes(tableSearch)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls Panel */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <LineChart className="w-5 h-5 text-emerald-400" />
              <span>Forecast Explorer & Uncertainty Analysis</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect multi-step forward inference and 90% confidence bands across SKU-Location nodes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchForecasts}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <span>Product SKU</span>
            </label>
            <select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500 transition"
            >
              {products.map(p => (
                <option key={p.sku} value={p.sku}>
                  {p.sku} - {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-400" />
              <span>Fulfillment Center / Location</span>
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500 transition"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} - {loc.name} ({loc.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              <span>Forecast Horizon</span>
            </label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="7">7 Days Forward (Short-term)</option>
              <option value="14">14 Days Forward (Standard Sprint)</option>
              <option value="28">28 Days Forward (Monthly Cycle)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Slice KPI Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Projected Demand</p>
          <p className="text-xl font-black text-white font-mono mt-1">{totalDemand.toLocaleString()} units</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Across {horizon} days</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Daily Average Demand</p>
          <p className="text-xl font-black text-emerald-400 font-mono mt-1">{avgDaily} units/day</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Mean projection rate</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Peak Demand Day</p>
          <p className="text-xl font-black text-teal-300 font-mono mt-1">{peakForecast.predicted_demand} units</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{peakForecast.forecast_date}</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Inference Model</p>
          <p className="text-sm font-bold text-emerald-300 font-mono mt-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            HistGBDT v1.8
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">90% Confidence Interval</p>
        </div>
      </div>

      {/* Interactive Line Chart with Confidence Bands */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Forward Demand Curve with 90% Confidence Band: {sku} @ {locations.find(l => l.id.toString() === locationId)?.code || 'DC-CENTRAL'}
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Holdout PICP: 92.4%
          </span>
        </div>

        <ConfidenceChart
          forecasts={forecasts}
          skuLabel={sku}
          locationLabel={locations.find(l => l.id.toString() === locationId)?.name}
        />
      </div>

      {/* Detailed Forecast Tabular Breakdown */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-emerald-400" />
            <span>Detailed Forecast Intervals & Quantiles</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search date or horizon..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold text-[10px] bg-slate-950/40">
                <th className="py-2.5 px-3">Horizon</th>
                <th className="py-2.5 px-3">Forecast Date</th>
                <th className="py-2.5 px-3 font-mono">Predicted Demand</th>
                <th className="py-2.5 px-3 font-mono">Lower Bound (5th %)</th>
                <th className="py-2.5 px-3 font-mono">Upper Bound (95th %)</th>
                <th className="py-2.5 px-3 font-mono">Uncertainty Spread</th>
                <th className="py-2.5 px-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredForecasts.map((f, idx) => {
                const spread = f.upper_bound - f.lower_bound;
                return (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 text-slate-400">Day +{f.forecast_horizon}</td>
                    <td className="py-2 px-3 text-slate-200 font-semibold">{f.forecast_date}</td>
                    <td className="py-2 px-3 text-emerald-400 font-bold text-sm">{f.predicted_demand} units</td>
                    <td className="py-2 px-3 text-slate-400">{f.lower_bound}</td>
                    <td className="py-2 px-3 text-slate-400">{f.upper_bound}</td>
                    <td className="py-2 px-3 text-teal-300">±{(spread / 2).toFixed(1)}</td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-sans">
                        {f.confidence_level}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
