from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import IngestionLog, SalesTransaction
from .serializers import IngestionLogSerializer, SalesTransactionSerializer


class IngestionLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Ingestion Log tracking (read-only).
    """
    queryset = IngestionLog.objects.select_related('triggered_by').all()
    serializer_class = IngestionLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = IngestionLog.objects.select_related('triggered_by').all()
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        # Filter by data type
        data_type = self.request.query_params.get('data_type')
        if data_type:
            queryset = queryset.filter(data_type=data_type)
        return queryset


class SalesTransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Sales Transaction CRUD operations.
    """
    queryset = SalesTransaction.objects.all()
    serializer_class = SalesTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = SalesTransaction.objects.all()
        # Filter by SKU
        sku = self.request.query_params.get('sku')
        if sku:
            queryset = queryset.filter(sku__icontains=sku)
        # Filter by location code
        location_code = self.request.query_params.get('location_code')
        if location_code:
            queryset = queryset.filter(location_code=location_code)
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)
        # Filter by promotion
        is_promotion = self.request.query_params.get('is_promotion')
        if is_promotion is not None:
            queryset = queryset.filter(is_promotion=is_promotion.lower() == 'true')
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get aggregated sales summary statistics.
        """
        from django.db.models import Sum, Avg, Count

        queryset = self.get_queryset()
        summary = queryset.aggregate(
            total_quantity=Sum('quantity_sold'),
            total_revenue=Sum('revenue'),
            avg_unit_price=Avg('unit_price'),
            total_transactions=Count('id')
        )

        return Response(summary)
