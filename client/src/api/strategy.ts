import api from './api';

// Description: Get Strategy Configuration
// Endpoint: GET /api/strategy/config
// Request: {}
// Response: { maxPositionSize: number, maxConcurrentPositions: number, stopLoss: number, takeProfit: number, targetMonthlyReturn: number, preMarket: boolean, afterHours: boolean, minStockPrice: number, minDailyVolume: number, marketCaps: string[], sectors: string[] }
export const getStrategyConfig = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        maxPositionSize: 15,
        maxConcurrentPositions: 8,
        stopLoss: 5,
        takeProfit: 12,
        targetMonthlyReturn: 9,
        preMarket: false,
        afterHours: false,
        minStockPrice: 10,
        minDailyVolume: 1000000,
        marketCaps: ['Large', 'Mid'],
        sectors: ['Technology', 'Healthcare', 'Finance']
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/strategy/config');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Update Strategy Configuration
// Endpoint: PUT /api/strategy/config
// Request: { maxPositionSize: number, maxConcurrentPositions: number, stopLoss: number, takeProfit: number, targetMonthlyReturn: number, preMarket: boolean, afterHours: boolean, minStockPrice: number, minDailyVolume: number, marketCaps: string[], sectors: string[] }
// Response: { success: boolean, message: string }
export const updateStrategyConfig = (data: {
  maxPositionSize: number;
  maxConcurrentPositions: number;
  stopLoss: number;
  takeProfit: number;
  targetMonthlyReturn: number;
  preMarket: boolean;
  afterHours: boolean;
  minStockPrice: number;
  minDailyVolume: number;
  marketCaps: string[];
  sectors: string[];
}) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Strategy configuration updated successfully'
      });
    }, 800);
  });
  // try {
  //   return await api.put('/api/strategy/config', data);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Reset Strategy to Defaults
// Endpoint: POST /api/strategy/reset
// Request: {}
// Response: { success: boolean, message: string }
export const resetStrategyToDefaults = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Strategy reset to aggressive defaults'
      });
    }, 500);
  });
  // try {
  //   return await api.post('/api/strategy/reset');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};