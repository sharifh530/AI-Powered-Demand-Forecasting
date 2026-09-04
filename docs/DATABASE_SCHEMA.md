# Database Schema Design

**Document Version:** 1.0  
**Date:** September 4, 2026  
**Database:** PostgreSQL 14+  

---

## 1. Schema Overview

The database is organized into six logical domains:
1. **Master Data** — Products, Categories, Locations
2. **Historical Data** — Sales Transactions, Inventory Records
3. **Feature Store** — Engineered Time-Series Features
4. **Model Registry** — Training Runs, Model Versions, Hyperparameters
5. **Forecasts** — Predictions, Confidence Intervals, Accuracy Tracking
6. **System Metadata** — Ingestion Logs, User Management, Audit Trail

---

## 2. Core Tables

### 2.1 Master Data Domain

#### `products`
Product master catalog with hierarchical categorization.

```sql
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    unit_cost DECIMAL(10, 2),
    unit_price DECIMAL(10, 2),
    lifecycle_status VARCHAR(50) DEFAULT 'active',
    attributes JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(lifecycle_status);
```

#### `categories`
Hierarchical product categorization (supports multi-level).

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    parent_category_id INTEGER REFERENCES categories(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_parent ON categories(parent_category_id);
```

#### `locations`
Stores, warehouses, or distribution centers.

```sql
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    location_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location_type VARCHAR(50) CHECK (location_type IN ('store', 'warehouse', 'dc')),
    region VARCHAR(100),
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_locations_code ON locations(location_code);
CREATE INDEX idx_locations_region ON locations(region);
```

---

### 2.2 Historical Data Domain

#### `sales_transactions`
Raw sales transaction records ingested from POS/ERP.

```sql
CREATE TABLE sales_transactions (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(100) NOT NULL,
    location_id INTEGER REFERENCES locations(id),
    transaction_date DATE NOT NULL,
    quantity_sold INTEGER NOT NULL CHECK (quantity_sold >= 0),
    unit_price DECIMAL(10, 2),
    total_revenue DECIMAL(12, 2),
    promotion_flag BOOLEAN DEFAULT FALSE,
    ingestion_batch_id INTEGER REFERENCES ingestion_logs(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_sku_location_date ON sales_transactions(sku, location_id, transaction_date);
CREATE INDEX idx_sales_date ON sales_transactions(transaction_date DESC);
CREATE INDEX idx_sales_batch ON sales_transactions(ingestion_batch_id);
```

#### `inventory_snapshots`
Daily inventory position snapshots.

```sql
CREATE TABLE inventory_snapshots (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(100) NOT NULL,
    location_id INTEGER REFERENCES locations(id),
    snapshot_date DATE NOT NULL,
    stock_on_hand INTEGER NOT NULL CHECK (stock_on_hand >= 0),
    stock_in_transit INTEGER DEFAULT 0,
    reorder_point INTEGER,
    safety_stock INTEGER,
    ingestion_batch_id INTEGER REFERENCES ingestion_logs(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (sku, location_id, snapshot_date)
);

CREATE INDEX idx_inventory_sku_location_date ON inventory_snapshots(sku, location_id, snapshot_date DESC);
```

#### `demand_history_aggregated`
Pre-aggregated demand by time bucket (daily/weekly/monthly).

```sql
CREATE TABLE demand_history_aggregated (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(100) NOT NULL,
    location_id INTEGER REFERENCES locations(id),
    time_bucket VARCHAR(20) CHECK (time_bucket IN ('daily', 'weekly', 'monthly')),
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    total_quantity_sold INTEGER NOT NULL,
    total_revenue DECIMAL(12, 2),
    avg_unit_price DECIMAL(10, 2),
    promotion_days INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (sku, location_id, time_bucket, period_start_date)
);

CREATE INDEX idx_demand_agg_sku_loc_bucket ON demand_history_aggregated(sku, location_id, time_bucket, period_start_date DESC);
```

---

### 2.3 Feature Store Domain

#### `time_series_features`
Engineered features for ML model training and inference.

```sql
CREATE TABLE time_series_features (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(100) NOT NULL,
    location_id INTEGER REFERENCES locations(id),
    feature_date DATE NOT NULL,
    
    -- Lagged demand features
    demand_lag_1 DECIMAL(10, 2),
    demand_lag_2 DECIMAL(10, 2),
    demand_lag_4 DECIMAL(10, 2),
    demand_lag_8 DECIMAL(10, 2),
    demand_lag_12 DECIMAL(10, 2),
    demand_lag_52 DECIMAL(10, 2),
    
    -- Rolling statistics
    rolling_mean_7d DECIMAL(10, 2),
    rolling_mean_14d DECIMAL(10, 2),
    rolling_mean_30d DECIMAL(10, 2),
    rolling_std_7d DECIMAL(10, 2),
    rolling_std_30d DECIMAL(10, 2),
    
    -- Calendar features
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    week_of_year INTEGER CHECK (week_of_year BETWEEN 1 AND 53),
    month INTEGER CHECK (month BETWEEN 1 AND 12),
    quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
    is_weekend BOOLEAN,
    is_holiday BOOLEAN DEFAULT FALSE,
    
    -- Exogenous signals
    promotion_active BOOLEAN DEFAULT FALSE,
    price_discount_pct DECIMAL(5, 2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (sku, location_id, feature_date)
);

CREATE INDEX idx_features_sku_location_date ON time_series_features(sku, location_id, feature_date DESC);
```

---

### 2.4 Model Registry Domain

#### `model_training_runs`
Metadata for each training execution.

```sql
CREATE TABLE model_training_runs (
    id SERIAL PRIMARY KEY,
    run_name VARCHAR(255),
    model_architecture VARCHAR(100) CHECK (model_architecture IN ('lstm', 'gru', 'holt_winters', 'moving_average')),
    training_start_time TIMESTAMP NOT NULL,
    training_end_time TIMESTAMP,
    status VARCHAR(50) CHECK (status IN ('running', 'completed', 'failed')),
    
    -- Training configuration
    hyperparameters JSONB,
    data_start_date DATE,
    data_end_date DATE,
    train_test_split_date DATE,
    
    -- Evaluation metrics
    mape DECIMAL(10, 4),
    wape DECIMAL(10, 4),
    rmse DECIMAL(10, 4),
    mae DECIMAL(10, 4),
    
    -- Model versioning
    model_version VARCHAR(50),
    is_champion BOOLEAN DEFAULT FALSE,
    model_artifact_path TEXT,
    
    triggered_by VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_training_status ON model_training_runs(status);
CREATE INDEX idx_training_time ON model_training_runs(training_start_time DESC);
CREATE INDEX idx_champion_model ON model_training_runs(is_champion) WHERE is_champion = TRUE;
```

---

### 2.5 Forecasts Domain

#### `forecasts`
Generated demand predictions with confidence intervals.

```sql
CREATE TABLE forecasts (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(100) NOT NULL,
    location_id INTEGER REFERENCES locations(id),
    forecast_date DATE NOT NULL,
    forecast_horizon INTEGER NOT NULL,
    
    -- Predictions
    predicted_demand DECIMAL(10, 2) NOT NULL,
    lower_bound DECIMAL(10, 2),
    upper_bound DECIMAL(10, 2),
    confidence_level DECIMAL(5, 2) DEFAULT 90.0,
    
    -- Metadata
    model_training_run_id INTEGER REFERENCES model_training_runs(id),
    model_version VARCHAR(50),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE (sku, location_id, forecast_date, forecast_horizon)
);

CREATE INDEX idx_forecasts_sku_location_date ON forecasts(sku, location_id, forecast_date);
CREATE INDEX idx_forecasts_model_run ON forecasts(model_training_run_id);
CREATE INDEX idx_forecasts_generated ON forecasts(generated_at DESC);
```

#### `forecast_accuracy_tracking`
Tracks forecast vs. actuals once ground truth becomes available.

```sql
CREATE TABLE forecast_accuracy_tracking (
    id BIGSERIAL PRIMARY KEY,
    forecast_id BIGINT REFERENCES forecasts(id),
    sku VARCHAR(100) NOT NULL,
    location_id INTEGER REFERENCES locations(id),
    forecast_date DATE NOT NULL,
    
    predicted_demand DECIMAL(10, 2) NOT NULL,
    actual_demand DECIMAL(10, 2) NOT NULL,
    absolute_error DECIMAL(10, 2),
    percentage_error DECIMAL(10, 4),
    
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accuracy_sku_location ON forecast_accuracy_tracking(sku, location_id, forecast_date);
CREATE INDEX idx_accuracy_eval_time ON forecast_accuracy_tracking(evaluated_at DESC);
```

---

### 2.6 System Metadata Domain

#### `ingestion_logs`
Audit trail for data pipeline executions.

```sql
CREATE TABLE ingestion_logs (
    id SERIAL PRIMARY KEY,
    ingestion_type VARCHAR(50) CHECK (ingestion_type IN ('sales', 'inventory', 'products', 'promotions')),
    execution_start TIMESTAMP NOT NULL,
    execution_end TIMESTAMP,
    status VARCHAR(50) CHECK (status IN ('running', 'success', 'failed')),
    
    total_records_processed INTEGER,
    records_inserted INTEGER,
    records_updated INTEGER,
    records_failed INTEGER,
    
    validation_errors JSONB,
    error_message TEXT,
    triggered_by VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ingestion_type_time ON ingestion_logs(ingestion_type, execution_start DESC);
CREATE INDEX idx_ingestion_status ON ingestion_logs(status);
```

#### `users`
Application user accounts.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'planner', 'viewer')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### `audit_trail`
System-wide audit log for sensitive operations.

```sql
CREATE TABLE audit_trail (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id INTEGER,
    changes JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON audit_trail(user_id, created_at DESC);
CREATE INDEX idx_audit_entity ON audit_trail(entity_type, entity_id);
```

---

## 3. Indexing Strategy

### Composite Indexes for Query Performance

```sql
-- High-frequency time-series queries
CREATE INDEX idx_sales_compound ON sales_transactions(sku, location_id, transaction_date DESC);
CREATE INDEX idx_inventory_compound ON inventory_snapshots(sku, location_id, snapshot_date DESC);
CREATE INDEX idx_forecasts_compound ON forecasts(sku, location_id, forecast_date DESC);

-- Dashboard aggregation queries
CREATE INDEX idx_forecasts_horizon ON forecasts(forecast_horizon, generated_at DESC);
CREATE INDEX idx_accuracy_period ON forecast_accuracy_tracking(forecast_date DESC, percentage_error);
```

---

## 4. Data Retention & Archival Policy

| Table | Retention Policy | Archive Strategy |
|-------|------------------|------------------|
| `sales_transactions` | 36 months hot | Partition by month, archive to cold storage |
| `inventory_snapshots` | 24 months hot | Partition by quarter |
| `forecasts` | 12 months hot | Delete after accuracy evaluation complete |
| `forecast_accuracy_tracking` | Indefinite | Summarize to monthly aggregates after 24 months |
| `ingestion_logs` | 90 days | Archive to object storage |
| `audit_trail` | 12 months hot | Per compliance requirements |

---

## 5. Partitioning Strategy (Performance Optimization)

For large-scale deployments, partition high-volume tables by time:

```sql
-- Example: Partition sales_transactions by month
CREATE TABLE sales_transactions (
    -- columns as above
) PARTITION BY RANGE (transaction_date);

CREATE TABLE sales_transactions_2024_01 PARTITION OF sales_transactions
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE sales_transactions_2024_02 PARTITION OF sales_transactions
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
-- Continue for each month...
```

---

## 6. Materialized Views for Dashboard Performance

```sql
-- SKU-level forecast accuracy summary
CREATE MATERIALIZED VIEW mv_sku_forecast_accuracy AS
SELECT 
    sku,
    location_id,
    DATE_TRUNC('week', forecast_date) AS forecast_week,
    COUNT(*) AS forecast_count,
    AVG(percentage_error) AS avg_mape,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY percentage_error) AS median_error
FROM forecast_accuracy_tracking
GROUP BY sku, location_id, DATE_TRUNC('week', forecast_date);

CREATE UNIQUE INDEX ON mv_sku_forecast_accuracy(sku, location_id, forecast_week);

-- Refresh schedule: daily after forecast generation
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_sku_forecast_accuracy;
```

---

*End of Database Schema Design*
