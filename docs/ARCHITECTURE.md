# AI-Powered Demand Forecasting Platform - System Architecture

**Document Version:** 1.0  
**Date:** September 4, 2026  
**Status:** Approved Technical Design  

---

## 1. Architecture Overview

The AI-Powered Demand Forecasting Platform is an enterprise-grade solution engineered to generate, evaluate, and operationalize high-accuracy SKU-level demand predictions. The architecture decouples data ingestion, time-series feature engineering, machine learning model lifecycle management, REST API serving, and visual analytics into modular, independently scalable tiers.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             EXTERNAL DATA SOURCES                                │
│    ┌───────────────────┐    ┌────────────────────┐    ┌─────────────────────┐   │
│    │  ERP / POS Sales  │    │  WMS / Inventory   │    │ Product Master Data │   │
│    └─────────┬─────────┘    └──────────┬─────────┘    └──────────┬──────────┘   │
└──────────────┼─────────────────────────┼─────────────────────────┼──────────────┘
               ▼                         ▼                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      DATA INGESTION & STAGING PIPELINE                           │
│  - Automated Batch Ingestion & Validation Engine                                 │
│  - Completeness & Integrity Checks (DATA-04, DATA-05)                            │
│  - Data Quality Reporting & Error Logging (DATA-09, DATA-10)                     │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                     TIME-SERIES FEATURE ENGINEERING SERVICE                      │
│  - Aggregations (Daily / Weekly / Monthly buckets) (DATA-06)                     │
│  - Lagged Demand Features (t-1, t-2, t-4, t-8, t-12, t-52) (DATA-07)             │
│  - Rolling Statistics (7d/14d/30d moving average, standard deviation, min/max)  │
│  - Cyclical Calendar Encodings (Day-of-Week, Month, Week-of-Year)                │
│  - Exogenous Drivers: Promotions, Discounts, Holiday Calendars (DATA-08)        │
└──────────────────┬───────────────────────────────────────────┬───────────────────┘
                   ▼                                           ▼
┌─────────────────────────────────────┐     ┌──────────────────────────────────────┐
│       ML TRAINING PIPELINE          │     │        INFERENCE ENGINE              │
│ - Deep Learning Models (TensorFlow) │     │ - Batch Scheduled Inference          │
│   * LSTM Recurrent Networks         │     │ - On-Demand Forecast Generation      │
│   * GRU Networks                    │     │ - Multi-Horizon Forecasts (4/8/12 w) │
│ - Statistical Baselines             │     │ - Prediction Intervals (80% / 95%)   │
│   * Holt-Winters Exponential Smooth │     │ - Champion Model Dispatcher          │
│   * Moving Average Fallbacks        │     │ - Cold-Start / Sparse SKU Handling   │
│ - Model Registry & Evaluation       │     └──────────────────┬───────────────────┘
│   (MAPE, WAPE, RMSE, MAE)           │                        │
└──────────────────┬──────────────────┘                        │
                   ▼                                           │
┌──────────────────────────────────────────────────────────────▼───────────────────┐
│                           PERSISTENCE LAYER (PostgreSQL)                         │
│  - Products, Categories, Locations, Warehouses                                   │
│  - Raw Sales Transactions & Aggregated Demand History                            │
│  - Current & Historical Inventory Balances (Stock-on-Hand, In-Transit, Safety)    │
│  - Model Metadata, Training Runs, Hyperparameters, Version Artifacts             │
│  - Generated Forecasts, Quantile Bounds, Accuracy Tracking Records               │
│  - Ingestion Logs, System Health, Audit Trail                                    │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          DJANGO REST API BACKEND SERVICE                         │
│  - JWT & Session Authentication (AUTH-01)                                        │
│  - Role-Based Access Control (Admin, Planner, Viewer) (AUTH-02, API-05)          │
│  - Forecast Query Endpoints & Time-Series Aggregations (API-01, API-02)          │
│  - Model Metadata & Metrics Endpoints (API-03)                                   │
│  - On-Demand Model Retrain & Forecast Trigger Hooks (MODEL-05, FORECAST-06)      │
│  - Inventory Risk Assessment & Safety Stock Alerts (UI-05)                       │
│  - Data Export Engine (CSV/Excel/JSON) (API-08)                                  │
│  - OpenAPI 3.0 / Swagger Interactive Documentation (API-07)                      │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                          REACT ANALYTICS DASHBOARD                               │
│  - Executive KPI Summary (MAPE, Stockout Risk Count, Overstock Volume)           │
│  - Interactive Forecast Explorer (Historical Actuals overlaid with Forecasts)    │
│  - SKU / Category / Location Multi-Dimensional Filtering & Drill-Down            │
│  - Model Registry & Champion vs Challenger Visual Benchmark                      │
│  - Inventory Health & Risk Center with Lead-Time Reorder Guidance                │
│  - Data Pipeline Health Monitor & Quality Audit Logs                             │
│  - Role Switcher & Live Permission Demonstrator                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Specifications

