from django.db import models
from forecasting.models import Product, Location


class DemandHistoryAggregated(models.Model):
    """Pre-aggregated demand history for faster ML feature extraction."""
    AGGREGATION_LEVELS = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]

    sku = models.CharField(max_length=100, db_index=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='demand_history')
    aggregation_level = models.CharField(max_length=20, choices=AGGREGATION_LEVELS, default='daily')
    period_start_date = models.DateField(db_index=True)
    period_end_date = models.DateField()

    total_demand = models.IntegerField(default=0, help_text="Total units sold in this period")
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    average_unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    promotion_flag = models.BooleanField(default=False, help_text="Whether promotion was active in this period")
    stockout_flag = models.BooleanField(default=False, help_text="Whether stockout occurred in this period")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'demand_history_aggregated'
        unique_together = ('sku', 'location', 'aggregation_level', 'period_start_date')
        indexes = [
            models.Index(fields=['sku', 'location', 'aggregation_level', 'period_start_date']),
            models.Index(fields=['period_start_date']),
        ]
        ordering = ['-period_start_date']

    def __str__(self):
        return f"Demand: {self.sku} @ {self.location.location_code} ({self.aggregation_level}) {self.period_start_date}: {self.total_demand} units"


class TimeSeriesFeatures(models.Model):
    """Engineered features for ML models: lags, rolling stats, calendar encodings."""
    sku = models.CharField(max_length=100, db_index=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='time_series_features')
    feature_date = models.DateField(db_index=True)

    # Lag features (t-1 to t-52 weeks)
    lag_1 = models.IntegerField(null=True, blank=True, help_text="Demand 1 week ago")
    lag_2 = models.IntegerField(null=True, blank=True)
    lag_4 = models.IntegerField(null=True, blank=True)
    lag_12 = models.IntegerField(null=True, blank=True)
    lag_52 = models.IntegerField(null=True, blank=True, help_text="Demand 1 year ago")

    # Rolling statistics
    rolling_mean_7d = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rolling_mean_14d = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rolling_mean_30d = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rolling_std_7d = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    rolling_std_30d = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Calendar encodings
    day_of_week = models.IntegerField(null=True, blank=True, help_text="0=Monday, 6=Sunday")
    day_of_month = models.IntegerField(null=True, blank=True)
    week_of_year = models.IntegerField(null=True, blank=True)
    month = models.IntegerField(null=True, blank=True)
    quarter = models.IntegerField(null=True, blank=True)
    is_weekend = models.BooleanField(default=False)
    is_holiday = models.BooleanField(default=False)

    # Promotional signals
    promotion_active = models.BooleanField(default=False)
    days_since_promotion = models.IntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'time_series_features'
        unique_together = ('sku', 'location', 'feature_date')
        indexes = [
            models.Index(fields=['sku', 'location', 'feature_date']),
            models.Index(fields=['feature_date']),
        ]
        ordering = ['-feature_date']

    def __str__(self):
        return f"Features: {self.sku} @ {self.location.location_code} on {self.feature_date}"
