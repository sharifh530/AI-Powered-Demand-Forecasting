from rest_framework import serializers
from .models import InventorySnapshot


class InventorySnapshotSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_code = serializers.CharField(source='location.location_code', read_only=True)
    total_inventory = serializers.ReadOnlyField()
    holding_value = serializers.ReadOnlyField()

    class Meta:
        model = InventorySnapshot
        fields = [
            'id', 'sku', 'location', 'location_name', 'location_code',
            'snapshot_date', 'stock_on_hand', 'stock_in_transit',
            'reorder_point', 'safety_stock', 'unit_cost',
            'total_inventory', 'holding_value', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'total_inventory', 'holding_value']