### 2.1 Data Ingestion & Quality Layer (Module: DATA)
- **Role:** Pulls heterogeneous sales, inventory, and master records.
- **Validation Engine:** Validates data against predefined schema contracts:
  - Validates positive pricing, quantities, and foreign key integrity.
  - Implements forward-fill, linear interpolation, and zero-demand imputation strategies.
- **Lineage & Audit:** Every ingestion batch generates an `IngestionLog` record with total row counts, validation errors, duplicate drops, and execution durations.

### 2.2 Feature Engineering Service (Module: DATA / ML)
- Transforms irregular raw timestamps into regularized time buckets ($t \in \{\text{Daily, Weekly, Monthly}\}$).
- Computes time-lagged target variables: $y_{t-1}, y_{t-2}, y_{t-4}, y_{t-8}, y_{t-12}, y_{t-52}$.
- Generates rolling statistics over sliding windows (7-day, 14-day, 30-day means and standard deviations).
- Adds calendar features using sine/cosine cyclical encoding for day-of-week, day-of-month, and month-of-year.
- Maps external covariates: promotional discounts, campaign types, and national/regional holidays.

### 2.3 Machine Learning Pipeline (Module: MODEL & FORECAST)
- **TensorFlow Engine:**
  - **LSTM Model:** Stacked Long Short-Term Memory network with Dropout (0.2) to prevent overfitting on non-stationary retail trends.
  - **GRU Model:** Gated Recurrent Unit network for high-efficiency sequential modeling.
  - **Quantile / Uncertainty Head:** Generates lower bound (10th percentile / $P_{10}$) and upper bound (90th percentile / $P_{90}$) prediction intervals.
- **Statistical Fallback Engine:**
  - Double and Triple Exponential Smoothing (Holt-Winters) for items with seasonal continuity.
  - Simple Moving Average (SMA) and Croston's intermittent demand estimator for sparse or newly introduced SKUs ($< 26$ weeks of data).
- **Model Registry & Champion Selection:**
  - Automatically evaluates models against holdout validation splits on MAPE, WAPE, RMSE, and MAE.
  - Flags the top performer as the active `Champion` for inference serving.

### 2.4 Django REST API Framework (Module: API & AUTH)
- Built on Python 3.14 + Django 5 + Django REST Framework.
- Employs decoupled application architecture:
  - `accounts`: User authentication, role enforcement (`Admin`, `Planner`, `Viewer`), session tokens.
  - `forecasting`: Forecast generation, time-series retrieval, model registry management.
  - `inventory`: Stock level tracking, reorder point calculation, stockout/overstock risk analytics.
  - `ingestion`: Data pipeline management, CSV uploads, automated validation logs.
  - `analytics`: Executive KPI summaries, accuracy metrics, export handlers.

### 2.5 React Dashboard (Module: UI)
- Built with React, Vite, Tailwind CSS, Lucide icons, and Recharts.
- Implements responsive data visualization:
  - Dual-axis charts overlaying historical demand with projected forecasts.
  - Shaded confidence bands illustrating forecast uncertainty.
  - Inventory depletion curves matching lead-time to projected stockouts.
  - Role-aware action triggers (e.g., retrain model buttons hidden from Viewers).

---

## 3. Data Flow & Sequence Diagram

```
Planner / User         React Dashboard            Django API              ML Engine           PostgreSQL
      │                       │                       │                       │                    │
      │ ── 1. Select SKU ───▶ │                       │                       │                    │
      │    & Horizon          │ ── 2. GET /forecasts ─▶                       │                    │
      │                       │       (with filters)  │ ── 3. Query DB ───────┼──────────────────▶ │
      │                       │                       │ ◀─ 4. Return Series ──┼─────────────────── │
      │                       │ ◀─ 5. Render Chart ── │                       │                    │
      │                       │                       │                       │                    │
      │ ── 6. Trigger Retrain ▶                       │                       │                    │
      │    (Admin only)       │ ── 7. POST /retrain ─▶│                       │                    │
      │                       │                       │ ── 8. Execute Train ─▶│                    │
      │                       │                       │                       │ ── 9. Fetch Data ─▶│
      │                       │                       │                       │ ◀─ 10. Raw Data ── │
      │                       │                       │                       │ ── 11. Train/Eval ─│
      │                       │                       │ ◀─ 12. New Metrics ── │ ── 12. Save Model ─▶
      │                       │ ◀─ 13. Status 200 OK ─│                       │                    │
      │ ◀─ 14. Toast Alert ── │                       │                       │                    │
```

---

## 4. Security & Non-Functional Architecture

| Category | Implementation Strategy |
|----------|--------------------------|
| **Authentication** | Token-based authentication with bcrypt password hashing; session expiry enforcement. |
| **Authorization** | Declarative Django permission classes (`IsAdminRole`, `IsPlannerOrAdminRole`, `IsViewerRole`). |
| **Data Protection** | Prepared SQL statements via Django ORM (SQLi protection), CORS headers, CSRF protection, input sanitization. |
| **Performance** | Database indexing on `(sku, location, date)` composite keys; p95 latency $< 250\text{ms}$. |
| **High Availability** | Stateless API containers; database replication support; decoupled asynchronous ML tasks. |
| **Observability** | Structured logging for all data ingestion batches, model training epochs, and forecast inferences. |
