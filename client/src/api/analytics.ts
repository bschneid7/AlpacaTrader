import api from './api';

// Description: Get Portfolio History
// Endpoint: GET /api/analytics/portfolio-history
// Request: { timeframe: string }
// Response: { data: Array<{ date: string, value: number }> }
export const getPortfolioHistory = async (timeframe: string) => {
  try {
    const response = await api.get(`/api/analytics/portfolio-history?timeframe=${timeframe}`);
    return response.data;
  } catch (error: unknown) {
    console.error(error);
    throw new Error((error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || 'Failed to fetch portfolio history');
  }
};

// Description: Get Monthly Returns
// Endpoint: GET /api/analytics/monthly-returns
// Request: {}
// Response: { data: Array<{ month: string, return: number }> }
export const getMonthlyReturns = async () => {
  try {
    const response = await api.get('/api/analytics/monthly-returns');
    return response.data;
  } catch (error: unknown) {
    console.error(error);
    throw new Error((error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || 'Failed to fetch monthly returns');
  }
};

// Description: Get Performance Metrics
// Endpoint: GET /api/analytics/performance-metrics
// Request: {}
// Response: { totalReturn: number, totalReturnPercent: number, bestTrade: object, worstTrade: object, avgWin: number, avgLoss: number, sharpeRatio: number, maxDrawdown: number }
export const getPerformanceMetrics = async () => {
  try {
    const response = await api.get('/api/analytics/performance-metrics');
    return response.data;
  } catch (error: unknown) {
    console.error(error);
    throw new Error((error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || 'Failed to fetch performance metrics');
  }
};

// Description: Get Trade History
// Endpoint: GET /api/analytics/trade-history
// Request: {}
// Response: { trades: Array<{ date: string, symbol: string, entryPrice: number, exitPrice: number, quantity: number, duration: string, pl: number, plPercent: number }> }
export const getTradeHistory = async () => {
  try {
    const response = await api.get('/api/analytics/trade-history');
    return response.data;
  } catch (error: unknown) {
    console.error(error);
    throw new Error((error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as Error)?.message || 'Failed to fetch trade history');
  }
};