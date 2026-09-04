from rest_framework import serializers
from .models import IngestionLog, SalesTransaction


class IngestionLogSerializer(serializers.ModelSerializer):
    success_rate = serializers.ReadOnlyField()
    triggered_by_username = serializers.CharField(source='triggered_by.username', read_only=True)

    class Meta:
        model = IngestionLog
        fields = [
            'id', 'ingestion_id', 'source_type', 'source_reference', 'data_type',
            'records_processed', 'records_inserted', 'records_updated', 'records_failed',
            'status', 'error_message', 'error_details', 'triggered_by', 'triggered_by_username',
            'trigger_type', 'start_time', 'end_time', 'success_rate'
        ]
        read_only_fields = ['id', 'start_time', 'success_rate']


class SalesTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesTransaction
        fields = [
            'id', 'sku', 'location_code', 'transaction_date',
            'quantity_sold', 'revenue', 'unit_price',
            'is_promotion', 'promotion_code', 'discount_amount',
            'ingestion_log', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
