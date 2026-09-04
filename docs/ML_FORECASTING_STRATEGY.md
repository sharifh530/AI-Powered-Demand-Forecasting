# Machine Learning Forecasting Strategy & Model Architecture

**Document Version:** 1.0  
**Date:** September 4, 2026  
**Status:** Approved Specification  

---

## 1. Executive Summary & Problem Formulation

Demand forecasting in retail and supply chain operations requires predicting future customer demand $y_{t+1}, y_{t+2}, \dots, y_{t+H}$ over a forecast horizon $H$ (typically 4, 8, or 12 weeks) for each SKU $s \in \mathcal{S}$ at location $l \in \mathcal{L}$, given historical demand, inventory levels, calendar patterns, promotions, and external signals.

### Mathematical Formulation
$$\hat{y}_{s,l,t+h} = f_\theta\left(\mathbf{x}_{s,l,\le t}, \mathbf{z}_{s,l,t+h}\right), \quad \forall h \in \{1, 2, \dots, H\}$$

Where:
- $\mathbf{x}_{s,l,\le t}$: Historical observations (lagged sales, rolling metrics, historical promotions, price history).
- $\mathbf{z}_{s,l,t+h}$: Known future covariates (planned promotions, day-of-week, month, holiday flags).
- $\theta$: Trainable model parameters.
- $\hat{y}_{s,l,t+h}$: Predicted demand quantity with confidence intervals $[\hat{y}^{(0.10)}, \hat{y}^{(0.90)}]$.

---

## 2. Model Architectures & Selection

The platform implements a **tiered multi-model architecture** pairing deep recurrent neural networks with robust statistical fallback algorithms:

```
                          Incoming SKU Time Series
                                     │
                    ┌────────────────┴────────────────┐
                    │  Historical Data Depth Check    │
                    └────────────────┬────────────────┘
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼ (≥ 26 weeks history)                          ▼ (< 26 weeks / Cold-Start)
┌───────────────────────────────┐               ┌─────────────────────────────────┐
│   Deep Learning Forecasting   │               │   Statistical Baseline Engine   │
│   (Champion / Challenger)     │               │   - Holt-Winters Exponential    │
│  - Multi-layer LSTM / GRU     │               │     Smoothing                   │
│  - Quantile Output Heads      │               │   - Croston's Intermittent      │
│  - Residual Dense Connections │               │     Demand Model                │
└────────────┬──────────────────┘               │   - 7/14/30d Moving Average     │
             │                                  └────────────────┬────────────────┘
             │                                                   │
             └───────────────────────┬───────────────────────────┘
                                     ▼
                      Ensemble & Final Forecast Output
                       [Predicted, Lower P10, Upper P90]
```

### 2.1 Stacked Long Short-Term Memory (LSTM) Network
For items with rich historical demand ($> 26$ weeks), LSTM networks capture complex non-linear temporal dynamics, multi-period seasonalities (weekly + annual), and non-stationary demand spikes due to promotions.

**TensorFlow Architecture Spec:**
1. **Input Layer:** Shape $(B, T, D)$ where $B$ = batch size, $T$ = sequence length (lookback = 30 or 60 steps), $D$ = feature dimension ($D \approx 18$).
2. **LSTM Layer 1:** 64 units, `return_sequences=True`, `activation='tanh'`, `recurrent_activation='sigmoid'`, `dropout=0.20`, `recurrent_dropout=0.10`.
3. **Batch Normalization Layer 1:** Stabilizes gradient propagation across sequence steps.
4. **LSTM Layer 2:** 32 units, `return_sequences=False`, `activation='tanh'`, `dropout=0.20`.
5. **Dense Bottleneck:** 32 units, `activation='relu'`, L2 Regularization ($\lambda = 10^{-4}$).
6. **Multi-Head Output:**
   - **Median Demand Head ($\hat{y}_{50}$):** Dense(H, activation='relu')
   - **Lower Bound Head ($\hat{y}_{10}$):** Dense(H, activation='relu')
   - **Upper Bound Head ($\hat{y}_{90}$):** Dense(H, activation='relu')

### 2.2 Gated Recurrent Unit (GRU) Network
GRU architectures provide similar representation capacity to LSTMs with 25% fewer parameters, offering faster retraining cycles for large product catalogs (10,000+ SKUs).

**Key Hyperparameters:**
- Hidden units: $[64, 32]$
- Optimizer: Adam with exponential decay ($\text{LR}_0 = 10^{-3}, \gamma = 0.95$)
- Loss: Pinball / Quantile Loss or Huber Loss (robust to outlier orders)

### 2.3 Statistical Baseline & Fallback Models
1. **Holt-Winters Exponential Smoothing (Triple Exponential Smoothing):**
   - Models level ($l_t$), trend ($b_t$), and seasonality ($s_t$) with additive/multiplicative dampening.
   - Ideal for stable, seasonal SKUs with limited training samples.
2. **Croston's Method:**
   - Decomposes demand into non-zero demand size ($z_k$) and inter-arrival time ($p_k$).
   - Deployed automatically when $> 40\%$ of historical periods exhibit zero demand.
