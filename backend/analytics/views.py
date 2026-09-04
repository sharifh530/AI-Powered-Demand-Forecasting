from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import DemandHistoryAggregated, TimeSeriesFeatures
from .serializers import DemandHistoryAggregatedSerializer, TimeSeriesFeaturesSerializer


class DemandHistoryAggregatedViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Aggregated Demand History (read-only).
    """
    queryset = DemandHistoryAggregated.objects.select_related('location').all()
    serializer_class = DemandHistoryAggregatedSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = DemandHistoryAggregated.objects.select_related('location').all()
        # Filter by SKU
        sku = self.request.query_params.get('sku')
        if sku:
            queryset = queryset.filter(sku__icontains=sku)
        # Filter by location
        location_id = self.request.query_params.get('location')
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        # Filter by aggregation level
        aggregation_level = self.request.query_params.get('level')
        if aggregation_level:
            queryset = queryset.filter(aggregation_level=aggregation_level)
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(period_start_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(period_start_date__lte=end_date)
        return queryset


class TimeSeriesFeaturesViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Time Series Features (read-only).
    """
    queryset = TimeSeriesFeatures.objects.select_related('location').all()
    serializer_class = TimeSeriesFeaturesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = TimeSeriesFeatures.objects.select_related('location').all()
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
            queryset = queryset.filter(feature_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(feature_date__lte=end_date)
        return queryset
