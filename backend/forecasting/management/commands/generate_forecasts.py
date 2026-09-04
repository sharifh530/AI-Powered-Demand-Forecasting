"""
Django management command to generate demand forecasts using the champion model.
Run with: python manage.py generate_forecasts
"""
from django.core.management.base import BaseCommand
from forecasting.ml_engine.inference import ForecastInferenceService


class Command(BaseCommand):
    help = 'Generate demand forecasts for all active SKU/location combinations'

    def add_arguments(self, parser):
        parser.add_argument(
            '--horizon',
            type=int,
            default=14,
            help='Number of days to forecast into the future (default: 14)',
        )
        parser.add_argument(
            '--model-run-id',
            type=int,
            default=None,
            help='Optional: use a specific ModelTrainingRun ID instead of the champion',
        )

    def handle(self, *args, **options):
        horizon = options['horizon']
        model_run_id = options['model_run_id']

        self.stdout.write(
            self.style.SUCCESS(f'Starting forecast generation for {horizon}-day horizon...')
        )

        try:
            forecasts = ForecastInferenceService.generate_forecasts(
                forecast_horizon_days=horizon,
                override_model_run_id=model_run_id
            )

            self.stdout.write(
                self.style.SUCCESS(f'✓ Generated {len(forecasts)} forecast records successfully!')
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error during forecast generation: {str(e)}')
            )
            raise e
