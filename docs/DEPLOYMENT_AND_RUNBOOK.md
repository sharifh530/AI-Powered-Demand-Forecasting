# Deployment Guide & Operational Runbook

**Document Version:** 1.0  
**Platform:** AI-Powered Demand Forecasting Platform  
**Date:** September 4, 2026  

---

## 1. System Requirements & Prerequisites

### 1.1 Backend & ML Environment
- **Python:** 3.10 to 3.14
- **Frameworks:** Django 5.x, Django REST Framework 3.15+, django-cors-headers
- **Machine Learning:** TensorFlow 2.x, NumPy, Pandas, Scikit-learn, SciPy
- **Database:** PostgreSQL 14+ (or SQLite 3 for local development/testing)

### 1.2 Frontend Environment
- **Node.js:** v18.0+ (Tested on v24.20.0)
- **Package Manager:** npm 9+ (Tested on 11.19.0)
- **UI Libraries:** React 18+, Vite, Tailwind CSS, Lucide React, Recharts

---

## 2. Local Setup & Development Quickstart

### 2.1 Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Seed sample data (24+ months of sales, inventory, models, and forecasts)
python manage.py seed_data --years=2 --skus=20

# Run development server
python manage.py runserver 8000
```

### 2.2 Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install node dependencies
npm install

# Start Vite dev server
npm run dev
```
The React dashboard will be accessible at `http://localhost:5173`.

---

## 3. Production Deployment Architecture (Docker & Cloud)

### 3.1 Docker Compose Multi-Container Stack
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: demand_forecasting
      POSTGRES_USER: forecast_app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    command: gunicorn demand_forecast_core.wsgi:application --bind 0.0.0.0:8000 --workers 4
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgres://forecast_app:${DB_PASSWORD}@postgres:5432/demand_forecasting
      - SECRET_KEY=${SECRET_KEY}
      - DEBUG=False
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 4. Scheduled Jobs & Cron Automation

| Job Name | Frequency | Target / Command | Purpose |
|----------|-----------|------------------|---------|
| `ingest_daily_sales` | Daily @ 01:00 UTC | `python manage.py run_ingestion --type=sales` | Pulls POS/ERP sales transactions |
| `ingest_daily_inventory` | Daily @ 01:30 UTC | `python manage.py run_ingestion --type=inventory` | Updates warehouse & store balances |
| `compute_features` | Daily @ 02:00 UTC | `python manage.py compute_features` | Recalculates rolling lags & statistics |
| `generate_daily_forecasts`| Daily @ 03:00 UTC | `python manage.py run_inference --horizon=12` | Computes future 12-week forecasts |
| `evaluate_accuracy` | Weekly (Sunday @ 04:00 UTC) | `python manage.py evaluate_accuracy` | Computes MAPE/WAPE against actuals |
| `retrain_champion_models` | Monthly (1st @ 00:00 UTC) | `python manage.py retrain_models` | Retrains LSTM/GRU models with latest data |

---

## 5. Troubleshooting & Runbook

### Issue 1: High MAPE / Forecast Drift
- **Symptoms:** Forecast accuracy degrades beyond 25% MAPE.
- **Remediation:**
  1. Inspect `IngestionLog` for missing sales data or schema mismatches.
  2. Verify if a sudden exogenous shock (e.g., unexpected promotion, supply disruption) occurred.
  3. Trigger an on-demand model retraining via the Admin interface or CLI: `python manage.py retrain_models --force`.

### Issue 2: Pipeline Ingestion Failure
- **Symptoms:** Dashboard shows stale data warning.
- **Remediation:**
  1. Check backend logs: `docker logs backend --tail 100`.
  2. Inspect failed records in `ingestion_logs` table.
  3. Re-run ingestion in dry-run mode: `python manage.py run_ingestion --dry-run`.

---

*End of Deployment Guide*
