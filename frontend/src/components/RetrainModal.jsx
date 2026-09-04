import React, { useState } from 'react';
import { X, Cpu, Play, Award } from 'lucide-react';
import APIService from '../services/api';

export const RetrainModal = ({ isOpen, onClose, onTrainingComplete }) => {
  const [splitDate, setSplitDate] = useState('2026-07-01');
  const [horizon, setHorizon] = useState('14');
  const [learningRate, setLearningRate] = useState('0.07');
  const [maxDepth, setMaxDepth] = useState('6');
  const [iterations, setIterations] = useState('120');
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [tournamentResult, setTournamentResult] = useState(null);

  if (!isOpen) return null;

  const steps = [
    'Loading 54,544 historical time-series transactions...',
    'Generating 18 feature columns (lags, rolling means, cyclics)...',
    'Executing train/test holdout split at ' + splitDate + '...',
    'Training candidate 1: weighted moving average (14d window)...',
    'Training candidate 2: Holt-Winters triple exponential smoothing...',
    'Training candidate 3: HistGradientBoostingRegressor ensemble...',
    'Training candidate 4: stacked MLP neural network (64, 32)...',
    'Evaluating WAPE, RMSE, MAE, and 90% PICP uncertainty coverage...',
    'Auto-tagging new tournament champion...'
  ];

  const handleRunTournament = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProgressStep(0);
    setTournamentResult(null);

    for (let i = 0; i < steps.length; i++) {
      setProgressStep(i);
      await new Promise(r => setTimeout(r, 450));
    }

    const res = await APIService.triggerTraining({
      split_date: splitDate,
      forecast_horizon: parseInt(horizon),
      learning_rate: parseFloat(learningRate),
      max_depth: parseInt(maxDepth),
      iterations: parseInt(iterations)
    });

    if (res.success) {
      setTournamentResult(res.data);
      if (onTrainingComplete) {
        onTrainingComplete(res.data);
      }
    }
    setLoading(false);
  };

  const handleResetAndClose = () => {
    setTournamentResult(null);
    setProgressStep(0);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite-950/80">
      <div className="w-full max-w-lg bg-graphite-900 border border-hairline shadow-2xl p-6 relative">
        <button
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 p-1 text-paper-muted hover:text-paper transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-hairline">
          <Cpu className="w-5 h-5 text-signal-amber shrink-0" />
          <div>
            <h2 className="text-lg font-display font-bold text-paper">Trigger model tournament</h2>
            <p className="text-xs text-paper-muted">Automated multi-model retraining &amp; champion selection</p>
          </div>
        </div>

        {!loading && !tournamentResult && (
          <form onSubmit={handleRunTournament} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-paper-muted mb-1">Holdout split date</label>
                <input
                  type="date"
                  value={splitDate}
                  onChange={(e) => setSplitDate(e.target.value)}
                  className="w-full px-3 py-2 bg-graphite-950 border border-hairline text-xs text-paper font-mono focus:outline-none focus:border-signal-amber"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-paper-muted mb-1">Forecast horizon</label>
                <select
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                  className="w-full px-3 py-2 bg-graphite-950 border border-hairline text-xs text-paper focus:outline-none focus:border-signal-amber"
                >
                  <option value="7">7 days</option>
                  <option value="14">14 days (standard)</option>
                  <option value="28">28 days (monthly)</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 bg-graphite-950 border border-hairline space-y-3">
              <span className="text-[11px] font-medium text-paper-muted">
                Candidate 3: GBDT hyperparameters
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-paper-muted mb-1">Max iterations</label>
                  <input
                    type="number"
                    value={iterations}
                    onChange={(e) => setIterations(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-graphite-900 border border-hairline text-paper font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-paper-muted mb-1">Learning rate</label>
                  <input
                    type="text"
                    value={learningRate}
                    onChange={(e) => setLearningRate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-graphite-900 border border-hairline text-paper font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-paper-muted mb-1">Max depth</label>
                  <input
                    type="number"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-graphite-900 border border-hairline text-paper font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-graphite-850 border border-hairline text-[11px] text-paper-muted">
              <p className="font-medium text-paper mb-1">Tournament execution strategy</p>
              <p>Evaluates 4 candidates (GBDT, stacked MLP, Holt-Winters, moving average) against holdout data. The lowest WAPE score model is promoted to active champion.</p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-signal-amber hover:bg-signal-amber/90 text-graphite-950 font-semibold text-xs transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>Start 4-model tournament</span>
            </button>
          </form>
        )}

        {loading && (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-signal-amber font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-signal-amber animate-pulse"></span>
                Training ML pipeline...
              </span>
              <span className="text-paper-muted font-mono">{Math.round(((progressStep + 1) / steps.length) * 100)}%</span>
            </div>

            <div className="w-full h-1.5 bg-graphite-800 overflow-hidden">
              <div
                className="h-full bg-signal-amber transition-all duration-300"
                style={{ width: `${((progressStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>

            <div className="p-3.5 bg-graphite-950 border border-hairline text-xs font-mono text-paper-muted">
              <p className="text-signal-amber">{steps[progressStep]}</p>
            </div>
          </div>
        )}

        {tournamentResult && (
          <div className="space-y-4 py-2">
            <div className="p-4 border-l-[3px] border-l-signal-amber bg-graphite-850 flex items-start gap-3">
              <Award className="w-6 h-6 text-signal-amber shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-paper">Tournament completed successfully</h3>
                <p className="text-xs text-paper-muted mt-0.5">
                  Champion model: <strong className="text-paper">{tournamentResult.model_name_display || 'HistGradientBoosting (GBDT)'}</strong> ({tournamentResult.model_version || 'v1.9-gbdt'})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 bg-graphite-950 border border-hairline">
                <p className="text-[10px] text-paper-muted">WAPE</p>
                <p className="text-sm font-semibold text-signal-amber font-mono">{tournamentResult.wape}%</p>
              </div>
              <div className="p-2.5 bg-graphite-950 border border-hairline">
                <p className="text-[10px] text-paper-muted">RMSE</p>
                <p className="text-sm font-semibold text-paper font-mono">{tournamentResult.rmse}</p>
              </div>
              <div className="p-2.5 bg-graphite-950 border border-hairline">
                <p className="text-[10px] text-paper-muted">MAE</p>
                <p className="text-sm font-semibold text-paper font-mono">{tournamentResult.mae}</p>
              </div>
              <div className="p-2.5 bg-graphite-950 border border-hairline">
                <p className="text-[10px] text-paper-muted">90% coverage</p>
                <p className="text-sm font-semibold text-status-healthy font-mono">{tournamentResult.coverage_90}%</p>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-2.5 bg-graphite-800 hover:bg-graphite-850 text-paper font-semibold text-xs transition border border-hairline"
            >
              Close &amp; view updated dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
