import api from './api';

// Description: Connect Alpaca Account
// Endpoint: POST /api/alpaca/connect
// Request: { apiKey: string, secretKey: string, isPaper?: boolean }
// Response: { success: boolean, accountNumber: string, accountType: string, buyingPower: number }
export const connectAlpacaAccount = async (data: { apiKey: string; secretKey: string; isPaper?: boolean }) => {
  try {
    const response = await api.post('/api/alpaca/connect', data);
    return response.data;
  } catch (error: unknown) {
    console.error(error);
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    throw new Error(err?.response?.data?.error || err.message || 'Unknown error');
  }
};

// Description: Get Account Overview
// Endpoint: GET /api/alpaca/account
// Request: {}
// Response: { portfolioValue: number, todayPL: number, todayPLPercent: number, cashAvailable: number, buyingPower: number, accountNumber: string, accountType: string }
export const getAccountOverview = async () => {
  try {
    const response = await api.get('/api/alpaca/account');
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    const errorMessage = err?.response?.data?.error || err.message || 'Unknown error';
    // Only log if it's not the expected "account not connected" error
    if (errorMessage !== 'Alpaca account not connected') {
      console.error(error);
    }
    throw new Error(errorMessage);
  }
};

// Description: Get Current Positions
// Endpoint: GET /api/alpaca/positions
// Request: {}
// Response: { positions: Array<{ symbol: string, quantity: number, entryPrice: number, currentPrice: number, unrealizedPL: number, unrealizedPLPercent: number, positionSize: number }> }
export const getCurrentPositions = async () => {
  try {
    const response = await api.get('/api/alpaca/positions');
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    const errorMessage = err?.response?.data?.error || err.message || 'Unknown error';
    // Only log if it's not the expected "account not connected" error
    if (errorMessage !== 'Alpaca account not connected') {
      console.error(error);
    }
    throw new Error(errorMessage);
  }
};

// Description: Disconnect Alpaca Account
// Endpoint: DELETE /api/alpaca/disconnect
// Request: {}
// Response: { success: boolean, message: string }
export const disconnectAlpacaAccount = async () => {
  try {
    const response = await api.delete('/api/alpaca/disconnect');
    return response.data;
  } catch (error: unknown) {
    console.error(error);
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    throw new Error(err?.response?.data?.error || err.message || 'Unknown error');
  }
};

// Description: Get Account Connection Status
// Endpoint: GET /api/alpaca/status
// Request: {}
// Response: { isConnected: boolean, accountNumber?: string, accountType?: string, isPaperTrading?: boolean }
export const getAccountStatus = async () => {
  try {
    const response = await api.get('/api/alpaca/status');
    return response.data;
  } catch (error: unknown) {
    console.error(error);
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    throw new Error(err?.response?.data?.error || err.message || 'Unknown error');
  }
};

// Description: Close Position
// Endpoint: POST /api/alpaca/positions/:symbol/close
// Request: { symbol: string }
// Response: { success: boolean, message: string, orderId?: string }
export const closePosition = async (data: { symbol: string }) => {
  try {
    const response = await api.post(`/api/alpaca/positions/${data.symbol}/close`);
    return response.data;
  } catch (error: unknown) {
    console.error(error);
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    throw new Error(err?.response?.data?.error || err.message || 'Unknown error');
  }
};

// Description: Get Recent Trades
// Endpoint: GET /api/alpaca/trades/recent
// Request: {}
// Response: { trades: Array<{ id: string, symbol: string, side: string, quantity: number, price: number, time: string, profitLoss?: number, status: string }> }
export const getRecentTrades = async () => {
  try {
    const response = await api.get('/api/alpaca/trades/recent');
    return response.data;
  } catch (error: unknown) {
    console.error(error);
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    throw new Error(err?.response?.data?.error || err.message || 'Unknown error');
  }
};

// Description: Toggle Auto Trading
// Endpoint: POST /api/alpaca/auto-trading/toggle
// Request: { enabled: boolean }
// Response: { success: boolean, enabled: boolean, status: string, lastToggleTime: string }
export const toggleAutoTrading = async (data: { enabled: boolean }) => {
  try {
    const response = await api.post('/api/alpaca/auto-trading/toggle', data);
    return response.data;
  } catch (error: unknown) {
    console.error(error);
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    throw new Error(err?.response?.data?.error || err.message || 'Unknown error');
  }
};

// Description: Get Auto Trading Status
// Endpoint: GET /api/alpaca/auto-trading/status
// Request: {}
// Response: { enabled: boolean, status: string, lastToggleTime: string | null, isAccountConnected: boolean }
export const getAutoTradingStatus = async () => {
  try {
    const response = await api.get('/api/alpaca/auto-trading/status');
    return response.data;
  } catch (error: unknown) {
    console.error(error);
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    throw new Error(err?.response?.data?.error || err.message || 'Unknown error');
  }
};

// Description: Get Trade History
// Endpoint: GET /api/alpaca/trades/history
// Request: { startDate?: string, endDate?: string, symbol?: string, status?: string, limit?: number, offset?: number }
// Response: { trades: Array<{ id: string, symbol: string, side: string, quantity: number, entryPrice: number, exitPrice?: number, entryTime: string, exitTime?: string, duration?: number, profitLoss?: number, profitLossPercentage?: number, status: string }>, total: number, hasMore: boolean }
export const getTradeHistory = async (params?: {
  startDate?: string;
  endDate?: string;
  symbol?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) => {
  try {
    const response = await api.get('/api/alpaca/trades/history', { params });
    return response.data;
  } catch (error: unknown) {
    console.error(error);
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    throw new Error(err?.response?.data?.error || err.message || 'Unknown error');
  }
};

// Description: Get Strategy Performance Metrics
// Endpoint: GET /api/alpaca/strategy/performance
// Request: {}
// Response: { winRate: number, avgTradeDuration: string, riskExposure: number }
export const getStrategyPerformance = () => {
  // Mocking the response - This will be implemented in a future task
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        winRate: 64.5,
        avgTradeDuration: '2.3 days',
        riskExposure: 72
      });
    }, 500);
  });
  // try {
  //   const response = await api.get('/api/alpaca/strategy/performance');
  //   return response.data;
  // } catch (error: any) {
  //   console.error(error);
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
};
