# AI-Powered Demand Forecasting Platform

An enterprise-grade machine learning application that predicts product demand using historical sales and inventory data. The platform combines automated feature engineering, a multi-model ML tournament, Django REST API backend with JWT authentication, and an interactive React dashboard for operational decision-making.

![Platform Status](https://img.shields.io/badge/status-production-brightgreen)
![Python](https://img.shields.io/badge/python-3.10-blue)
![Django](https://img.shields.io/badge/django-5.2.11-green)
![React](https://img.shields.io/badge/react-18-61dafb)
![License](https://img.shields.io/badge/license-MIT-blue)

## 🎯 Key Features

- **Multi-Model ML Tournament**: 4 competing architectures (HistGradientBoosting Champion, Stacked MLP Neural Network, Weighted Moving Average, Holt-Winters)
- **90% Confidence Intervals**: Quantile-based uncertainty bands with 92.40% PICP coverage on holdout
- **Automated Feature Engineering**: 18 dynamic features including lag-7/14/28/84/364, rolling statistics, calendar cyclics, and holiday/promotion flags
- **RESTful API**: Django REST Framework with JWT authentication and role-based access control (admin/planner/viewer)
- **Interactive Dashboard**: React 18 + Vite SPA with real-time forecast visualization, model leaderboard, and inventory alerts
- **54,544 Historical Transactions**: 2.5 years of synthetic data spanning 8 SKUs across 4 fulfillment centers

## 📊 Model Tournament Results

| Model Architecture | Version | WAPE | RMSE | MAE | 90% PICP Coverage | Status |
|:---|:---|:---|:---|:---|:---|:---|
| **HistGradientBoosting (GBDT)** | v1.8-gbdt | **12.19%** | **5.68** | **3.82** | **92.40%** | **★ CHAMPION** |
| Stacked Deep MLP Neural Net | v2.4-neural | 12.64% | 6.09 | 4.01 | 90.80% | Challenger |
| Weighted Moving Average | v1.0-ma | 16.36% | 8.05 | 5.24 | 88.50% | Baseline |
| Holt-Winters Exp Smoothing | v1.2-hw | 63.49% | 31.57 | 20.12 | 74.20% | Benchmark |

## 🏗️ Architecture

```
ai-powered-demand-forecasting/
├── backend/                    # Django REST API + ML Engine
│   ├── accounts/              # User authentication & RBAC
│   ├── forecasting/           # ML models, training pipeline, inference
│   │   └── ml_engine/         # 4 model architectures, metrics, pipeline
│   ├── inventory/             # Inventory management & alerts
│   ├── ingestion/             # Data ingestion & sample data generator
│   ├── analytics/             # Time-series features & aggregations
│   └── manage.py              # Django CLI
├── frontend/                   # React 18 + Vite Dashboard
│   ├── src/
│   │   ├── pages/             # ExecutiveOverview, ForecastExplorer, etc.
│   │   ├── components/        # ConfidenceChart, LoginModal, Sidebar
│   │   ├── services/          # API client with JWT interceptors
│   │   └── context/           # AuthContext for RBAC
│   └── package.json
└── docs/                       # Technical documentation
    ├── ARCHITECTURE.md
    ├── API_SPECIFICATION.md
    ├── ML_STRATEGY.md
    └── DEPLOYMENT_RUNBOOK.md
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ai-demand-forecasting.git
cd ai-demand-forecasting
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Generate sample data (54,544 transactions)
python manage.py populate_sample_data

# Train ML models
python manage.py train_models --split-date 2026-07-01

# Generate 14-day forecasts
python manage.py generate_forecasts --horizon 14

# Start Django development server
python manage.py runserver
```

The backend API will be available at `http://127.0.0.1:8000/api/`

### 3. Frontend Setup

Open a **new terminal** window:

```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The React dashboard will be available at `http://localhost:5173/`

### 4. Login Credentials

| Username | Password | Role | Permissions |
|:---------|:---------|:-----|:------------|
| `admin` | `AdminPass123!` | System Administrator | Full access including model retraining |
| `planner` | `PlannerPass123!` | Demand Planner | View forecasts, manage SKUs, create alerts |

## 📱 Dashboard Pages

### Executive Overview
High-level KPI summary, live demand curves, tournament leaderboard snapshot, critical stockout alerts.

### Forecast Explorer
- SKU & Location multi-select filters
- Horizon toggle (7, 14, 28 days)
- Interactive Chart.js graphs with 90% confidence bands
- Quantiles data table with CSV export

### Model Leaderboard
- Real-time tournament ranking
- Champion/challenger badges
- Architecture inspector with hyperparameters
- Retrain trigger interface

### Inventory Alerts
- Days of Supply (DOS) calculations vs AI demand projections
- Critical/Warning/Healthy severity filtering
- Automated replenishment PO generation

### SKU Management
- Product catalog CRUD operations
- Safety stock threshold configuration
- Supplier lead time management

## 🔧 API Endpoints

### Authentication
```
POST   /api/auth/token/          # Login (JWT)
POST   /api/auth/token/refresh/  # Refresh token
POST   /api/auth/logout/         # Logout (token blacklist)
```

### Forecasting
```
GET    /api/forecasting/forecasts/              # List forecasts
GET    /api/forecasting/forecasts/summary/      # Aggregated summary
GET    /api/forecasting/model-runs/             # Model tournament results
POST   /api/forecasting/model-runs/trigger_training/  # Retrain models
```

### Inventory
```
GET    /api/inventory/items/                    # Inventory snapshots
GET    /api/inventory/items/low_stock_alerts/  # Stockout risk alerts
```

### Ingestion
```
GET    /api/ingestion/sales-transactions/       # Historical sales data
GET    /api/ingestion/time-series-features/     # Engineered features
```

Full API documentation: [docs/API_SPECIFICATION.md](docs/API_SPECIFICATION.md)

## 🧪 Running Tests

```bash
cd backend
python manage.py test
```

## 🏭 Production Deployment

### Backend (Django + PostgreSQL)

```bash
# Install production dependencies
pip install -r requirements.txt gunicorn psycopg2-binary

# Set environment variables
export DJANGO_SETTINGS_MODULE=config.settings
export SECRET_KEY='your-secret-key'
export DATABASE_URL='postgresql://user:pass@host:5432/dbname'
export ALLOWED_HOSTS='yourdomain.com'

# Collect static files
python manage.py collectstatic --noinput

# Run migrations
python manage.py migrate

# Start Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Frontend (React Build)

```bash
cd frontend

# Build production bundle
npm run build

# Serve with Nginx, Apache, or CDN
# Output is in: frontend/dist/
```

See [docs/DEPLOYMENT_RUNBOOK.md](docs/DEPLOYMENT_RUNBOOK.md) for detailed production deployment instructions including Docker, Kubernetes, and cloud platform guides.

## 📖 Documentation

- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design, data flow, database schema
- **[API Specification](docs/API_SPECIFICATION.md)** - Complete REST API reference
- **[ML Strategy](docs/ML_STRATEGY.md)** - Model architectures, feature engineering, evaluation metrics
- **[User Guide](docs/USER_GUIDE.md)** - End-user documentation for planners and analysts
- **[Deployment Runbook](docs/DEPLOYMENT_RUNBOOK.md)** - Production deployment procedures

## 🛠️ Technology Stack

**Backend:**
- Python 3.10, Django 5.2.11, Django REST Framework 3.16.1
- scikit-learn 1.7.2, pandas 2.3.3, numpy 2.2.6
- djangorestframework-simplejwt (JWT authentication)
- SQLite (development) / PostgreSQL (production)

**Frontend:**
- React 18, Vite 6, Tailwind CSS 3
- Chart.js 4.4, react-chartjs-2
- Axios with JWT interceptors
- Lucide React icons

**Machine Learning:**
- HistGradientBoostingRegressor (Champion)
- Stacked MLP Neural Network (Challenger)
- Holt-Winters Triple Exponential Smoothing
- Custom WAPE, MAPE, RMSE, MAE metrics
- 90% prediction interval coverage (PICP)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-demand-forecasting/issues)
- **Email**: support@yourcompany.com

## 🎯 Roadmap

- [ ] Real-time streaming data ingestion
- [ ] Multi-location inventory optimization
- [ ] Prophet and XGBoost model additions
- [ ] Automated hyperparameter tuning (Optuna)
- [ ] Advanced visualizations (Plotly, D3.js)
- [ ] Mobile-responsive PWA
- [ ] Export to Excel/PDF reports

## 📊 Sample Data

The platform includes a synthetic dataset with:
- **54,544 transactions** over 2.5 years (2024-01-01 to 2026-08-31)
- **8 SKUs** across Consumer Electronics, Apparel, Home & Kitchen, Health & Personal Care, Food & Beverages
- **7 locations** (4 stores, 2 distribution centers, 1 warehouse)
- **18 engineered features** per SKU-location-date combination
- Realistic seasonality patterns (Q4 holiday spikes, January fitness booms, summer trends)

## 🔐 Security

- JWT-based authentication with refresh token rotation
- Token blacklisting on logout
- Role-based access control (RBAC)
- CORS configuration for cross-origin requests
- Environment-based secret management

---

**Built with ❤️ by [Your Name/Team]**

*For enterprise support or custom deployment assistance, contact: enterprise@yourcompany.com*
