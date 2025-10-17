import api from './api';

// Description: Get Risk Metrics
// Endpoint: GET /api/risk/metrics
// Request: {}
// Response: { metrics: IRiskMetrics }
export const getRiskMetrics = async () => {
  try {
    const response = await api.get('/api/risk/metrics');
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Calculate fresh Risk Metrics
// Endpoint: POST /api/risk/metrics/calculate
// Request: {}
// Response: { metrics: IRiskMetrics }
export const calculateRiskMetrics = async () => {
  try {
    const response = await api.post('/api/risk/metrics/calculate');
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get Risk Limits
// Endpoint: GET /api/risk/limits
// Request: {}
// Response: { limits: IRiskLimits }
export const getRiskLimits = async () => {
  try {
    const response = await api.get('/api/risk/limits');
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update Risk Limits
// Endpoint: PUT /api/risk/limits
// Request: { dailyLossLimit?, portfolioDrawdownLimit?, positionLossThreshold?, dailyLossThreshold?, drawdownThreshold?, volatilityThreshold?, haltTradingOnDailyLimit?, haltTradingOnDrawdown? }
// Response: { limits: IRiskLimits, message: string }
export const updateRiskLimits = async (data: any) => {
  try {
    const response = await api.put('/api/risk/limits', data);
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Emergency Stop All Positions
// Endpoint: POST /api/risk/emergency-stop
// Request: { confirmation: string }
// Response: { success: boolean, message: string, closedPositions: number }
export const emergencyStopAll = async (confirmation: string) => {
  try {
    const response = await api.post('/api/risk/emergency-stop', { confirmation });
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Check if risk limits are breached
// Endpoint: GET /api/risk/check-breaches
// Request: {}
// Response: { breached: boolean, breaches: string[], shouldHaltTrading: boolean }
export const checkRiskBreaches = async () => {
  try {
    const response = await api.get('/api/risk/check-breaches');
    return response.data;
  } catch (error: any) {
    console.error(error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};
