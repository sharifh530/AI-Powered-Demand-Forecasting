# User Guide & Operational Manual

**Platform:** AI-Powered Demand Forecasting Platform  
**Audience:** Demand Planners, Inventory Managers, Supply Chain Directors, System Administrators  
**Date:** September 4, 2026  

---

## 1. Introduction

The AI-Powered Demand Forecasting Platform empowers supply chain planners and inventory managers to make data-driven procurement and allocation decisions. By leveraging deep learning time-series models, the platform forecasts SKU-level demand up to 12 weeks in advance, highlights stockout/overstock risks, and recommends optimal reorder quantities.

---

## 2. User Roles & Capabilities

| Capability | Viewer | Demand Planner | System Admin |
|------------|:------:|:--------------:|:------------:|
| View Dashboard & Summary KPIs | ✅ | ✅ | ✅ |
| Filter & Drill-Down by SKU/Location | ✅ | ✅ | ✅ |
| View Historical Actuals vs Forecasts | ✅ | ✅ | ✅ |
| View Forecast Uncertainty Intervals | ✅ | ✅ | ✅ |
| Access Inventory Risk Warnings | ✅ | ✅ | ✅ |
| Export Forecast & Sales Data (CSV/Excel) | ❌ | ✅ | ✅ |
| Trigger On-Demand Forecast Regeneration | ❌ | ✅ | ✅ |
| Trigger Machine Learning Model Retraining | ❌ | ❌ | ✅ |
| Configure Data Sources & Ingestion Schedules | ❌ | ❌ | ✅ |
| Manage Users and Permissions | ❌ | ❌ | ✅ |

---

## 3. Navigating the Dashboard

### 3.1 Executive Overview Dashboard
- **Aggregate MAPE / WAPE:** Highlights current forecast error percentage across the enterprise catalog.
- **Stockout Risk Count:** Number of SKUs with projected demand exceeding available stock + lead-time replenishment.
- **Overstock Capital at Risk:** Total currency value tied up in inventory exceeding 8+ weeks of projected demand.
- **Total Projected Volume:** Aggregate forecast units across the selected planning horizon.

### 3.2 Interactive Forecast Explorer
1. **Filters:** Select Category, Product SKU, Location (Store or Warehouse), and Forecast Horizon (4, 8, or 12 weeks).
2. **Chart Interpretation:**
   - **Solid Blue Line:** Historical sales actuals.
   - **Dashed Green Line:** AI Predicted demand.
   - **Shaded Light Green Band:** $90\%$ Confidence Interval (Prediction bounds).
   - **Red Dotted Line:** Reorder point threshold.
3. **On-Demand Regeneration:** Click **"Regenerate Forecast"** to recalculate predictions incorporating the latest sales data.

### 3.3 Inventory Risk & Health Center
- **Stockout Alerts (Urgent):** Lists items whose Days of Supply ($\text{DoS} = \frac{\text{Current Stock}}{\text{Daily Forecast}}$) are lower than Supplier Lead Time.
- **Overstock Warnings:** Lists items with $> 8$ weeks of supply, showing estimated monthly carrying cost.
- **Recommended Action:** Click **"Generate Reorder Suggestion"** to export recommended purchase quantities.

### 3.4 Model Registry & Performance
- View active **Champion** model architecture (e.g., Stacked LSTM v1.2) vs **Challenger** models.
- Inspect validation metrics: MAPE, WAPE, RMSE, and Training Epochs.
- **Admins:** Click **"Trigger Retraining"** to initiate a full model optimization run across updated historical data.

---

## 4. Standard Operational Workflows

### 4.1 Weekly Demand Planning Cadence
1. **Monday Morning:** Log in as **Planner** and check the **Executive Overview** for weekend actuals ingestion.
2. **Review High-Risk SKUs:** Navigate to the **Inventory Risk Center** and filter by your assigned category.
3. **Inspect Trend Anomalies:** Open the **Forecast Explorer** for any SKU with high forecast variance.
4. **Export Replenishment Plan:** Click **"Export CSV"** to send recommended reorder quantities to the ERP/Procurement team.

### 4.2 Handling Promotional Campaigns
1. Navigate to **Promotions Management**.
2. Input campaign start/end dates and expected promotional discount percentage.
3. Trigger **"Regenerate Forecast"** — the ML model incorporates promotional lift into the future horizon.

---

*End of User Guide*
