# API Specification

**Document Version:** 1.0  
**Date:** September 4, 2026  
**Base URL:** `/api/v1/`  
**Authentication:** JWT Bearer Token  

---

## 1. Authentication Endpoints

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "planner"
}
```

**Response:** 201 Created
```json
{
  "id": 1,
  "username": "john_planner",
  "email": "john@company.com",
  "role": "planner",
  "created_at": "2026-09-04T12:00:00Z"
}
```

### POST /auth/login
Authenticate and receive JWT token.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:** 200 OK
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_planner",
    "role": "planner"
  }
}
```

### POST /auth/refresh
Refresh expired access token.

**Request Body:**
```json
{
  "refresh_token": "string"
}
```

**Response:** 200 OK
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. Forecast Endpoints

### GET /forecasts/
Retrieve forecasts with filtering.

**Query Parameters:**
- `sku` (optional): Filter by product SKU
- `location_id` (optional): Filter by location
- `start_date` (optional): ISO date (YYYY-MM-DD)
- `end_date` (optional): ISO date
- `horizon` (optional): Forecast horizon (4, 8, 12 weeks)
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Results per page (default: 50, max: 200)

**Response:** 200 OK
```json
{
  "count": 1250,
  "next": "/api/v1/forecasts/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1001,
      "sku": "SKU-12345",
      "product_name": "Widget Pro 3000",
      "location_id": 5,
      "location_name": "Warehouse East",
      "forecast_date": "2026-09-11",
      "forecast_horizon": 8,
      "predicted_demand": 145.32,
      "lower_bound": 120.15,
      "upper_bound": 175.89,
      "confidence_level": 90.0,
      "model_version": "v1.2.3-lstm",
      "generated_at": "2026-09-04T06:00:00Z"
    }
  ]
}
```

### GET /forecasts/{id}/
Retrieve a specific forecast by ID.

**Response:** 200 OK
```json
{
  "id": 1001,
  "sku": "SKU-12345",
  "product_name": "Widget Pro 3000",
  "category": "Electronics",
  "location_id": 5,
  "location_name": "Warehouse East",
  "forecast_date": "2026-09-11",
  "forecast_horizon": 8,
  "predicted_demand": 145.32,
  "lower_bound": 120.15,
  "upper_bound": 175.89,
  "confidence_level": 90.0,
  "model_version": "v1.2.3-lstm",
  "model_training_run_id": 42,
  "generated_at": "2026-09-04T06:00:00Z"
}
```

### POST /forecasts/regenerate/
Trigger on-demand forecast regeneration (Admin/Planner only).

**Request Body:**
```json
{
  "sku": "SKU-12345",
  "location_id": 5,
  "horizon": 12
}
```

**Response:** 202 Accepted
```json
{
  "task_id": "abc-123-def",
  "status": "queued",
  "message": "Forecast regeneration initiated"
}
```

---

## 3. Historical Data Endpoints

### GET /sales/
Retrieve historical sales data.

**Query Parameters:**
- `sku` (optional)
- `location_id` (optional)
- `start_date` (optional)
- `end_date` (optional)
- `time_bucket` (optional): "daily", "weekly", "monthly"
- `page`, `page_size`

**Response:** 200 OK
```json
{
  "count": 5280,
  "results": [
    {
      "sku": "SKU-12345",
      "location_id": 5,
      "date": "2026-09-03",
      "quantity_sold": 142,
      "total_revenue": 2130.00,
      "avg_unit_price": 15.00,
      "promotion_flag": false
    }
  ]
}
```

### GET /inventory/
Retrieve current and historical inventory snapshots.

**Query Parameters:**
- `sku` (optional)
- `location_id` (optional)
- `snapshot_date` (optional)
- `page`, `page_size`

**Response:** 200 OK
```json
{
  "count": 3200,
  "results": [
    {
      "sku": "SKU-12345",
      "location_id": 5,
      "snapshot_date": "2026-09-04",
      "stock_on_hand": 320,
      "stock_in_transit": 50,
      "reorder_point": 150,
      "safety_stock": 75
    }
  ]
}
```

---

## 4. Model Management Endpoints

### GET /models/
List all model training runs.

