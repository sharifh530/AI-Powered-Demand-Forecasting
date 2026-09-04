import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  Zap,
  RefreshCw,
  Cpu,
  BarChart2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Activity,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import APIService from '../services/api';

export const ModelLeaderboard = ({ onOpenRetrain }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const res = await APIService.getLeaderboard();
    setLeaderboard(res.data);
    if (res.data.length > 0 && !selectedModel) {
      setSelectedModel(res.data[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <span>Automated Model Tournament & Governance Leaderboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Multi-model benchmarking on holdout evaluation splits with automatic Champion promotion.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLeaderboard}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onOpenRetrain}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-semibold transition shadow-lg shadow-teal-600/20 flex items-center gap-2"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Trigger Retraining Tournament</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Tournament Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                <span>Active Tournament Standings (54,544 Transactions)</span>
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Ranking Metric: WAPE (Lowest Wins)</span>
            </div>

            <div className="space-y-3">
              {leaderboard.map((model, idx) => {
                const isSelected = selectedModel?.id === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      model.status === 'champion'
                        ? 'bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/5'
                        : isSelected
                        ? 'bg-slate-800/80 border-slate-600'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                          model.status === 'champion'
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                            : idx === 1
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        #{idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{model.name}</h4>
                          {model.status === 'champion' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 shadow-sm">
                              CHAMPION
                            </span>
                          )}
                          {model.status === 'challenger' && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                              CHALLENGER
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {model.architecture} • Version: <span className="font-mono text-slate-300">{model.version}</span>
                        </p>
                      </div>
                    </div>

                    {/* Metric Badges */}
                    <div className="grid grid-cols-4 sm:flex items-center gap-3 text-right">
                      <div className="sm:px-3 sm:border-r border-slate-800">
                        <p className="text-[10px] text-slate-400">WAPE</p>
                        <p
                          className={`font-mono font-bold text-sm ${
                            model.status === 'champion' ? 'text-emerald-400' : 'text-slate-200'
                          }`}
                        >
                          {model.wape}%
                        </p>
                      </div>

                      <div className="sm:px-3 sm:border-r border-slate-800">
                        <p className="text-[10px] text-slate-400">RMSE</p>
                        <p className="font-mono font-semibold text-xs text-slate-300">{model.rmse}</p>
                      </div>

                      <div className="sm:px-3 sm:border-r border-slate-800">
                        <p className="text-[10px] text-slate-400">MAE</p>
                        <p className="font-mono font-semibold text-xs text-slate-300">{model.mae}</p>
                      </div>

                      <div className="sm:pl-3">
                        <p className="text-[10px] text-slate-400">Coverage</p>
                        <p className="font-mono font-semibold text-xs text-teal-300">{model.coverage_90}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Evaluation Metric Breakdown Guide */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
            <h4 className="font-semibold text-slate-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-teal-400" />
              <span>Model Tournament Metric Definitions</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
              <div>
                <strong className="text-slate-300 font-mono">WAPE (Weighted Absolute Percentage Error):</strong> The primary loss function dividing sum of absolute errors by total actual volume. Resilient against zero-demand denominators.
              </div>
              <div>
                <strong className="text-slate-300 font-mono">90% PICP (Prediction Interval Coverage):</strong> The percentage of actual holdout sales falling inside the [5th, 95th] percentile quantile band. (Target: &ge; 90.0%).
              </div>
            </div>
          </div>
        </div>

        {/* Selected Model Details / Governance Inspector (1 Col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-teal-400" />
                <span>Architecture Specification</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {selectedModel?.version}
              </span>
            </div>

            {selectedModel ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <p className="text-[11px] text-slate-400">Model Name</p>
                  <p className="font-bold text-white text-sm mt-0.5">{selectedModel.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-400">Inference Status</p>
                    <p className="font-bold text-emerald-400 uppercase mt-0.5">{selectedModel.status}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-400">Training Speed</p>
                    <p className="font-mono font-semibold text-slate-200 mt-0.5">{selectedModel.training_time}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 mb-1">Architecture & Pipeline</p>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                    {selectedModel.architecture}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400 mb-1">Hyperparameter Configuration</p>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1 font-mono text-[11px]">
                    {Object.entries(selectedModel.params || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-slate-400">
                        <span>{k}:</span>
                        <span className="text-teal-300 font-semibold">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Production Guardrail: Model satisfies holdout coverage target with <strong>{selectedModel.coverage_90}%</strong> 90% PICP.
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs">
                Select a model from the leaderboard to inspect parameters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
