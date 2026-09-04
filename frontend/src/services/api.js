import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Create Axios Instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to attach JWT Token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh & errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          if (res.data.access) {
            localStorage.setItem('access_token', res.data.access);
            originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
            return apiClient(originalRequest);
          }
        } catch (refreshErr) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ----------------------------------------------------
// Mock / Fallback Data Engine
// Mirrors 54,544 rows, 14-day horizon, 18 features,
// and Champion HistGBDT tournament results
// ----------------------------------------------------
const MOCK_SKUS = [
  { sku: 'BEV-001', name: 'Artisan Sparkling Tonic (330ml)', category: 'Beverages', price: 2.85, cost: 1.10, min_order: 50, lead_time_days: 3 },
  { sku: 'BEV-002', name: 'Cold Brew Nitro Coffee (250ml)', category: 'Beverages', price: 4.20, cost: 1.75, min_order: 40, lead_time_days: 4 },
  { sku: 'EL-001', name: 'Wireless Ergonomic Keyboard', category: 'Electronics', price: 89.99, cost: 42.00, min_order: 10, lead_time_days: 14 },
  { sku: 'EL-002', name: 'Ultra-Fast USB-C GaN Charger 65W', category: 'Electronics', price: 34.50, cost: 14.20, min_order: 25, lead_time_days: 10 },
  { sku: 'HOM-001', name: 'Organic Bamboo Bath Towel Set', category: 'Home Goods', price: 48.00, cost: 19.50, min_order: 15, lead_time_days: 7 },
  { sku: 'HOM-002', name: 'Minimalist Ceramic Pour-Over Dripper', category: 'Home Goods', price: 28.50, cost: 9.80, min_order: 20, lead_time_days: 6 },
  { sku: 'PER-001', name: 'Hydrating Botanical Facial Cleanser', category: 'Personal Care', price: 22.00, cost: 6.40, min_order: 30, lead_time_days: 5 },
  { sku: 'PER-002', name: 'Mineral Sunscreen SPF 50+ (100ml)', category: 'Personal Care', price: 26.50, cost: 8.90, min_order: 35, lead_time_days: 5 },
];

const MOCK_LOCATIONS = [
  { id: 1, name: 'Central Fulfillment Hub', code: 'DC-CENTRAL', city: 'Chicago', type: 'Distribution Center', is_active: true },
  { id: 2, name: 'West Coast Logistics Center', code: 'DC-WEST', city: 'Los Angeles', type: 'Distribution Center', is_active: true },
  { id: 3, name: 'East Coast Express Depot', code: 'DC-EAST', city: 'Newark', type: 'Regional Warehouse', is_active: true },
  { id: 4, name: 'Southern Hub', code: 'DC-SOUTH', city: 'Dallas', type: 'Regional Warehouse', is_active: true },
];

const MOCK_MODELS = [
  {
    id: 'run-gbdt-001',
    run_name: 'GBDT Multi-Feature Ensemble (Production Champion)',
    model_architecture: 'gru',
    model_name_display: 'HistGradientBoosting (GBDT)',
    model_version: 'v1.8-gbdt',
    is_champion: true,
    status: 'completed',
    wape: 12.19,
    rmse: 5.68,
    mae: 3.82,
    mape: 14.15,
    coverage_90: 92.40,
    training_samples: 48920,
    training_duration_seconds: 4.82,
    created_at: '2026-09-04T07:15:22Z',
    hyperparameters: { max_iter: 120, learning_rate: 0.07, max_depth: 6, min_samples_leaf: 20 },
  },
  {
    id: 'run-neural-002',
    run_name: 'Deep Stacked MLP Regressor',
    model_architecture: 'lstm',
    model_name_display: 'Stacked Deep MLP Neural Net',
    model_version: 'v2.4-neural',
    is_champion: false,
    status: 'completed',
    wape: 12.64,
    rmse: 6.09,
    mae: 4.01,
    mape: 14.88,
    coverage_90: 90.80,
    training_samples: 48920,
    training_duration_seconds: 14.35,
    created_at: '2026-09-04T07:16:10Z',
    hyperparameters: { hidden_layers: [64, 32], activation: 'relu', alpha: 0.0001, early_stopping: true },
  },
  {
    id: 'run-ma-003',
    run_name: 'Weighted Moving Average Baseline',
    model_architecture: 'moving_average',
    model_name_display: 'Weighted Moving Average',
    model_version: 'v1.0-ma',
    is_champion: false,
    status: 'completed',
    wape: 16.36,
    rmse: 8.05,
    mae: 5.24,
    mape: 19.30,
    coverage_90: 88.50,
    training_samples: 48920,
    training_duration_seconds: 0.42,
    created_at: '2026-09-04T07:14:02Z',
    hyperparameters: { window: 14, dow_weighting: true },
  },
  {
    id: 'run-hw-004',
    run_name: 'Holt-Winters Triple Exponential Smoothing',
    model_architecture: 'holt_winters',
    model_name_display: 'Holt-Winters Exp Smoothing',
    model_version: 'v1.2-hw',
    is_champion: false,
    status: 'completed',
    wape: 63.49,
    rmse: 31.57,
    mae: 20.12,
    mape: 71.40,
    coverage_90: 74.20,
    training_samples: 48920,
    training_duration_seconds: 1.15,
    created_at: '2026-09-04T07:14:45Z',
    hyperparameters: { alpha: 0.3, beta: 0.1, gamma: 0.2, season_length: 7 },
  },
];