**Query Parameters:**
- `status` (optional): "running", "completed", "failed"
- `is_champion` (optional): boolean
- `page`, `page_size`

**Response:** 200 OK
```json
{
  "count": 42,
  "results": [
    {
      "id": 42,
      "run_name": "lstm-weekly-retrain-2026w35",
      "model_architecture": "lstm",
      "status": "completed",
      "training_start_time": "2026-09-01T02:00:00Z",
      "training_end_time": "2026-09-01T04:32:15Z",
      "mape": 12.34,
      "wape": 10.87,
      "rmse": 23.45,
      "mae": 18.92,
      "model_version": "v1.2.3",
      "is_champion": true,
      "triggered_by": "scheduled_task"
    }
  ]
}
```

### GET /models/{id}/
Retrieve detailed model run information.

**Response:** 200 OK
```json
{
  "id": 42,
  "run_name": "lstm-weekly-retrain-2026w35",
  "model_architecture": "lstm",
  "status": "completed",
  "hyperparameters": {
    "learning_rate": 0.001,
    "lstm_units": 64,
    "dropout": 0.2,
    "epochs": 50,
    "batch_size": 32
  },
  "data_start_date": "2024-09-01",
  "data_end_date": "2026-08-31",
  "train_test_split_date": "2026-07-15",
  "mape": 12.34,
  "wape": 10.87,
  "rmse": 23.45,
  "mae": 18.92,
  "model_version": "v1.2.3",
  "is_champion": true,
  "model_artifact_path": "s3://models/lstm-v1.2.3.h5",
  "triggered_by": "scheduled_task",
  "training_start_time": "2026-09-01T02:00:00Z",
  "training_end_time": "2026-09-01T04:32:15Z"
}
```

### POST /models/retrain/
Trigger model retraining (Admin only).

**Request Body:**
```json
{
  "model_architecture": "lstm",
  "hyperparameters": {
    "learning_rate": 0.001,
    "lstm_units": 64,
    "dropout": 0.2
  },
  "force_retrain": false
}
```

**Response:** 202 Accepted
```json
{
  "task_id": "train-xyz-789",
  "status": "queued",
  "message": "Model training initiated",
  "estimated_duration_minutes": 120
}
```

---

## 5. Accuracy Tracking Endpoints

### GET /accuracy/
Retrieve forecast accuracy metrics.

**Query Parameters:**
- `sku` (optional)
- `location_id` (optional)
- `start_date` (optional)
- `end_date` (optional)
- `aggregation` (optional): "sku", "category", "location", "overall"
- `page`, `page_size`

**Response:** 200 OK
```json
{
  "count": 1500,
  "results": [
    {
      "sku": "SKU-12345",
      "location_id": 5,
      "forecast_date": "2026-08-15",
      "predicted_demand": 145.32,
      "actual_demand": 138.00,
      "absolute_error": 7.32,
      "percentage_error": 5.30,
      "evaluated_at": "2026-08-16T01:00:00Z"
    }
  ]
}
```

### GET /accuracy/summary/
Aggregate accuracy metrics.

**Query Parameters:**
- `group_by`: "sku", "category", "location", "model_version"
- `start_date` (optional)
- `end_date` (optional)

**Response:** 200 OK
```json
{
  "overall_mape": 12.45,
  "overall_wape": 10.23,
  "groups": [
    {
      "group_key": "Electronics",
      "group_name": "Electronics",
      "mape": 11.20,
      "wape": 9.85,
      "forecast_count": 1250,
      "avg_absolute_error": 15.32
    }
  ]
}
```

---

## 6. Risk Analysis Endpoints

### GET /risks/stockout/
Identify SKUs at risk of stockout.

**Query Parameters:**
- `location_id` (optional)
- `category` (optional)
- `threshold_days` (optional): Days of supply threshold (default: 7)
- `page`, `page_size`

**Response:** 200 OK
```json
{
  "count": 25,
  "results": [
    {
      "sku": "SKU-98765",
      "product_name": "Gadget Ultra",
      "location_id": 3,
      "location_name": "Store North",
      "current_stock": 35,
      "forecasted_demand_7d": 105,
      "days_of_supply": 2.3,
      "risk_level": "high",
      "recommended_reorder_quantity": 180
    }
  ]
}
```

