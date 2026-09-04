from django.urls import path, include
from rest_framework.routers import DefaultRouter
from forecasting.views import (
    CategoryViewSet, LocationViewSet, ProductViewSet,
    ModelTrainingRunViewSet, ForecastViewSet, ForecastAccuracyRecordViewSet
)
from inventory.views import InventorySnapshotViewSet
from ingestion.views import IngestionLogViewSet, SalesTransactionViewSet
from analytics.views import DemandHistoryAggregatedViewSet, TimeSeriesFeaturesViewSet
from accounts.views import UserViewSet, register_user, login_user, logout_user, refresh_token

# Create routers
router = DefaultRouter()

# Forecasting routes
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'model-runs', ModelTrainingRunViewSet, basename='model-run')
router.register(r'forecasts', ForecastViewSet, basename='forecast')
router.register(r'forecast-accuracy', ForecastAccuracyRecordViewSet, basename='forecast-accuracy')

# Inventory routes
router.register(r'inventory', InventorySnapshotViewSet, basename='inventory')

# Ingestion routes
router.register(r'ingestion-logs', IngestionLogViewSet, basename='ingestion-log')
router.register(r'sales', SalesTransactionViewSet, basename='sales')

# Analytics routes
router.register(r'demand-history', DemandHistoryAggregatedViewSet, basename='demand-history')
router.register(r'time-series-features', TimeSeriesFeaturesViewSet, basename='time-series-features')

# Accounts routes
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    # Authentication endpoints
    path('api/auth/register/', register_user, name='register'),
    path('api/auth/login/', login_user, name='login'),
    path('api/auth/logout/', logout_user, name='logout'),
    path('api/auth/refresh/', refresh_token, name='token-refresh'),

    # API routes
    path('api/', include(router.urls)),
]
