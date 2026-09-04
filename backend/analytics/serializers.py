from rest_framework import serializers
from .models import DemandHistoryAggregated, TimeSeriesFeatures


class DemandHistoryAggregatedSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_code = serializers.CharField(source='location.location_code', read_only=True)

    class Meta:
        model = DemandHistoryAggregated
        fields = [
            'id', 'sku', 'location', 'location_name', 'location_code',
            'aggregation_level', 'period_start_date', 'period_end_date',
            'total_demand', 'total_revenue', 'average_unit_price',
            'promotion_flag', 'stockout_flag', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class TimeSeriesFeaturesSerializer(serializers.ModelSerializer):
    location_code = serializers.CharField(source='location.location_code', read_only=True)

    class Meta:
        model = TimeSeriesFeatures
        fields = [
            'id', 'sku', 'location', 'location_code', 'feature_date',
            'lag_1', 'lag_2', 'lag_4', 'lag_12', 'lag_52',
            'rolling_mean_7d', 'rolling_mean_14d', 'rolling_mean_30d',
            'rolling_std_7d', 'rolling_std_30d',
            'day_of_week', 'day_of_month', 'week_of_year', 'month', 'quarter',
            'is_weekend', 'is_holiday', 'promotion_active', 'days_since_promotion',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
