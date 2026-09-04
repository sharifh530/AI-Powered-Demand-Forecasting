import React, { useState, useEffect } from 'react';
import { ConfidenceChart } from '../components/ConfidenceChart';
import {
  LineChart,
  Download,
  Filter,
  RefreshCw,
  Search,
  Calendar,
  MapPin,
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

  const totalDemand = forecasts.reduce((sum, f) => sum + (f.predicted_demand || 0), 0);
  const avgDaily = forecasts.length > 0 ? (totalDemand / forecasts.length).toFixed(1) : 0;
  const peakForecast = forecasts.reduce((max, f) => f.predicted_demand > max.predicted_demand ? f : max, forecasts[0] || { predicted_demand: 0, forecast_date: 'N/A' });

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
    <div className="space-y-6">
      {/* Header & Controls Panel */}
      <div className="panel p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-display font-bold text-paper flex items-center gap-2">
              <LineChart className="w-4 h-4 text-signal-amber" />
              <span>Forecast explorer &amp; uncertainty analysis</span>
            </h2>
            <p className="text-xs text-paper-muted mt-0.5">
              Inspect multi-step forward inference and 90% confidence bands across SKU-location nodes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchForecasts}
              className="p-2 bg-graphite-800 hover:bg-graphite-850 text-paper-muted border border-hairline text-xs font-medium transition flex items-center gap-1.5"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-signal-amber hover:bg-signal-amber/90 text-graphite-950 text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-hairline">
          <div>
            <label className="block text-xs font-medium text-paper-muted mb-1 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>Product SKU</span>
            </label>
            <select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full px-3 py-2 bg-graphite-950 border border-hairline text-xs text-paper font-medium focus:outline-none focus:border-signal-amber transition"
            >
              {products.map(p => (
                <option key={p.sku} value={p.sku}>
                  {p.sku} - {p.name} ({p.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-paper-muted mb-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Fulfillment center / location</span>
            </label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2 bg-graphite-950 border border-hairline text-xs text-paper font-medium focus:outline-none focus:border-signal-amber transition"
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>
                  {loc.code} - {loc.name} ({loc.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-paper-muted mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Forecast horizon</span>
            </label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="w-full px-3 py-2 bg-graphite-950 border border-hairline text-xs text-paper font-medium focus:outline-none focus:border-signal-amber transition"
            >
              <option value="7">7 days forward (short-term)</option>
              <option value="14">14 days forward (standard sprint)</option>
              <option value="28">28 days forward (monthly cycle)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Slice KPI Summary Strip */}
      <div className="panel grid grid-cols-2 md:grid-cols-4 divide-x divide-hairline">
        <div className="p-4">
          <p className="text-[11px] text-paper-muted">Total projected demand</p>
          <p className="text-xl font-display font-bold text-paper mt-1">{totalDemand.toLocaleString()} units</p>
          <p className="text-[11px] text-paper-dim mt-0.5">Across {horizon} days</p>
        </div>

        <div className="p-4">
          <p className="text-[11px] text-paper-muted">Daily average demand</p>
          <p className="text-xl font-display font-bold text-signal-amber mt-1">{avgDaily} units/day</p>
          <p className="text-[11px] text-paper-dim mt-0.5">Mean projection rate</p>
        </div>

        <div className="p-4">
          <p className="text-[11px] text-paper-muted">Peak demand day</p>
          <p className="text-xl font-display font-bold text-paper mt-1">{peakForecast.predicted_demand} units</p>
          <p className="text-[11px] text-paper-dim mt-0.5">{peakForecast.forecast_date}</p>
        </div>

        <div className="p-4">
          <p className="text-[11px] text-paper-muted">Inference model</p>
          <p className="text-sm font-semibold text-paper mt-1">HistGBDT v1.8</p>
          <p className="text-[11px] text-paper-dim mt-0.5">90% confidence interval</p>
        </div>
      </div>

      {/* Interactive Line Chart with Confidence Bands */}
      <div className="panel p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <h3 className="text-xs font-semibold text-paper">
            Forward demand curve, 90% confidence band: {sku} @ {locations.find(l => l.id.toString() === locationId)?.code || 'DC-CENTRAL'}
          </h3>
          <span className="text-[10px] font-mono text-signal-amber">
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
      <div className="panel p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-hairline pb-3">
          <h3 className="text-xs font-semibold text-paper flex items-center gap-2">
            <TableIcon className="w-4 h-4 text-signal-amber" />
            <span>Detailed forecast intervals &amp; quantiles</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-paper-dim absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search date or horizon..."
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-graphite-950 border border-hairline text-xs text-paper focus:outline-none focus:border-signal-amber font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-hairline text-paper-muted font-medium text-[11px]">
                <th className="py-2.5 px-3">Horizon</th>
                <th className="py-2.5 px-3">Forecast date</th>
                <th className="py-2.5 px-3">Predicted demand</th>
                <th className="py-2.5 px-3">Lower bound (5th %)</th>
                <th className="py-2.5 px-3">Upper bound (95th %)</th>
                <th className="py-2.5 px-3">Uncertainty spread</th>
                <th className="py-2.5 px-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline font-mono">
              {filteredForecasts.map((f, idx) => {
                const spread = f.upper_bound - f.lower_bound;
                return (
                  <tr key={idx} className="hover:bg-graphite-850 transition">
                    <td className="py-2 px-3 text-paper-muted">Day +{f.forecast_horizon}</td>
                    <td className="py-2 px-3 text-paper font-medium">{f.forecast_date}</td>
                    <td className="py-2 px-3 text-signal-amber font-semibold text-sm">{f.predicted_demand} units</td>
                    <td className="py-2 px-3 text-paper-muted">{f.lower_bound}</td>
                    <td className="py-2 px-3 text-paper-muted">{f.upper_bound}</td>
                    <td className="py-2 px-3 text-paper-muted">±{(spread / 2).toFixed(1)}</td>
                    <td className="py-2 px-3 text-paper-muted font-sans">
                      {f.confidence_level}%
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
