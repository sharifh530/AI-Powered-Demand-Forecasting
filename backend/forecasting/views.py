from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Category, Location, Product, ModelTrainingRun, Forecast, ForecastAccuracyRecord
from .serializers import (
    CategorySerializer, LocationSerializer, ProductSerializer,
    ModelTrainingRunSerializer, ForecastSerializer, ForecastAccuracyRecordSerializer
)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Category CRUD operations.
    Provides list, retrieve, create, update, and delete endpoints.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Category.objects.all()
        # Filter by parent category if provided
        parent_id = self.request.query_params.get('parent')
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        return queryset


class LocationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Location CRUD operations.
    """
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Location.objects.all()
        # Filter by location type
        location_type = self.request.query_params.get('type')
        if location_type:
            queryset = queryset.filter(location_type=location_type)
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Product CRUD operations.
    """
    queryset = Product.objects.select_related('category').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Product.objects.select_related('category').all()
        # Filter by SKU
        sku = self.request.query_params.get('sku')
        if sku:
            queryset = queryset.filter(sku__icontains=sku)
        # Filter by category
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        # Filter by lifecycle status
        lifecycle_status = self.request.query_params.get('lifecycle_status')
        if lifecycle_status:
            queryset = queryset.filter(lifecycle_status=lifecycle_status)
        return queryset


class ModelTrainingRunViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ML Model Training Run management.
    """
    queryset = ModelTrainingRun.objects.all()
    serializer_class = ModelTrainingRunSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ModelTrainingRun.objects.all()
        # Filter by architecture
        architecture = self.request.query_params.get('architecture')
        if architecture:
            queryset = queryset.filter(model_architecture=architecture)
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        # Show only champion models
        is_champion = self.request.query_params.get('is_champion')
        if is_champion is not None:
            queryset = queryset.filter(is_champion=is_champion.lower() == 'true')
        return queryset

    @action(detail=True, methods=['post'])
    def promote_to_champion(self, request, pk=None):
        """
        Promote this model to champion status and demote all others.
        """
        if not request.user.can_trigger_retraining:
            return Response(
                {"detail": "You do not have permission to promote models."},
                status=status.HTTP_403_FORBIDDEN
            )

        model_run = self.get_object()
        # Demote all current champions
        ModelTrainingRun.objects.filter(is_champion=True).update(is_champion=False)
        # Promote this model
        model_run.is_champion = True
        model_run.save()

        return Response({
            "message": f"Model {model_run.run_name} promoted to champion.",
            "model_version": model_run.model_version
        })


class ForecastViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Forecast CRUD operations and retrieval.
    """
    queryset = Forecast.objects.select_related('location', 'model_run').all()
    serializer_class = ForecastSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Forecast.objects.select_related('location', 'model_run').all()
        # Filter by SKU
        sku = self.request.query_params.get('sku')
        if sku:
            queryset = queryset.filter(sku__icontains=sku)
        # Filter by location
        location_id = self.request.query_params.get('location')
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        # Filter by forecast date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(forecast_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(forecast_date__lte=end_date)
        # Filter by horizon
        horizon = self.request.query_params.get('horizon')
        if horizon:
            queryset = queryset.filter(forecast_horizon=horizon)
        return queryset

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Get the latest forecast for each SKU-location combination.
        """
        sku = request.query_params.get('sku')
        location_id = request.query_params.get('location')

        if not sku or not location_id:
            return Response(
                {"detail": "Both 'sku' and 'location' parameters are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        latest_forecast = Forecast.objects.filter(
            sku=sku, location_id=location_id
        ).order_by('-generated_at').first()

        if not latest_forecast:
            return Response(
                {"detail": "No forecast found for this SKU and location."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(latest_forecast)
        return Response(serializer.data)


class ForecastAccuracyRecordViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Forecast Accuracy tracking (read-only).
    """
    queryset = ForecastAccuracyRecord.objects.select_related('location', 'forecast').all()
    serializer_class = ForecastAccuracyRecordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ForecastAccuracyRecord.objects.select_related('location', 'forecast').all()
        # Filter by SKU
        sku = self.request.query_params.get('sku')
        if sku:
            queryset = queryset.filter(sku__icontains=sku)
        # Filter by location
        location_id = self.request.query_params.get('location')
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(forecast_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(forecast_date__lte=end_date)
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get summary statistics of forecast accuracy.
        """
        from django.db.models import Avg, Count

        queryset = self.get_queryset()
        summary = queryset.aggregate(
            avg_absolute_error=Avg('absolute_error'),
            avg_percentage_error=Avg('percentage_error'),
            total_records=Count('id')
        )

        return Response(summary)
