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
  emaFastPeriod?: number;
  emaSlowPeriod?: number;
  atrPeriod?: number;
  atrStopMultiplier?: number;
  atrTakeProfitMultiplier?: number;
  riskPerTrade?: number;
  maxPortfolioRisk?: number;
  tradingUniverse?: string[];
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

// Description: Run Strategy Analysis (EMA/ATR)
// Endpoint: POST /api/strategy-engine/analyze
// Request: {}
// Response: { signals: Array<StrategySignal>, count: number, buySignals: number }
export const runStrategyAnalysis = async () => {
  try {
    const response = await api.post('/api/strategy-engine/analyze');
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get Unexecuted Strategy Signals
// Endpoint: GET /api/strategy-engine/signals/unexecuted
// Request: {}
// Response: { signals: Array<StrategySignal> }
export const getUnexecutedSignals = async () => {
  try {
    const response = await api.get('/api/strategy-engine/signals/unexecuted');
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get Recent Strategy Signals
// Endpoint: GET /api/strategy-engine/signals/recent
// Request: { limit?: number }
// Response: { signals: Array<StrategySignal> }
export const getRecentSignals = async (limit?: number) => {
  try {
    const params = limit ? { limit } : {};
    const response = await api.get('/api/strategy-engine/signals/recent', { params });
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};
