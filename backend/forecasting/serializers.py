from rest_framework import serializers
from .models import Category, Location, Product, ModelTrainingRun, Forecast, ForecastAccuracyRecord


class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'code', 'parent', 'description', 'subcategories', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return CategorySerializer(obj.subcategories.all(), many=True).data
        return []


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = [
            'id', 'location_code', 'name', 'location_type', 'region',
            'address', 'capacity_units', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'category', 'category_name', 'unit_cost', 'unit_price',
            'lead_time_days', 'min_order_qty', 'safety_stock_days', 'lifecycle_status',
            'attributes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ModelTrainingRunSerializer(serializers.ModelSerializer):
    training_duration = serializers.SerializerMethodField()

    class Meta:
        model = ModelTrainingRun
        fields = [
            'id', 'run_name', 'model_architecture', 'status', 'hyperparameters',
            'data_start_date', 'data_end_date', 'train_test_split_date',
            'mape', 'wape', 'rmse', 'mae', 'picp',
            'model_version', 'is_champion', 'model_artifact_path',
            'triggered_by', 'error_message',
            'training_start_time', 'training_end_time', 'training_duration'
        ]
        read_only_fields = ['id', 'training_start_time', 'training_duration']

    def get_training_duration(self, obj):
        if obj.training_end_time and obj.training_start_time:
            delta = obj.training_end_time - obj.training_start_time
            return str(delta)
        return None


class ForecastSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)
    location_code = serializers.CharField(source='location.location_code', read_only=True)

    class Meta:
        model = Forecast
        fields = [
            'id', 'sku', 'location', 'location_name', 'location_code',
            'forecast_date', 'forecast_horizon', 'predicted_demand',
            'lower_bound', 'upper_bound', 'confidence_level',
            'model_run', 'model_version', 'generated_at'
        ]
        read_only_fields = ['id', 'generated_at']


class ForecastAccuracyRecordSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = ForecastAccuracyRecord
        fields = [
            'id', 'forecast', 'sku', 'location', 'location_name', 'forecast_date',
            'predicted_demand', 'actual_demand', 'absolute_error',
            'percentage_error', 'evaluated_at'
        ]
        read_only_fields = ['id', 'evaluated_at']
