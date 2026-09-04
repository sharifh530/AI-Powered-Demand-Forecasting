from django.db import models


class Category(models.Model):
    """Product category hierarchy."""
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=50, unique=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategories')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Location(models.Model):
    """Store, Warehouse, or Distribution Center."""
    LOCATION_TYPES = [
        ('store', 'Retail Store'),
        ('warehouse', 'Regional Warehouse'),
        ('dc', 'Distribution Center'),
    ]

    location_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    location_type = models.CharField(max_length=50, choices=LOCATION_TYPES, default='store')
    region = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    capacity_units = models.IntegerField(default=10000)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'locations'
        ordering = ['location_code']

    def __str__(self):
        return f"{self.name} ({self.location_code})"


class Product(models.Model):
    """Product master catalog."""
    LIFECYCLE_CHOICES = [
        ('active', 'Active'),
        ('phase_out', 'Phase Out'),
        ('new_launch', 'New Launch'),
        ('discontinued', 'Discontinued'),
    ]

    sku = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    lead_time_days = models.IntegerField(default=14, help_text="Supplier lead time in days")
    min_order_qty = models.IntegerField(default=10, help_text="Minimum order quantity for replenishment")
    safety_stock_days = models.IntegerField(default=7, help_text="Target safety stock days of supply")
    lifecycle_status = models.CharField(max_length=50, choices=LIFECYCLE_CHOICES, default='active')
    attributes = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['sku']

    def __str__(self):
        return f"{self.sku} - {self.name}"


class ModelTrainingRun(models.Model):
    """Metadata for machine learning model training executions."""
    ARCHITECTURE_CHOICES = [
        ('lstm', 'Stacked LSTM Deep Neural Network'),
        ('gru', 'Gated Recurrent Unit (GRU)'),
        ('holt_winters', 'Holt-Winters Exponential Smoothing'),
        ('moving_average', 'Weighted Rolling Moving Average'),
    ]

    STATUS_CHOICES = [
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    run_name = models.CharField(max_length=255)
    model_architecture = models.CharField(max_length=50, choices=ARCHITECTURE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='running')
    hyperparameters = models.JSONField(default=dict, blank=True)
    data_start_date = models.DateField(null=True, blank=True)
    data_end_date = models.DateField(null=True, blank=True)
    train_test_split_date = models.DateField(null=True, blank=True)

    # Evaluation Metrics
    mape = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="Mean Absolute Percentage Error (%)")
    wape = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, help_text="Weighted Absolute Percentage Error (%)")
    rmse = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Root Mean Squared Error")
    mae = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Mean Absolute Error")
    picp = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True, help_text="Prediction Interval Coverage Probability (%)")

    model_version = models.CharField(max_length=50)
    is_champion = models.BooleanField(default=False)
    model_artifact_path = models.CharField(max_length=500, blank=True)
    triggered_by = models.CharField(max_length=100, default='system')
    error_message = models.TextField(blank=True)

    training_start_time = models.DateTimeField(auto_now_add=True)
    training_end_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'model_training_runs'
        ordering = ['-training_start_time']

    def __str__(self):
        champion_tag = " [CHAMPION]" if self.is_champion else ""
        return f"{self.run_name} ({self.model_version}){champion_tag} - MAPE: {self.mape}%"


class Forecast(models.Model):
    """Demand forecast predictions generated per SKU, location, and horizon."""
    sku = models.CharField(max_length=100, db_index=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='forecasts')
    forecast_date = models.DateField(db_index=True)
    forecast_horizon = models.IntegerField(help_text="Forecast horizon in weeks or days")

    predicted_demand = models.DecimalField(max_digits=10, decimal_places=2)
    lower_bound = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    upper_bound = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    confidence_level = models.DecimalField(max_digits=5, decimal_places=2, default=90.00)

    model_run = models.ForeignKey(ModelTrainingRun, on_delete=models.SET_NULL, null=True, blank=True, related_name='forecasts')
    model_version = models.CharField(max_length=50, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'forecasts'
        indexes = [
            models.Index(fields=['sku', 'location', 'forecast_date']),
            models.Index(fields=['forecast_date', 'forecast_horizon']),
        ]
        ordering = ['forecast_date']

    def __str__(self):
        return f"Forecast: {self.sku} @ {self.location.location_code} on {self.forecast_date} = {self.predicted_demand}"


class ForecastAccuracyRecord(models.Model):
    """Comparison of predicted demand against actual demand once realized."""
    forecast = models.ForeignKey(Forecast, on_delete=models.CASCADE, null=True, blank=True, related_name='accuracy_records')
    sku = models.CharField(max_length=100, db_index=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='accuracy_records')
    forecast_date = models.DateField(db_index=True)

    predicted_demand = models.DecimalField(max_digits=10, decimal_places=2)
    actual_demand = models.DecimalField(max_digits=10, decimal_places=2)
    absolute_error = models.DecimalField(max_digits=10, decimal_places=2)
    percentage_error = models.DecimalField(max_digits=8, decimal_places=2)

    evaluated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'forecast_accuracy_records'
        indexes = [
            models.Index(fields=['sku', 'location', 'forecast_date']),
        ]
        ordering = ['-forecast_date']

    def __str__(self):
        return f"Accuracy: {self.sku} on {self.forecast_date} (Error: {self.percentage_error}%)"
