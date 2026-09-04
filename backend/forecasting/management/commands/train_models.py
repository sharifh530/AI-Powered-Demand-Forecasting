"""
Django management command to trigger ML model training pipeline.
Run with: python manage.py train_models
"""
from django.core.management.base import BaseCommand
from forecasting.ml_engine.pipeline import ModelTrainingPipeline


class Command(BaseCommand):
    help = 'Train all candidate ML models, evaluate them, and select a champion'

    def add_arguments(self, parser):
        parser.add_argument(
            '--split-date',
            type=str,
            default='2026-07-01',
            help='Train/test split date (YYYY-MM-DD). Data before this is training, after is test.',
        )
        parser.add_argument(
            '--triggered-by',
            type=str,
            default='system',
            help='Who triggered this training run (e.g., system, admin username)',
        )

    def handle(self, *args, **options):
        split_date = options['split_date']
        triggered_by = options['triggered_by']

        self.stdout.write(
            self.style.SUCCESS(f'Starting ML training pipeline with split date {split_date}...')
        )

        try:
            best_run, created_runs = ModelTrainingPipeline.run_training_suite(
                split_date_str=split_date,
                triggered_by=triggered_by
            )

            self.stdout.write(self.style.SUCCESS('\n=== Training Complete ==='))
            self.stdout.write(f"Trained {len(created_runs)} model architectures:")
            for run in created_runs:
                champ_marker = " ★ CHAMPION" if run.is_champion else ""
                self.stdout.write(
                    f"  • {run.run_name}: WAPE={run.wape}%, MAPE={run.mape}%, RMSE={run.rmse}{champ_marker}"
                )

            self.stdout.write(
                self.style.SUCCESS(f'\n✓ Champion model: {best_run["candidate"]["name"]}')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error during training: {str(e)}')
            )
            raise e
