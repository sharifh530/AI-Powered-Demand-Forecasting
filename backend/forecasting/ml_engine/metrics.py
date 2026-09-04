import numpy as np


def calculate_mape(y_true, y_pred, epsilon=1e-5):
    """
    Mean Absolute Percentage Error (MAPE).
    MAPE = (100 / n) * sum(|y - y_hat| / (|y| + epsilon))
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    # Avoid division by zero by replacing zero actuals with epsilon or filtering
    denominator = np.where(y_true == 0, epsilon, y_true)
    mape = np.mean(np.abs((y_true - y_pred) / denominator)) * 100.0
    return float(np.clip(mape, 0.0, 1000.0))


def calculate_wape(y_true, y_pred):
    """
    Weighted Absolute Percentage Error (WAPE).
    WAPE = sum(|y - y_hat|) / sum(y) * 100
    More robust than MAPE for intermittent demand or zero values.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)

    sum_actuals = np.sum(y_true)
    if sum_actuals == 0:
        return 0.0

    wape = (np.sum(np.abs(y_true - y_pred)) / sum_actuals) * 100.0
    return float(np.clip(wape, 0.0, 1000.0))


def calculate_rmse(y_true, y_pred):
    """
    Root Mean Squared Error (RMSE).
    RMSE = sqrt((1 / n) * sum((y - y_hat)^2))
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))


def calculate_mae(y_true, y_pred):
    """
    Mean Absolute Error (MAE).
    MAE = (1 / n) * sum(|y - y_hat|)
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    return float(np.mean(np.abs(y_true - y_pred)))


def calculate_picp(y_true, lower_bound, upper_bound):
    """
    Prediction Interval Coverage Probability (PICP).
    Percentage of actual values that fall within [lower_bound, upper_bound].
    """
    y_true = np.asarray(y_true, dtype=float)
    lower = np.asarray(lower_bound, dtype=float)
    upper = np.asarray(upper_bound, dtype=float)

    in_bounds = (y_true >= lower) & (y_true <= upper)
    return float(np.mean(in_bounds) * 100.0)
