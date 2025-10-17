import api from './api';

// Description: Connect Alpaca Account
// Endpoint: POST /api/alpaca/connect
// Request: { apiKey: string, secretKey: string }
// Response: { success: boolean, accountNumber: string, accountType: string, buyingPower: number }
export const connectAlpacaAccount = (data: { apiKey: string; secretKey: string }) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        accountNumber: 'ACC123456789',
        accountType: 'Margin',
        buyingPower: 25000.00
      });
    }, 1000);
  });
  // try {
  //   return await api.post('/api/alpaca/connect', data);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get Account Overview
// Endpoint: GET /api/alpaca/account
// Request: {}
// Response: { portfolioValue: number, todayPL: number, todayPLPercent: number, monthlyPL: number, monthlyPLPercent: number, cashAvailable: number }
export const getAccountOverview = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        portfolioValue: 127543.82,
        todayPL: 1234.56,
        todayPLPercent: 0.98,
        monthlyPL: 8543.21,
        monthlyPLPercent: 7.2,
        cashAvailable: 15234.50
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/alpaca/account');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get Current Positions
// Endpoint: GET /api/alpaca/positions
// Request: {}
// Response: { positions: Array<{ symbol: string, quantity: number, entryPrice: number, currentPrice: number, unrealizedPL: number, unrealizedPLPercent: number, positionSize: number }> }
export const getCurrentPositions = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        positions: [
          {
            symbol: 'AAPL',
            quantity: 50,
            entryPrice: 178.50,
            currentPrice: 182.30,
            unrealizedPL: 190.00,
            unrealizedPLPercent: 2.13,
            positionSize: 7.15
          },
          {
            symbol: 'TSLA',
            quantity: 25,
            entryPrice: 245.80,
            currentPrice: 238.90,
            unrealizedPL: -172.50,
            unrealizedPLPercent: -2.81,
            positionSize: 4.68
          },
          {
            symbol: 'MSFT',
            quantity: 40,
            entryPrice: 368.20,
            currentPrice: 375.60,
            unrealizedPL: 296.00,
            unrealizedPLPercent: 2.01,
            positionSize: 11.77
          },
          {
            symbol: 'NVDA',
            quantity: 30,
            entryPrice: 485.30,
            currentPrice: 492.10,
            unrealizedPL: 204.00,
            unrealizedPLPercent: 1.40,
            positionSize: 11.56
          }
        ]
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/alpaca/positions');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Close Position
// Endpoint: POST /api/alpaca/positions/close
// Request: { symbol: string }
// Response: { success: boolean, message: string, orderId: string }
export const closePosition = (data: { symbol: string }) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Position ${data.symbol} closed successfully`,
        orderId: `ORD${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      });
    }, 800);
  });
  // try {
  //   return await api.post('/api/alpaca/positions/close', data);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get Recent Trades
// Endpoint: GET /api/alpaca/trades/recent
// Request: {}
// Response: { trades: Array<{ time: string, symbol: string, action: string, quantity: number, price: number, pl: number }> }
export const getRecentTrades = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        trades: [
          { time: '2024-01-15T14:32:00Z', symbol: 'GOOGL', action: 'SELL', quantity: 15, price: 142.30, pl: 234.50 },
          { time: '2024-01-15T13:45:00Z', symbol: 'AMZN', action: 'BUY', quantity: 20, price: 155.80, pl: 0 },
          { time: '2024-01-15T11:20:00Z', symbol: 'META', action: 'SELL', quantity: 10, price: 378.90, pl: -45.20 },
          { time: '2024-01-15T10:15:00Z', symbol: 'NFLX', action: 'BUY', quantity: 8, price: 485.60, pl: 0 },
          { time: '2024-01-14T15:50:00Z', symbol: 'AMD', action: 'SELL', quantity: 35, price: 148.20, pl: 567.80 },
          { time: '2024-01-14T14:30:00Z', symbol: 'INTC', action: 'BUY', quantity: 50, price: 43.50, pl: 0 },
          { time: '2024-01-14T12:10:00Z', symbol: 'ORCL', action: 'SELL', quantity: 25, price: 108.90, pl: 123.45 },
          { time: '2024-01-14T10:05:00Z', symbol: 'CRM', action: 'BUY', quantity: 12, price: 265.30, pl: 0 }
        ]
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/alpaca/trades/recent');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Toggle Auto Trading
// Endpoint: POST /api/alpaca/auto-trading/toggle
// Request: { enabled: boolean }
// Response: { success: boolean, enabled: boolean }
export const toggleAutoTrading = (data: { enabled: boolean }) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        enabled: data.enabled
      });
    }, 500);
  });
  // try {
  //   return await api.post('/api/alpaca/auto-trading/toggle', data);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get Auto Trading Status
// Endpoint: GET /api/alpaca/auto-trading/status
// Request: {}
// Response: { enabled: boolean }
export const getAutoTradingStatus = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        enabled: true
      });
    }, 300);
  });
  // try {
  //   return await api.get('/api/alpaca/auto-trading/status');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get Strategy Performance Metrics
// Endpoint: GET /api/alpaca/strategy/performance
// Request: {}
// Response: { winRate: number, avgTradeDuration: string, riskExposure: number }
export const getStrategyPerformance = () => {
  // Mocking the response
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
  //   return await api.get('/api/alpaca/strategy/performance');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};