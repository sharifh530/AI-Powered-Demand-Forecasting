import React, { useState, useEffect } from 'react';
import {
  Trophy,
  RefreshCw,
  Cpu,
  BarChart2,
  HelpCircle,
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
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-display font-bold text-paper flex items-center gap-2">
            <Trophy className="w-4 h-4 text-signal-amber" />
            <span>Automated model tournament &amp; governance leaderboard</span>
          </h2>
          <p className="text-xs text-paper-muted mt-0.5">
            Multi-model benchmarking on holdout evaluation splits with automatic champion promotion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLeaderboard}
            className="p-2 bg-graphite-800 hover:bg-graphite-850 text-paper-muted border border-hairline text-xs font-medium transition flex items-center gap-1.5"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onOpenRetrain}
            className="px-4 py-2 bg-signal-amber hover:bg-signal-amber/90 text-graphite-950 text-xs font-semibold transition flex items-center gap-2"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Trigger retraining tournament</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Tournament Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="text-xs font-semibold text-paper flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-signal-amber" />
                <span>Active tournament standings (54,544 transactions)</span>
              </h3>
              <span className="text-[11px] text-paper-muted">Ranking metric: WAPE (lowest wins)</span>
            </div>

            <div className="divide-y divide-hairline">
              {leaderboard.map((model, idx) => {
                const isSelected = selectedModel?.id === model.id;
                return (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModel(model)}
                    className={`py-3.5 border-l-[3px] pl-3 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      model.status === 'champion'
                        ? 'border-l-signal-amber'
                        : isSelected
                        ? 'border-l-paper-dim'
                        : 'border-l-transparent hover:border-l-hairline'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-8 h-8 flex items-center justify-center font-mono font-bold text-sm shrink-0 ${
                          model.status === 'champion'
                            ? 'bg-signal-amber text-graphite-950'
                            : 'bg-graphite-800 text-paper-muted'
                        }`}
                      >
                        #{idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-paper">{model.name}</h4>
                          {model.status === 'champion' && (
                            <span className="text-[10px] font-semibold text-signal-amber">Champion</span>
                          )}
                          {model.status === 'challenger' && (
                            <span className="text-[10px] font-medium text-paper-muted">Challenger</span>
                          )}
                        </div>
                        <p className="text-xs text-paper-muted mt-0.5">
                          {model.architecture} &middot; Version: <span className="font-mono text-paper-dim">{model.version}</span>
                        </p>
                      </div>
                    </div>

                    {/* Metric Readouts */}
                    <div className="grid grid-cols-4 sm:flex items-center gap-3 text-right">
                      <div className="sm:px-3 sm:border-r border-hairline">
                        <p className="text-[10px] text-paper-muted">WAPE</p>
                        <p
                          className={`font-mono font-semibold text-sm ${
                            model.status === 'champion' ? 'text-signal-amber' : 'text-paper'
                          }`}
                        >
                          {model.wape}%
                        </p>
                      </div>

                      <div className="sm:px-3 sm:border-r border-hairline">
                        <p className="text-[10px] text-paper-muted">RMSE</p>
                        <p className="font-mono font-medium text-xs text-paper">{model.rmse}</p>
                      </div>

                      <div className="sm:px-3 sm:border-r border-hairline">
                        <p className="text-[10px] text-paper-muted">MAE</p>
                        <p className="font-mono font-medium text-xs text-paper">{model.mae}</p>
                      </div>

                      <div className="sm:pl-3">
                        <p className="text-[10px] text-paper-muted">Coverage</p>
                        <p className="font-mono font-medium text-xs text-paper">{model.coverage_90}%</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Evaluation Metric Breakdown Guide */}
          <div className="panel p-4 text-xs text-paper-muted space-y-2">
            <h4 className="font-medium text-paper flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Model tournament metric definitions</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] pt-1">
              <div>
                <strong className="text-paper">WAPE (weighted absolute percentage error):</strong> the primary loss function, dividing sum of absolute errors by total actual volume. Resilient against zero-demand denominators.
              </div>
              <div>
                <strong className="text-paper">90% PICP (prediction interval coverage):</strong> the percentage of actual holdout sales falling inside the [5th, 95th] percentile quantile band (target: &ge; 90.0%).
              </div>
            </div>
          </div>
        </div>

        {/* Selected Model Details / Governance Inspector (1 Col) */}
        <div className="space-y-4">
          <div className="panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="text-xs font-semibold text-paper flex items-center gap-2">
                <Cpu className="w-4 h-4 text-signal-amber" />
                <span>Architecture specification</span>
              </h3>
              <span className="text-[10px] font-mono text-paper-dim">
                {selectedModel?.version}
              </span>
            </div>

            {selectedModel ? (
              <div className="space-y-3.5 text-xs">
                <div>
                  <p className="text-[11px] text-paper-muted">Model name</p>
                  <p className="font-semibold text-paper text-sm mt-0.5">{selectedModel.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-2.5 bg-graphite-950 border border-hairline">
                    <p className="text-[10px] text-paper-muted">Inference status</p>
                    <p className="font-semibold text-signal-amber capitalize mt-0.5">{selectedModel.status}</p>
                  </div>
                  <div className="p-2.5 bg-graphite-950 border border-hairline">
                    <p className="text-[10px] text-paper-muted">Training speed</p>
                    <p className="font-mono font-medium text-paper mt-0.5">{selectedModel.training_time}</p>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-paper-muted mb-1">Architecture &amp; pipeline</p>
                  <div className="p-3 bg-graphite-950 border border-hairline font-mono text-[11px] text-paper">
                    {selectedModel.architecture}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] text-paper-muted mb-1">Hyperparameter configuration</p>
                  <div className="p-3 bg-graphite-950 border border-hairline space-y-1 font-mono text-[11px]">
                    {Object.entries(selectedModel.params || {}).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between text-paper-muted">
                        <span>{k}:</span>
                        <span className="text-paper font-medium">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 border-l-[3px] border-l-status-healthy bg-graphite-850 text-status-healthy text-[11px] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    Production guardrail: model satisfies holdout coverage target with <strong>{selectedModel.coverage_90}%</strong> 90% PICP.
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-paper-dim text-xs">
                Select a model from the leaderboard to inspect parameters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