3. **Weighted Rolling Moving Average:**
   - Weighted recent window $(w = [0.4, 0.3, 0.2, 0.1])$ for newly introduced products (cold-start phase).

---

## 3. Feature Engineering Pipeline

The feature engineering layer transforms raw transactional logs into normalized feature vectors:

| Feature Category | Variable Name | Description | Formula / Transformation |
|------------------|---------------|-------------|--------------------------|
| **Autoregressive Lags** | `demand_lag_1` | Demand at $t-1$ | $y_{t-1}$ |
| | `demand_lag_2` | Demand at $t-2$ | $y_{t-2}$ |
| | `demand_lag_7` | Demand 1 week prior | $y_{t-7}$ |
| | `demand_lag_14` | Demand 2 weeks prior | $y_{t-14}$ |
| | `demand_lag_28` | Demand 4 weeks prior | $y_{t-28}$ |
| | `demand_lag_52` | Demand 52 weeks prior (YoY) | $y_{t-364}$ |
| **Rolling Statistics** | `rolling_mean_7d` | 7-day rolling average | $\frac{1}{7}\sum_{i=0}^6 y_{t-i}$ |
| | `rolling_mean_30d` | 30-day rolling average | $\frac{1}{30}\sum_{i=0}^{29} y_{t-i}$ |
| | `rolling_std_7d` | 7-day demand volatility | $\sqrt{\frac{1}{7}\sum (y_{t-i} - \mu)^2}$ |
| | `rolling_min_max_ratio` | 14-day dynamic range | $(y_{\max} - y_{\min}) / (\mu + \epsilon)$ |
| **Calendar & Cyclical** | `dow_sin`, `dow_cos` | Day-of-week cyclical | $\sin(2\pi \cdot \text{dow}/7), \cos(2\pi \cdot \text{dow}/7)$ |
| | `month_sin`, `month_cos` | Month cyclical | $\sin(2\pi \cdot m/12), \cos(2\pi \cdot m/12)$ |
| | `is_weekend` | Weekend indicator | $\mathbb{I}(\text{dow} \in \{5, 6\})$ |
| | `is_holiday` | Official holiday flag | $\mathbb{I}(\text{date} \in \text{Holidays})$ |
| **Exogenous Signals** | `promo_active` | Promotional campaign active | Binary flag $\{0, 1\}$ |
| | `discount_pct` | Discount percentage depth | $(P_{\text{base}} - P_{\text{promo}}) / P_{\text{base}}$ |
| | `stockout_flag` | Historical stockout indicator | $\mathbb{I}(\text{inventory}_t = 0)$ |

---

## 4. Model Evaluation & Accuracy Metrics

### 4.1 Primary Evaluation Metrics

1. **Mean Absolute Percentage Error (MAPE):**
   $$\text{MAPE} = \frac{100\%}{N} \sum_{i=1}^N \left| \frac{y_i - \hat{y}_i}{y_i} \right|$$
   *Note:* Clipped when $y_i < 1.0$ to prevent infinite division.

2. **Weighted Absolute Percentage Error (WAPE):**
   $$\text{WAPE} = \frac{\sum_{i=1}^N |y_i - \hat{y}_i|}{\sum_{i=1}^N y_i} \times 100\%$$
   *Advantage:* Eliminates zero-division bias and weights high-volume revenue SKUs appropriately.

3. **Root Mean Squared Error (RMSE):**
   $$\text{RMSE} = \sqrt{\frac{1}{N}\sum_{i=1}^N (y_i - \hat{y}_i)^2}$$
   *Advantage:* Penalizes large forecast misses heavily.

4. **Prediction Interval Coverage Probability (PICP):**
   $$\text{PICP} = \frac{1}{N} \sum_{i=1}^N \mathbb{I}\left( \hat{y}_i^{(0.10)} \le y_i \le \hat{y}_i^{(0.90)} \right)$$
   *Target:* $\text{PICP} \ge 80\%$ for nominal 80% confidence bands.

---

## 5. Champion / Challenger Framework

```
                          Trigger Retraining Run
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
            Train Challenger A              Train Challenger B
             (e.g., Deep LSTM)               (e.g., Deep GRU)
                     │                               │
                     └───────────────┬───────────────┘
                                     ▼
                    Evaluate on Holdout Validation Set
                     (Compute WAPE, MAPE, RMSE, PICP)
                                     │
                                     ▼
                      Compare against Active Champion
                                     │
                  Is Challenger WAPE < Champion WAPE - 1.5%?
                                ┌────┴────┐
                            YES │         │ NO
                                ▼         ▼
                        Promote to        Retain Current
                         Champion            Champion
```

---

## 6. Cold-Start and Edge-Case Handling

1. **New SKU Launch (0 to 4 weeks history):**
   - Inherits aggregate demand distribution from the parent product category.
   - Applies Moving Average with safety buffer ($+25\%$) to minimize stockout risk during ramp-up.
2. **Intermittent / Lumpy Demand:**
   - Evaluated using Croston's Syntetos-Boylan approximation (SBA).
3. **Promotional Cannibalization:**
   - Cross-elasticity penalty applied to substitute SKUs within the same subcategory during active campaign windows.

---

*End of ML Forecasting Strategy*
