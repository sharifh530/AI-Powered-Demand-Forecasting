from django.db import models
from forecasting.models import Location


class InventorySnapshot(models.Model):
    """Daily snapshot of inventory positions per SKU and location."""
    sku = models.CharField(max_length=100, db_index=True)
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='inventory_snapshots')
    snapshot_date = models.DateField(db_index=True)

    stock_on_hand = models.IntegerField(default=0, help_text="Current available sellable stock")
    stock_in_transit = models.IntegerField(default=0, help_text="Stock in transit from suppliers/warehouses")
    reorder_point = models.IntegerField(default=0, help_text="Calculated reorder trigger point")
    safety_stock = models.IntegerField(default=0, help_text="Buffer stock for demand spikes / lead time variability")
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'inventory_snapshots'
        unique_together = ('sku', 'location', 'snapshot_date')
        indexes = [
            models.Index(fields=['sku', 'location', 'snapshot_date']),
            models.Index(fields=['snapshot_date']),
        ]
        ordering = ['-snapshot_date']

    def __str__(self):
        return f"Inventory: {self.sku} @ {self.location.location_code} on {self.snapshot_date}: {self.stock_on_hand} units"

    @property
    def total_inventory(self):
        return self.stock_on_hand + self.stock_in_transit

    @property
    def holding_value(self):
        return float(self.stock_on_hand) * float(self.unit_cost)
