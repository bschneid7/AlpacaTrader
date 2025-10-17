import api from './api';

// Description: Get Strategy Configuration
// Endpoint: GET /api/strategy/config
// Request: {}
// Response: { config: StrategyConfig }
export const getStrategyConfig = async () => {
  try {
    const response = await api.get('/api/strategy/config');
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update Strategy Configuration
// Endpoint: PUT /api/strategy/config
// Request: { Partial<StrategyConfig> }
// Response: { config: StrategyConfig, message: string }
export const updateStrategyConfig = async (data: {
  maxPositionSize?: number;
  maxConcurrentPositions?: number;
  stopLossPercentage?: number;
  takeProfitTarget?: number;
  monthlyReturnTarget?: {
    min: number;
    max: number;
  };
  enablePreMarket?: boolean;
  enableAfterHours?: boolean;
  marketHoursOnly?: boolean;
  minStockPrice?: number;
  minDailyVolume?: number;
  marketCapPreferences?: string[];
  sectorPreferences?: string[];
}) => {
  try {
    const response = await api.put('/api/strategy/config', data);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Reset Strategy to Defaults
// Endpoint: POST /api/strategy/config/reset
// Request: {}
// Response: { config: StrategyConfig, message: string }
export const resetStrategyToDefaults = async () => {
  try {
    const response = await api.post('/api/strategy/config/reset');
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get Strategy Performance Metrics
// Endpoint: GET /api/strategy/performance
// Request: {}
// Response: { performance: StrategyPerformance }
export const getStrategyPerformance = async () => {
  try {
    const response = await api.get('/api/strategy/performance');
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};
