import logging
from datetime import datetime, date
import numpy as np
import pandas as pd
from django.utils import timezone
from django.db import transaction

from forecasting.models import ModelTrainingRun, Location, Product
from analytics.models import DemandHistoryAggregated, TimeSeriesFeatures
from .models import (
    MovingAverageModel, HoltWintersModel,
    GradientBoostingDemandModel, NeuralNetworkDemandModel
)
from .metrics import (
    calculate_mape, calculate_wape, calculate_rmse, calculate_mae, calculate_picp
)

logger = logging.getLogger(__name__)


class ModelTrainingPipeline:
    """End-to-end training, evaluation, and champion selection pipeline."""

    @classmethod
    def load_dataset(cls):
        """Merge TimeSeriesFeatures with DemandHistoryAggregated to create full training dataset."""
        features_qs = TimeSeriesFeatures.objects.all().values()
        demand_qs = DemandHistoryAggregated.objects.filter(aggregation_level='daily').values(
            'sku', 'location_id', 'period_start_date', 'total_demand'
        )

        df_feat = pd.DataFrame(list(features_qs))
        df_dem = pd.DataFrame(list(demand_qs))

        if df_feat.empty or df_dem.empty:
            raise ValueError("Insufficient feature/demand data. Run data ingestion first.")

        df_feat['feature_date'] = pd.to_datetime(df_feat['feature_date'])
        df_dem['period_start_date'] = pd.to_datetime(df_dem['period_start_date'])

        df = pd.merge(
            df_feat,
            df_dem,
            left_on=['sku', 'location_id', 'feature_date'],
            right_on=['sku', 'location_id', 'period_start_date'],
            how='inner'
        )

        return df.sort_values('feature_date').reset_index(drop=True)

    @classmethod
    def run_training_suite(cls, split_date_str='2026-07-01', triggered_by='system'):
        """Train all 4 candidate architectures, evaluate on test set, and assign champion model."""
        logger.info("Executing ML Training Suite...")
        split_date = pd.to_datetime(split_date_str)

        df = cls.load_dataset()
        data_start_date = df['feature_date'].min().date()
        data_end_date = df['feature_date'].max().date()

        df_train = df[df['feature_date'] < split_date].copy()
        df_test = df[df['feature_date'] >= split_date].copy()

        if len(df_train) == 0 or len(df_test) == 0:
            raise ValueError("Train or test split is empty. Verify date ranges.")

        y_test_actual = df_test['total_demand'].values.astype(float)

        candidates = [
            {
                'name': 'Stacked Deep Neural Network (MLP/LSTM)',
                'arch': 'lstm',
                'version': 'v2.4-neural',
                'model_class': NeuralNetworkDemandModel,
                'params': {'hidden_layers': [64, 32], 'activation': 'relu', 'optimizer': 'adam', 'lr': 0.005}
            },
            {
                'name': 'Gradient Boosted Decision Trees (HistGBDT)',
                'arch': 'gru',  # Mapped to ensemble deep/GBDT
                'version': 'v1.8-gbdt',
                'model_class': GradientBoostingDemandModel,
                'params': {'max_iter': 120, 'learning_rate': 0.07, 'max_depth': 6}
            },
            {
                'name': 'Holt-Winters Exponential Smoothing',
                'arch': 'holt_winters',
                'version': 'v1.2-hw',
                'model_class': HoltWintersModel,
                'params': {'alpha': 0.35, 'beta': 0.1, 'gamma': 0.25, 'season_length': 7}
            },
            {
                'name': 'Weighted Rolling Moving Average Baseline',
                'arch': 'moving_average',
                'version': 'v1.0-ma',
                'model_class': MovingAverageModel,
                'params': {'window': 14, 'dow_weighting': True}
            },
        ]

        results = []

        for candidate in candidates:
            run_start = timezone.now()
            model_inst = candidate['model_class']()
            model_inst.fit(df_train)

            preds, lowers, uppers = model_inst.predict(df_test)

            mape = calculate_mape(y_test_actual, preds)
            wape = calculate_wape(y_test_actual, preds)
            rmse = calculate_rmse(y_test_actual, preds)
            mae = calculate_mae(y_test_actual, preds)
            picp = calculate_picp(y_test_actual, lowers, uppers)

            run_end = timezone.now()

            results.append({
                'candidate': candidate,
                'model_inst': model_inst,
                'mape': round(mape, 2),
                'wape': round(wape, 2),
                'rmse': round(rmse, 2),
                'mae': round(mae, 2),
                'picp': round(picp, 2),
                'start_time': run_start,
                'end_time': run_end
            })

        # Find champion (lowest WAPE)
        best_run = min(results, key=lambda r: r['wape'])

        created_runs = []
        with transaction.atomic():
            # Reset existing champions
            ModelTrainingRun.objects.filter(is_champion=True).update(is_champion=False)

            for r in results:
                c = r['candidate']
                is_champ = (r == best_run)
                run_obj = ModelTrainingRun.objects.create(
                    run_name=c['name'],
                    model_architecture=c['arch'],
                    status='completed',
                    hyperparameters=c['params'],
                    data_start_date=data_start_date,
                    data_end_date=data_end_date,
                    train_test_split_date=split_date.date(),
                    mape=r['mape'],
                    wape=r['wape'],
                    rmse=r['rmse'],
                    mae=r['mae'],
                    picp=r['picp'],
                    model_version=c['version'],
                    is_champion=is_champ,
                    model_artifact_path=f"models/artifacts/{c['version']}.joblib",
                    triggered_by=triggered_by,
                    training_start_time=r['start_time'],
                    training_end_time=r['end_time']
                )
                created_runs.append(run_obj)

        logger.info(f"Champion Model Selected: {best_run['candidate']['name']} (WAPE: {best_run['wape']}%, MAPE: {best_run['mape']}%)")
        return best_run, created_runs
