import logging
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from django.utils import timezone
from django.db import transaction

from forecasting.models import Forecast, ModelTrainingRun, Product, Location
from forecasting.ml_engine.pipeline import ModelTrainingPipeline
from .models import (
    MovingAverageModel, HoltWintersModel,
    GradientBoostingDemandModel, NeuralNetworkDemandModel
)

logger = logging.getLogger(__name__)


class ForecastInferenceService:
    """Generate forecasts using the champion model."""

    MODEL_CLASS_MAP = {
        'moving_average': MovingAverageModel,
        'holt_winters': HoltWintersModel,
        'gru': GradientBoostingDemandModel,  # Mapped to ensemble deep/GBDT
        'lstm': NeuralNetworkDemandModel,
    }

    @classmethod
    def get_champion_model(cls):
        """Retrieve the current champion model training run."""
        champion = ModelTrainingRun.objects.filter(
            is_champion=True,
            status='completed'
        ).order_by('-training_start_time').first()

        if not champion:
            raise ValueError("No champion model found. Run training pipeline first.")

        return champion

    @classmethod
    def load_model_instance(cls, training_run: ModelTrainingRun):
        """Instantiate model from training run metadata."""
        model_class = cls.MODEL_CLASS_MAP.get(training_run.model_architecture)
        if not model_class:
            raise ValueError(f"Unknown model architecture: {training_run.model_architecture}")

        params = training_run.hyperparameters or {}

        # Instantiate with saved hyperparameters
        if training_run.model_architecture == 'moving_average':
            model = model_class(window=params.get('window', 14))
        elif training_run.model_architecture == 'holt_winters':
            model = model_class(
                alpha=params.get('alpha', 0.3),
                beta=params.get('beta', 0.1),
                gamma=params.get('gamma', 0.2),
                season_length=params.get('season_length', 7)
            )
        elif training_run.model_architecture == 'gru':
            model = model_class(
                max_iter=params.get('max_iter', 100),
                learning_rate=params.get('learning_rate', 0.08),
                max_depth=params.get('max_depth', 6)
            )
        elif training_run.model_architecture == 'lstm':
            model = model_class(
                hidden_layer_sizes=tuple(params.get('hidden_layers', [64, 32])),
                max_iter=200,
                learning_rate_init=params.get('lr', 0.005)
            )
        else:
            model = model_class()

        return model

    @classmethod
    def generate_forecasts(cls, forecast_horizon_days=14, override_model_run_id=None):
        """
        Generate forecasts for all SKU/location pairs for the next N days.

        Args:
            forecast_horizon_days: Number of days into the future to forecast
            override_model_run_id: Optional ID of a specific ModelTrainingRun to use instead of champion
        """
        logger.info(f"Starting forecast generation for {forecast_horizon_days}-day horizon...")

        # Load champion model
        if override_model_run_id:
            training_run = ModelTrainingRun.objects.get(id=override_model_run_id)
        else:
            training_run = cls.get_champion_model()

        logger.info(f"Using model: {training_run.run_name} (version {training_run.model_version})")

        # Load historical dataset (features + demand)
        df_hist = ModelTrainingPipeline.load_dataset()

        if df_hist.empty:
            raise ValueError("No historical training data available. Run feature engineering first.")

        # Get all active SKU/location combinations
        products = Product.objects.filter(lifecycle_status='active')
        locations = Location.objects.filter(is_active=True)

        forecast_start_date = timezone.now().date()
        created_forecasts = []

        with transaction.atomic():
            for product in products:
                for location in locations:
                    sku = product.sku
                    loc_id = location.id

                    # Filter historical data for this SKU/location
                    df_train = df_hist[
                        (df_hist['sku'] == sku) &
                        (df_hist['location_id'] == loc_id)
                    ].copy()

                    if len(df_train) < 30:
                        logger.warning(f"Insufficient history for {sku} @ {loc_id}. Skipping.")
                        continue

                    # Create synthetic future feature rows
                    last_date = df_train['feature_date'].max()
                    future_dates = pd.date_range(
                        start=last_date + timedelta(days=1),
                        periods=forecast_horizon_days,
                        freq='D'
                    )

                    # Build future feature set with simple rolling forward of last known values
                    df_future = pd.DataFrame({
                        'feature_date': future_dates,
                        'sku': sku,
                        'location_id': loc_id,
                    })

                    # Forward-fill calendar features
                    for idx, row_date in enumerate(future_dates):
                        df_future.loc[idx, 'day_of_week'] = row_date.weekday()
                        df_future.loc[idx, 'day_of_month'] = row_date.day
                        df_future.loc[idx, 'week_of_year'] = row_date.isocalendar()[1]
                        df_future.loc[idx, 'month'] = row_date.month
                        df_future.loc[idx, 'quarter'] = (row_date.month - 1) // 3 + 1
                        df_future.loc[idx, 'is_weekend'] = int(row_date.weekday() >= 5)
                        df_future.loc[idx, 'is_holiday'] = 0  # Simplified
                        df_future.loc[idx, 'promotion_active'] = 0

                    # Forward-fill lag and rolling features from last known row
                    last_row = df_train.iloc[-1]
                    for col in ['lag_1', 'lag_2', 'lag_4', 'lag_12', 'lag_52',
                                'rolling_mean_7d', 'rolling_mean_14d', 'rolling_mean_30d',
                                'rolling_std_7d', 'rolling_std_30d']:
                        df_future[col] = last_row.get(col, 0.0)

                    # Train model on historical data
                    model_inst = cls.load_model_instance(training_run)
                    model_inst.fit(df_train)

                    # Predict
                    preds, lowers, uppers = model_inst.predict(df_future)

                    # Persist forecasts
                    for i, pred_date in enumerate(future_dates):
                        forecast_obj = Forecast.objects.create(
                            sku=sku,
                            location=location,
                            forecast_date=pred_date.date(),
                            forecast_horizon=i + 1,
                            predicted_demand=round(float(preds[i]), 2),
                            lower_bound=round(float(lowers[i]), 2),
                            upper_bound=round(float(uppers[i]), 2),
                            confidence_level=90.00,
                            model_run=training_run,
                            model_version=training_run.model_version
                        )
                        created_forecasts.append(forecast_obj)

        logger.info(f"Generated {len(created_forecasts)} forecast records across {len(products)} SKUs and {len(locations)} locations.")
        return created_forecasts
