import React, { useState, useEffect } from 'react';
import { KPICard } from '../components/KPICard';
import { ConfidenceChart } from '../components/ConfidenceChart';
import {
  Sparkles,
  Trophy,
  AlertTriangle,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import APIService from '../services/api';

export const ExecutiveOverview = ({ onNavigate, onOpenRetrain }) => {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSku, setSelectedSku] = useState('BEV-001');

  useEffect(() => {
    const fetchOverviewData = async () => {
      setLoading(true);
      const res = await APIService.getForecasts({ sku: selectedSku, location: 1, horizon: 14 });
      setForecasts(res.data);
      setLoading(false);
    };
    fetchOverviewData();
  }, [selectedSku]);

  const totalDemand14d = forecasts.reduce((acc, f) => acc + (f.predicted_demand || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner: Enterprise Production Status */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Production AI Forecasting Online</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Champion: HistGBDT v1.8
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              14-Day horizon forward projection active across 8 SKUs & 4 Fulfillment Centers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => onNavigate('forecasts')}
            className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-1.5"
          >
            <span>Explore Forecasts</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenRetrain}
            className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Retrain Models</span>
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Champion Model WAPE"
          value="12.19%"
          subtitle="HistGradientBoosting (v1.8)"
          change="-4.17% vs Baseline"
          changeType="positive"
          icon={Trophy}
          accentColor="emerald"
        />

        <KPICard
          title="90% PICP Band Coverage"
          value="92.40%"
          subtitle="Target: ≥ 90.00% Coverage"
          change="+2.40% Over Target"
          changeType="positive"
          icon={ShieldCheck}
          accentColor="teal"
        />

        <KPICard
          title="14-Day Forecast Volume"
          value={`${totalDemand14d.toLocaleString()} units`}
          subtitle="Selected SKU (Central Hub)"
          change="+8.4% Week-over-Week"
          changeType="positive"
          icon={TrendingUp}
          accentColor="indigo"
        />

        <KPICard
          title="Critical Stockout Risk"
          value="3 SKUs"
          subtitle="< 3 Days Supply Remaining"
          change="Action Required"
          changeType="negative"
          icon={AlertTriangle}
          accentColor="rose"
        />
      </div>

      {/* Main Chart Section: Demand Curve with 90% Confidence Bounds */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Projected Demand Curve with 90% Confidence Envelopes</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                14 Days
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Shaded band reflects the 5th to 95th percentile uncertainty interval generated by the GBDT ensemble.
            </p>
          </div>

          {/* Sku Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">SKU:</span>
            <select
              value={selectedSku}
              onChange={(e) => setSelectedSku(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 font-medium focus:outline-none focus:border-emerald-500 transition"
            >
              <option value="BEV-001">BEV-001 - Sparkling Tonic (330ml)</option>
              <option value="BEV-002">BEV-002 - Cold Brew Nitro (250ml)</option>
              <option value="EL-001">EL-001 - Wireless Keyboard</option>
              <option value="EL-002">EL-002 - USB-C GaN Charger 65W</option>
              <option value="HOM-001">HOM-001 - Bamboo Towel Set</option>
              <option value="PER-001">PER-001 - Facial Cleanser</option>
              <option value="PER-002">PER-002 - Mineral Sunscreen SPF 50+</option>
            </select>
          </div>
        </div>

        {/* Live Confidence Chart */}
        <ConfidenceChart
          forecasts={forecasts}
          skuLabel={selectedSku}
          locationLabel="Central Fulfillment Hub"
        />
      </div>

      {/* Two Column Section: Model Tournament Leaderboard Snapshot & Stockout Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tournament Snapshot */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>Model Tournament Benchmark</span>
            </h4>
            <button
              onClick={() => onNavigate('leaderboard')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              Full Leaderboard &rarr;
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                  ★ HistGradientBoosting (GBDT)
                  <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 rounded">Champion</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">18 Feature Lag & Cyclic Pipeline</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-emerald-400 text-sm">12.19% WAPE</p>
                <p className="text-[10px] text-slate-400 font-mono">RMSE: 5.68</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-300">Stacked Deep MLP Neural Net</p>
                <p className="text-[11px] text-slate-500 mt-0.5">[64, 32] ReLU Architecture</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-slate-300 text-sm">12.64% WAPE</p>
                <p className="text-[10px] text-slate-500 font-mono">RMSE: 6.09</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-400">Weighted Moving Average (14d)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Heuristic Baseline</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-slate-400 text-sm">16.36% WAPE</p>
                <p className="text-[10px] text-slate-500 font-mono">RMSE: 8.05</p>
              </div>
            </div>
          </div>
        </div>

        {/* Urgent Inventory Risks */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Critical Inventory Stockout Risks</span>
            </h4>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
            >
              View All Alerts &rarr;
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
              <div>
                <p className="font-bold text-rose-300">BEV-001 (Sparkling Tonic)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Central Hub • 2.1 Days of Supply</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                  CRITICAL
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">Order 600 units</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
              <div>
                <p className="font-bold text-rose-300">PER-002 (Mineral Sunscreen SPF 50+)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Southern Hub • 1.8 Days of Supply</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                  CRITICAL
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">Order 400 units</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <p className="font-bold text-amber-300">EL-002 (GaN Charger 65W)</p>
                <p className="text-[11px] text-slate-400 mt-0.5">West Coast DC • 4.3 Days of Supply</p>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                  WARNING
                </span>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">Order 350 units</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
