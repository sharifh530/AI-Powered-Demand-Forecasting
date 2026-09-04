import React, { useState } from 'react';
import { X, Cpu, Play, CheckCircle2, Award, Zap, BarChart2 } from 'lucide-react';
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
    'Executing Train/Test holdout split at ' + splitDate + '...',
    'Training Candidate 1: Weighted Moving Average (14d Window)...',
    'Training Candidate 2: Holt-Winters Triple Exponential Smoothing...',
    'Training Candidate 3: HistGradientBoostingRegressor Ensemble...',
    'Training Candidate 4: Stacked MLP Neural Network (64, 32)...',
    'Evaluating WAPE, RMSE, MAE, and 90% PICP uncertainty coverage...',
    'Auto-tagging new tournament Champion!'
  ];

  const handleRunTournament = async (e) => {
    e.preventDefault();
    setLoading(true);
    setProgressStep(0);
    setTournamentResult(null);

    // Step through visual progress simulation
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Trigger Model Tournament</h2>
            <p className="text-xs text-slate-400">Automated Multi-Model Retraining & Champion Selection</p>
          </div>
        </div>

        {/* Form or Running Progress */}
        {!loading && !tournamentResult && (
          <form onSubmit={handleRunTournament} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Holdout Split Date</label>
                <input
                  type="date"
                  value={splitDate}
                  onChange={(e) => setSplitDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Forecast Horizon</label>
                <select
                  value={horizon}
                  onChange={(e) => setHorizon(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                >
                  <option value="7">7 Days</option>
                  <option value="14">14 Days (Standard)</option>
                  <option value="28">28 Days (Monthly)</option>
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Candidate 3: GBDT Hyperparameters
              </span>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Max Iterations</label>
                  <input
                    type="number"
                    value={iterations}
                    onChange={(e) => setIterations(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Learning Rate</label>
                  <input
                    type="text"
                    value={learningRate}
                    onChange={(e) => setLearningRate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">Max Depth</label>
                  <input
                    type="number"
                    value={maxDepth}
                    onChange={(e) => setMaxDepth(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-[11px] text-slate-400">
              <p className="font-semibold text-slate-300 mb-1">Tournament Execution Strategy:</p>
              <p>Will evaluate 4 candidates (GBDT, Stacked MLP, Holt-Winters, Moving Average) against holdout data. The lowest WAPE score model is promoted to active Champion.</p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-semibold text-xs transition shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>Start 4-Model Tournament</span>
            </button>
          </form>
        )}

        {/* Loading Progress State */}
        {loading && (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-teal-400 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                Training ML Pipeline...
              </span>
              <span className="text-slate-400 font-mono">{Math.round(((progressStep + 1) / steps.length) * 100)}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${((progressStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
              <p className="text-teal-300">{steps[progressStep]}</p>
            </div>
          </div>
        )}

        {/* Completed Result State */}
        {tournamentResult && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <Award className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-emerald-300">Tournament Completed Successfully</h3>
                <p className="text-xs text-emerald-400/80 mt-0.5">
                  Champion Model: <strong>{tournamentResult.model_name_display || 'HistGradientBoosting (GBDT)'}</strong> ({tournamentResult.model_version || 'v1.9-gbdt'})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">WAPE</p>
                <p className="text-sm font-bold text-emerald-400 font-mono">{tournamentResult.wape}%</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">RMSE</p>
                <p className="text-sm font-bold text-slate-200 font-mono">{tournamentResult.rmse}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">MAE</p>
                <p className="text-sm font-bold text-slate-200 font-mono">{tournamentResult.mae}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <p className="text-[10px] text-slate-400">90% Coverage</p>
                <p className="text-sm font-bold text-teal-400 font-mono">{tournamentResult.coverage_90}%</p>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition"
            >
              Close & View Updated Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