### GET /risks/overstock/
Identify SKUs with excess inventory.

**Query Parameters:**
- `location_id` (optional)
- `category` (optional)
- `threshold_weeks` (optional): Weeks of excess supply (default: 8)
- `page`, `page_size`

**Response:** 200 OK
```json
{
  "count": 18,
  "results": [
    {
      "sku": "SKU-54321",
      "product_name": "Widget Classic",
      "location_id": 5,
      "location_name": "Warehouse East",
      "current_stock": 850,
      "forecasted_demand_30d": 120,
      "weeks_of_supply": 21.2,
      "risk_level": "medium",
      "excess_quantity": 600,
      "estimated_holding_cost": 1500.00
    }
  ]
}
```

---

## 7. Data Pipeline Endpoints

### GET /pipeline/status/
Check data pipeline health (Admin only).

**Response:** 200 OK
```json
{
  "sales_ingestion": {
    "last_run": "2026-09-04T01:00:00Z",
    "status": "success",
    "records_processed": 12500,
    "duration_seconds": 45
  },
  "inventory_ingestion": {
    "last_run": "2026-09-04T01:15:00Z",
    "status": "success",
    "records_processed": 3200,
    "duration_seconds": 18
  },
  "feature_engineering": {
    "last_run": "2026-09-04T02:00:00Z",
    "status": "success",
    "features_generated": 50000,
    "duration_seconds": 180
  },
  "forecast_generation": {
    "last_run": "2026-09-04T03:00:00Z",
    "status": "completed",
    "forecasts_generated": 15000,
    "duration_seconds": 620
  }
}
```

### GET /pipeline/logs/
Retrieve ingestion logs (Admin only).

**Query Parameters:**
- `ingestion_type` (optional): "sales", "inventory", "products"
- `status` (optional): "running", "success", "failed"
- `start_date` (optional)
- `page`, `page_size`

**Response:** 200 OK
```json
{
  "count": 250,
  "results": [
    {
      "id": 125,
      "ingestion_type": "sales",
      "execution_start": "2026-09-04T01:00:00Z",
      "execution_end": "2026-09-04T01:00:45Z",
      "status": "success",
      "total_records_processed": 12500,
      "records_inserted": 12450,
      "records_updated": 50,
      "records_failed": 0,
      "triggered_by": "scheduled_task"
    }
  ]
}
```

---

## 8. Export Endpoints

### POST /export/forecasts/
Export forecast data (Admin/Planner only).

**Request Body:**
```json
{
  "format": "csv",
  "filters": {
    "sku": "SKU-12345",
    "start_date": "2026-09-01",
    "end_date": "2026-12-31"
  }
}
```

**Response:** 202 Accepted
```json
{
  "export_id": "exp-abc-123",
  "status": "processing",
  "download_url": null
}
```

### GET /export/{export_id}/
Check export status and download.

**Response:** 200 OK
```json
{
  "export_id": "exp-abc-123",
  "status": "completed",
  "download_url": "/api/v1/download/exp-abc-123/",
  "file_size_bytes": 524288,
  "expires_at": "2026-09-05T06:00:00Z"
}
```

---

## 9. Error Responses

### 400 Bad Request
```json
{
  "error": "validation_error",
  "message": "Invalid request parameters",
  "details": {
    "start_date": ["Date format must be YYYY-MM-DD"]
  }
}
```

### 401 Unauthorized
```json
{
  "error": "authentication_required",
  "message": "Valid JWT token required"
}
```

### 403 Forbidden
```json
{
  "error": "permission_denied",
  "message": "Admin role required for this operation"
}
```

### 404 Not Found
```json
{
  "error": "not_found",
  "message": "Forecast with id 9999 not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "internal_error",
  "message": "An unexpected error occurred",
  "request_id": "req-xyz-789"
}
```

---

## 10. Rate Limiting

- **Standard users:** 1000 requests/hour
- **Admin users:** 5000 requests/hour
- **Export operations:** 10 requests/hour per user

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 847
X-RateLimit-Reset: 1693824000
```

---

*End of API Specification*