export const generateMockForecasts = (sku = 'BEV-001', locationId = 1, horizon = 14) => {
  const result = [];
  const today = new Date();

  // Base demand levels
  const baseMap = {
    'BEV-001': 85,
    'BEV-002': 64,
    'EL-001': 22,
    'EL-002': 45,
    'HOM-001': 32,
    'HOM-002': 28,
    'PER-001': 52,
    'PER-002': 68,
  };

  const base = (baseMap[sku] || 50) * (locationId === 1 ? 1.4 : locationId === 2 ? 1.1 : 0.85);

  for (let i = 0; i < horizon; i++) {
    const fDate = new Date(today);
    fDate.setDate(today.getDate() + i + 1);

    // Day of week effect
    const dayOfWeek = fDate.getDay();
    const weekendBoost = (dayOfWeek === 5 || dayOfWeek === 6) ? 1.25 : 0.95;
    const slightTrend = 1 + (i * 0.008);
    const noise = (Math.sin(i * 1.5) * 0.1) + 1;

    const predicted = Math.round(base * weekendBoost * slightTrend * noise);
    const uncertaintyBand = Math.round(predicted * 0.16 + Math.sqrt(predicted) * 1.2);

    result.push({
      id: `f-${sku}-${locationId}-${i}`,
      sku,
      location: locationId,
      location_name: MOCK_LOCATIONS.find(l => l.id === locationId)?.name || 'Central Fulfillment Hub',
      forecast_date: fDate.toISOString().split('T')[0],
      forecast_horizon: i + 1,
      predicted_demand: predicted,
      lower_bound: Math.max(0, predicted - uncertaintyBand),
      upper_bound: predicted + uncertaintyBand,
      confidence_level: 90.00,
      model_version: 'v1.8-gbdt',
      model_architecture: 'HistGradientBoosting',
    });
  }

  return result;
};

export const generateMockInventoryAlerts = () => {
  return [
    {
      id: 1,
      sku: 'BEV-001',
      name: 'Artisan Sparkling Tonic (330ml)',
      category: 'Beverages',
      location: 'Central Fulfillment Hub',
      location_id: 1,
      current_stock: 210,
      allocated_stock: 45,
      available_stock: 165,
      safety_stock: 350,
      reorder_point: 520,
      days_of_supply: 2.1,
      daily_run_rate: 85,
      lead_time_days: 3,
      recommended_order: 600,
      severity: 'critical',
      status: 'stockout_imminent',
    },
    {
      id: 2,
      sku: 'EL-002',
      name: 'Ultra-Fast USB-C GaN Charger 65W',
      category: 'Electronics',
      location: 'West Coast Logistics Center',
      location_id: 2,
      current_stock: 140,
      allocated_stock: 20,
      available_stock: 120,
      safety_stock: 180,
      reorder_point: 280,
      days_of_supply: 4.3,
      daily_run_rate: 28,
      lead_time_days: 10,
      recommended_order: 350,
      severity: 'warning',
      status: 'low_stock',
    },
    {
      id: 3,
      sku: 'PER-002',
      name: 'Mineral Sunscreen SPF 50+ (100ml)',
      category: 'Personal Care',
      location: 'Southern Hub',
      location_id: 4,
      current_stock: 95,
      allocated_stock: 15,
      available_stock: 80,
      safety_stock: 220,
      reorder_point: 310,
      days_of_supply: 1.8,
      daily_run_rate: 44,
      lead_time_days: 5,
      recommended_order: 400,
      severity: 'critical',
      status: 'stockout_imminent',
    },
    {
      id: 4,
      sku: 'HOM-001',
      name: 'Organic Bamboo Bath Towel Set',
      category: 'Home Goods',
      location: 'East Coast Express Depot',
      location_id: 3,
      current_stock: 420,
      allocated_stock: 40,
      available_stock: 380,
      safety_stock: 250,
      reorder_point: 380,
      days_of_supply: 11.2,
      daily_run_rate: 34,
      lead_time_days: 7,
      recommended_order: 250,
      severity: 'healthy',
      status: 'optimal',
    },
    {
      id: 5,
      sku: 'EL-001',
      name: 'Wireless Ergonomic Keyboard',
      category: 'Electronics',
      location: 'Central Fulfillment Hub',
      location_id: 1,
      current_stock: 850,
      allocated_stock: 60,
      available_stock: 790,
      safety_stock: 300,
      reorder_point: 450,
      days_of_supply: 35.8,
      daily_run_rate: 20,
      lead_time_days: 14,
      recommended_order: 0,
      severity: 'healthy',
      status: 'excess_stock',
    },
  ];
};

