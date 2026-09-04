"""
Django management command to populate sample data using SampleDataGenerator.
Run with: python manage.py populate_sample_data
"""
from django.core.management.base import BaseCommand
from ingestion.services import SampleDataGenerator


class Command(BaseCommand):
    help = 'Populate database with enterprise-grade sample data (products, locations, sales, inventory)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--start-date',
            type=str,
            default='2024-01-01',
            help='Start date for sales data generation (YYYY-MM-DD)',
        )
        parser.add_argument(
            '--end-date',
            type=str,
            default='2026-08-31',
            help='End date for sales data generation (YYYY-MM-DD)',
        )

    def handle(self, *args, **options):
        start_date = options['start_date']
        end_date = options['end_date']

        self.stdout.write(
            self.style.SUCCESS(f'Starting sample data generation from {start_date} to {end_date}...')
        )

        try:
            SampleDataGenerator.populate_all(start_date_str=start_date, end_date_str=end_date)
            self.stdout.write(
                self.style.SUCCESS('✓ Sample data populated successfully!')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Error during data population: {str(e)}')
            )
            raise e
