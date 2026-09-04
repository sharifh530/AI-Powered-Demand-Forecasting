import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing import StandardScaler


class MovingAverageModel:
    """Weighted Rolling Moving Average Baseline with Day-of-Week Seasonality."""

    def __init__(self, window=14):
        self.window = window
        self.dow_weights = {}
        self.mean_demand = 0.0

    def fit(self, df_train: pd.DataFrame):
        # Calculate base average and day of week relative multipliers
        self.mean_demand = float(df_train['total_demand'].mean()) if len(df_train) > 0 else 10.0
        dow_means = df_train.groupby('day_of_week')['total_demand'].mean().to_dict()
        overall_mean = max(1e-3, self.mean_demand)
        self.dow_weights = {dow: val / overall_mean for dow, val in dow_means.items()}
        return self

    def predict(self, df_test: pd.DataFrame):
        preds = []
        lowers = []
        uppers = []

        for _, row in df_test.iterrows():
            dow = int(row.get('day_of_week', 0))
            dow_mult = self.dow_weights.get(dow, 1.0)
            rolling = float(row.get('rolling_mean_14d', self.mean_demand))
            if np.isnan(rolling) or rolling <= 0:
                rolling = self.mean_demand

            promo_mult = 1.8 if row.get('promotion_active', False) else 1.0
            pred_val = max(0.0, rolling * dow_mult * promo_mult)

            # Prediction intervals (±25% heuristic baseline)
            lower = max(0.0, pred_val * 0.75)
            upper = pred_val * 1.25

            preds.append(pred_val)
            lowers.append(lower)
            uppers.append(upper)

        return np.array(preds), np.array(lowers), np.array(uppers)


class HoltWintersModel:
    """Holt-Winters Exponential Smoothing with Trend and Seasonality."""

    def __init__(self, alpha=0.3, beta=0.1, gamma=0.2, season_length=7):
        self.alpha = alpha
        self.beta = beta
        self.gamma = gamma
        self.season_length = season_length
        self.level = 0.0
        self.trend = 0.0
        self.seasonals = np.ones(season_length)

    def fit(self, df_train: pd.DataFrame):
        y = df_train['total_demand'].values.astype(float)
        if len(y) < self.season_length * 2:
            self.level = np.mean(y) if len(y) > 0 else 10.0
            return self

        # Initialize seasonal components
        self.level = np.mean(y[:self.season_length])
        self.trend = (np.mean(y[self.season_length:2*self.season_length]) - self.level) / self.season_length
        self.seasonals = np.zeros(self.season_length)
        for i in range(self.season_length):
            self.seasonals[i] = y[i] - self.level

        # Smooth over training series
        for t in range(len(y)):
            val = y[t]
            s_idx = t % self.season_length
            last_level = self.level
            self.level = self.alpha * (val - self.seasonals[s_idx]) + (1 - self.alpha) * (self.level + self.trend)
            self.trend = self.beta * (self.level - last_level) + (1 - self.beta) * self.trend
            self.seasonals[s_idx] = self.gamma * (val - self.level) + (1 - self.gamma) * self.seasonals[s_idx]

        return self

    def predict(self, df_test: pd.DataFrame):
        preds = []
        lowers = []
        uppers = []

        std_err = max(2.0, self.level * 0.15)

        for step, (_, row) in enumerate(df_test.iterrows()):
            s_idx = step % self.season_length
            promo_boost = 10.0 if row.get('promotion_active', False) else 0.0
            pred_val = max(0.0, self.level + (step + 1) * self.trend + self.seasonals[s_idx] + promo_boost)

            lower = max(0.0, pred_val - 1.645 * std_err)  # 90% confidence z-score = 1.645
            upper = pred_val + 1.645 * std_err

            preds.append(pred_val)
            lowers.append(lower)
            uppers.append(upper)

        return np.array(preds), np.array(lowers), np.array(uppers)


class GradientBoostingDemandModel:
    """Gradient Boosted Decision Trees Regressor with Feature Engineering."""

    FEATURE_COLS = [
        'lag_1', 'lag_2', 'lag_4', 'lag_12', 'lag_52',
        'rolling_mean_7d', 'rolling_mean_14d', 'rolling_mean_30d',
        'rolling_std_7d', 'rolling_std_30d',
        'day_of_week', 'day_of_month', 'week_of_year', 'month', 'quarter',
        'is_weekend', 'is_holiday', 'promotion_active'
    ]

    def __init__(self, max_iter=100, learning_rate=0.08, max_depth=6):
        self.model = HistGradientBoostingRegressor(
            max_iter=max_iter,
            learning_rate=learning_rate,
            max_depth=max_depth,
            random_state=42
        )
        self.residual_std = 1.0

    def fit(self, df_train: pd.DataFrame):
        X = df_train[self.FEATURE_COLS].copy()
        for col in ['is_weekend', 'is_holiday', 'promotion_active']:
            X[col] = X[col].astype(int)
        X = X.fillna(0)
        y = df_train['total_demand'].values.astype(float)

        self.model.fit(X, y)
        train_preds = self.model.predict(X)
        self.residual_std = max(1.0, float(np.std(y - train_preds)))
        return self

    def predict(self, df_test: pd.DataFrame):
        X = df_test[self.FEATURE_COLS].copy()
        for col in ['is_weekend', 'is_holiday', 'promotion_active']:
            X[col] = X[col].astype(int)
        X = X.fillna(0)

        preds = np.maximum(0.0, self.model.predict(X))
        lowers = np.maximum(0.0, preds - 1.645 * self.residual_std)
        uppers = preds + 1.645 * self.residual_std

        return preds, lowers, uppers


class NeuralNetworkDemandModel:
    """Stacked Deep Neural Network (MLP) for Non-Linear Time Series Dynamics."""

    FEATURE_COLS = [
        'lag_1', 'lag_2', 'lag_4', 'lag_12', 'lag_52',
        'rolling_mean_7d', 'rolling_mean_14d', 'rolling_mean_30d',
        'rolling_std_7d', 'rolling_std_30d',
        'day_of_week', 'day_of_month', 'week_of_year', 'month', 'quarter',
        'is_weekend', 'is_holiday', 'promotion_active'
    ]

    def __init__(self, hidden_layer_sizes=(64, 32), max_iter=200, learning_rate_init=0.005):
        self.scaler = StandardScaler()
        self.model = MLPRegressor(
            hidden_layer_sizes=hidden_layer_sizes,
            activation='relu',
            solver='adam',
            max_iter=max_iter,
            learning_rate_init=learning_rate_init,
            random_state=42,
            early_stopping=True,
            n_iter_no_change=10
        )
        self.residual_std = 1.0

    def fit(self, df_train: pd.DataFrame):
        X = df_train[self.FEATURE_COLS].copy()
        for col in ['is_weekend', 'is_holiday', 'promotion_active']:
            X[col] = X[col].astype(int)
        X = X.fillna(0)
        y = df_train['total_demand'].values.astype(float)

        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)

        train_preds = self.model.predict(X_scaled)
        self.residual_std = max(1.0, float(np.std(y - train_preds)))
        return self

    def predict(self, df_test: pd.DataFrame):
        X = df_test[self.FEATURE_COLS].copy()
        for col in ['is_weekend', 'is_holiday', 'promotion_active']:
            X[col] = X[col].astype(int)
        X = X.fillna(0)

        X_scaled = self.scaler.transform(X)
        preds = np.maximum(0.0, self.model.predict(X_scaled))
        lowers = np.maximum(0.0, preds - 1.645 * self.residual_std)
        uppers = preds + 1.645 * self.residual_std

        return preds, lowers, uppers
