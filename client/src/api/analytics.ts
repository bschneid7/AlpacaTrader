import api from './api';

// Description: Get Portfolio History
// Endpoint: GET /api/analytics/portfolio-history
// Request: { timeframe: string }
// Response: { data: Array<{ date: string, value: number }> }
export const getPortfolioHistory = (timeframe: string) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      const generateData = () => {
        const data = [];
        const now = new Date();
        let baseValue = 100000;
        
        for (let i = 30; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          baseValue += (Math.random() - 0.45) * 2000;
          data.push({
            date: date.toISOString().split('T')[0],
            value: Math.round(baseValue * 100) / 100
          });
        }
        return data;
      };
      
      resolve({
        data: generateData()
      });
    }, 500);
  });
  // try {
  //   return await api.get(`/api/analytics/portfolio-history?timeframe=${timeframe}`);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get Monthly Returns
// Endpoint: GET /api/analytics/monthly-returns
// Request: {}
// Response: { data: Array<{ month: string, return: number }> }
export const getMonthlyReturns = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: [
          { month: 'Jul', return: 6.5 },
          { month: 'Aug', return: 8.2 },
          { month: 'Sep', return: -2.3 },
          { month: 'Oct', return: 11.4 },
          { month: 'Nov', return: 7.8 },
          { month: 'Dec', return: 9.1 },
          { month: 'Jan', return: 7.2 }
        ]
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/analytics/monthly-returns');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get Performance Metrics
// Endpoint: GET /api/analytics/performance-metrics
// Request: {}
// Response: { totalReturn: number, totalReturnPercent: number, bestTrade: object, worstTrade: object, avgWin: number, avgLoss: number, sharpeRatio: number, maxDrawdown: number }
export const getPerformanceMetrics = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        totalReturn: 27543.82,
        totalReturnPercent: 27.54,
        bestTrade: { symbol: 'NVDA', pl: 1234.56, plPercent: 15.2 },
        worstTrade: { symbol: 'TSLA', pl: -456.78, plPercent: -8.3 },
        avgWin: 345.67,
        avgLoss: -234.89,
        sharpeRatio: 1.85,
        maxDrawdown: 12.3
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/analytics/performance-metrics');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get Trade History
// Endpoint: GET /api/analytics/trade-history
// Request: {}
// Response: { trades: Array<{ date: string, symbol: string, entryPrice: number, exitPrice: number, quantity: number, duration: string, pl: number, plPercent: number }> }
export const getTradeHistory = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        trades: [
          { date: '2024-01-15', symbol: 'GOOGL', entryPrice: 140.50, exitPrice: 142.30, quantity: 15, duration: '2 days', pl: 234.50, plPercent: 1.28 },
          { date: '2024-01-14', symbol: 'AMD', entryPrice: 132.10, exitPrice: 148.20, quantity: 35, duration: '5 days', pl: 567.80, plPercent: 12.19 },
          { date: '2024-01-14', symbol: 'ORCL', entryPrice: 104.00, exitPrice: 108.90, quantity: 25, duration: '3 days', pl: 123.45, plPercent: 4.71 },
          { date: '2024-01-13', symbol: 'META', entryPrice: 385.20, exitPrice: 378.90, quantity: 10, duration: '1 day', pl: -45.20, plPercent: -1.64 },
          { date: '2024-01-12', symbol: 'NFLX', entryPrice: 468.30, exitPrice: 485.60, quantity: 8, duration: '4 days', pl: 138.40, plPercent: 3.70 },
          { date: '2024-01-11', symbol: 'PYPL', entryPrice: 62.80, exitPrice: 65.40, quantity: 50, duration: '2 days', pl: 130.00, plPercent: 4.14 },
          { date: '2024-01-10', symbol: 'SQ', entryPrice: 78.90, exitPrice: 76.20, quantity: 30, duration: '1 day', pl: -81.00, plPercent: -3.42 },
          { date: '2024-01-09', symbol: 'SHOP', entryPrice: 72.50, exitPrice: 78.30, quantity: 25, duration: '3 days', pl: 145.00, plPercent: 8.00 }
        ]
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/analytics/trade-history');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};