// ----------------------------------------------------
// Public API Service Object
// ----------------------------------------------------
export const APIService = {
  // Auth
  async login(username, password) {
    try {
      const res = await apiClient.post('/auth/token/', { username, password });
      if (res.data.access) {
        localStorage.setItem('access_token', res.data.access);
        localStorage.setItem('refresh_token', res.data.refresh);
        const user = { username, role: username.toLowerCase().includes('admin') ? 'admin' : 'planner' };
        localStorage.setItem('user', JSON.stringify(user));
        return { success: true, user, token: res.data.access, live: true };
      }
    } catch (err) {
      console.warn('API login failed, checking demo fallback mode:', err.message);
      // Demo fallback login if backend is unreachable
      if (username && password) {
        const role = username.toLowerCase().includes('admin') ? 'admin' : 'planner';
        const mockUser = { username, role };
        localStorage.setItem('access_token', 'mock_jwt_access_token_demo_mode');
        localStorage.setItem('refresh_token', 'mock_jwt_refresh_token_demo_mode');
        localStorage.setItem('user', JSON.stringify(mockUser));
        return { success: true, user: mockUser, token: 'mock_jwt_access_token_demo_mode', live: false };
      }
      return { success: false, error: err.response?.data?.detail || 'Authentication failed.' };
    }
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Forecasts
  async getForecasts(filters = {}) {
    try {
      const res = await apiClient.get('/forecasting/forecasts/', { params: filters });
      return { data: res.data.results || res.data, live: true };
    } catch (err) {
      console.info('Backend API unavailable. Using synthetic 14-day forecasts:', err.message);
      const sku = filters.sku || 'BEV-001';
      const loc = parseInt(filters.location || 1);
      const horizon = parseInt(filters.horizon || 14);
      return { data: generateMockForecasts(sku, loc, horizon), live: false };
    }
  },

  // Models Leaderboard
  async getModels() {
    try {
      const res = await apiClient.get('/forecasting/model-runs/');
      return { data: res.data.results || res.data, live: true };
    } catch (err) {
      console.info('Using local model tournament leaderboard records.');
      return { data: MOCK_MODELS, live: false };
    }
  },

  // Trigger Model Retraining Tournament
  async triggerTraining(params = {}) {
    try {
      const res = await apiClient.post('/forecasting/model-runs/trigger_training/', params);
      return { success: true, data: res.data, live: true };
    } catch (err) {
      console.info('Simulating training tournament pipeline:', err.message);
      // Simulated new champion run
      const simulatedRun = {
        id: `run-${Date.now()}`,
        run_name: `Automated Tournament Run (${new Date().toLocaleDateString()})`,
        model_architecture: 'gru',
        model_name_display: 'HistGradientBoosting (GBDT)',
        model_version: 'v1.9-gbdt',
        is_champion: true,
        status: 'completed',
        wape: +(12.19 - (Math.random() * 0.3)).toFixed(2),
        rmse: +(5.68 - (Math.random() * 0.15)).toFixed(2),
        mae: +(3.82 - (Math.random() * 0.1)).toFixed(2),
        coverage_90: 92.65,
        training_samples: 48920,
        training_duration_seconds: 5.12,
        created_at: new Date().toISOString(),
        hyperparameters: { max_iter: 140, learning_rate: 0.075, max_depth: 6 },
      };
      return { success: true, data: simulatedRun, live: false };
    }
  },

  // Inventory Alerts
  async getInventoryAlerts() {
    try {
      const res = await apiClient.get('/inventory/items/low_stock_alerts/');
      return { data: res.data.results || res.data, live: true };
    } catch (err) {
      return { data: generateMockInventoryAlerts(), live: false };
    }
  },

  // Metadata: SKUs & Locations
  async getProducts() {
    try {
      const res = await apiClient.get('/forecasting/products/');
      return { data: res.data.results || res.data, live: true };
    } catch (err) {
      return { data: MOCK_SKUS, live: false };
    }
  },

  async getLocations() {
    try {
      const res = await apiClient.get('/forecasting/locations/');
      return { data: res.data.results || res.data, live: true };
    } catch (err) {
      return { data: MOCK_LOCATIONS, live: false };
    }
  },
};

export default APIService;
