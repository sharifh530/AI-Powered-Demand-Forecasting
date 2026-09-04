from django.db import models
from accounts.models import User


class IngestionLog(models.Model):
    """Log records for data ingestion pipeline executions."""
    STATUS_CHOICES = [
        ('running', 'Running'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('partially_completed', 'Partially Completed'),
    ]

    SOURCE_TYPE_CHOICES = [
        ('csv', 'CSV File Upload'),
        ('api', 'External API'),
        ('database', 'External Database'),
        ('manual', 'Manual Entry'),
    ]

    ingestion_id = models.CharField(max_length=100, unique=True, db_index=True)
    source_type = models.CharField(max_length=50, choices=SOURCE_TYPE_CHOICES)
    source_reference = models.CharField(max_length=500, help_text="File path, API endpoint, or database connection string")

    data_type = models.CharField(max_length=100, help_text="Type of data ingested: sales, inventory, product_master, etc.")
    records_processed = models.IntegerField(default=0)
    records_inserted = models.IntegerField(default=0)
    records_updated = models.IntegerField(default=0)
    records_failed = models.IntegerField(default=0)

    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='running')
    error_message = models.TextField(blank=True)
    error_details = models.JSONField(default=dict, blank=True, help_text="Detailed error records per row/batch")

    triggered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='ingestion_runs')
    trigger_type = models.CharField(max_length=50, default='manual', help_text="manual, scheduled, api")

    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'ingestion_logs'
        ordering = ['-start_time']

    def __str__(self):
        return f"Ingestion {self.ingestion_id}: {self.data_type} ({self.status}) - {self.records_processed} records"

    @property
    def success_rate(self):
        if self.records_processed == 0:
            return 0.0
        return ((self.records_inserted + self.records_updated) / self.records_processed) * 100


class SalesTransaction(models.Model):
    """Historical sales transactions per SKU and location."""
    sku = models.CharField(max_length=100, db_index=True)
    location_code = models.CharField(max_length=50, db_index=True)
    transaction_date = models.DateField(db_index=True)

    quantity_sold = models.IntegerField(default=0)
    revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    is_promotion = models.BooleanField(default=False)
    promotion_code = models.CharField(max_length=50, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    ingestion_log = models.ForeignKey(
        IngestionLog,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales_transactions'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'sales_transactions'
        indexes = [
            models.Index(fields=['sku', 'location_code', 'transaction_date']),
            models.Index(fields=['transaction_date']),
            models.Index(fields=['sku', 'transaction_date']),
        ]
        ordering = ['-transaction_date']

    def __str__(self):
        return f"Sale: {self.sku} @ {self.location_code} on {self.transaction_date}: {self.quantity_sold} units"
