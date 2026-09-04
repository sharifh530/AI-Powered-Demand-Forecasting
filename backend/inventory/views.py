from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import InventorySnapshot
from .serializers import InventorySnapshotSerializer


class InventorySnapshotViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Inventory Snapshot CRUD operations.
    """
    queryset = InventorySnapshot.objects.select_related('location').all()
    serializer_class = InventorySnapshotSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = InventorySnapshot.objects.select_related('location').all()
        # Filter by SKU
        sku = self.request.query_params.get('sku')
        if sku:
            queryset = queryset.filter(sku__icontains=sku)
        # Filter by location
        location_id = self.request.query_params.get('location')
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        # Filter by snapshot date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(snapshot_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(snapshot_date__lte=end_date)
        return queryset

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """
        Get the latest inventory snapshot for each SKU-location combination.
        """
        sku = request.query_params.get('sku')
        location_id = request.query_params.get('location')

        if not sku or not location_id:
            return Response(
                {"detail": "Both 'sku' and 'location' parameters are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        latest_snapshot = InventorySnapshot.objects.filter(
            sku=sku, location_id=location_id
        ).order_by('-snapshot_date').first()

        if not latest_snapshot:
            return Response(
                {"detail": "No inventory snapshot found for this SKU and location."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(latest_snapshot)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def low_stock_alerts(self, request):
        """
        Get inventory snapshots where stock_on_hand is below reorder_point.
        """
        from django.db.models import F

        queryset = InventorySnapshot.objects.filter(
            stock_on_hand__lt=F('reorder_point')
        ).select_related('location').order_by('-snapshot_date')

        # Apply filters if provided
        location_id = request.query_params.get('location')
        if location_id:
            queryset = queryset.filter(location_id=location_id)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
