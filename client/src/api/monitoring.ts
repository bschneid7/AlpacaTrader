import api from './api';

// Description: Get Watchlist
// Endpoint: GET /api/monitoring/watchlist
// Request: {}
// Response: { stocks: Array<{ symbol: string, price: number, change: number, signal: string }> }
export const getWatchlist = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        stocks: [
          { symbol: 'AAPL', price: 182.30, change: 1.2, signal: 'Monitoring' },
          { symbol: 'GOOGL', price: 142.80, change: -0.5, signal: 'Buy Signal Detected' },
          { symbol: 'AMZN', price: 155.80, change: 2.1, signal: 'Monitoring' },
          { symbol: 'MSFT', price: 375.60, change: 0.8, signal: 'Monitoring' },
          { symbol: 'META', price: 378.90, change: -1.3, signal: 'Monitoring' },
          { symbol: 'NVDA', price: 492.10, change: 3.4, signal: 'Buy Signal Detected' }
        ]
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/monitoring/watchlist');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get Active Orders
// Endpoint: GET /api/monitoring/orders
// Request: {}
// Response: { orders: Array<{ orderId: string, symbol: string, type: string, targetPrice: number, quantity: number, time: string }> }
export const getActiveOrders = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        orders: [
          { orderId: 'ORD123456', symbol: 'GOOGL', type: 'Limit', targetPrice: 141.50, quantity: 15, time: '2024-01-15T14:30:00Z' },
          { orderId: 'ORD123457', symbol: 'NVDA', type: 'Limit', targetPrice: 490.00, quantity: 10, time: '2024-01-15T14:25:00Z' }
        ]
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/monitoring/orders');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Cancel Order
// Endpoint: DELETE /api/monitoring/orders/:orderId
// Request: { orderId: string }
// Response: { success: boolean, message: string }
export const cancelOrder = (orderId: string) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `Order ${orderId} cancelled successfully`
      });
    }, 500);
  });
  // try {
  //   return await api.delete(`/api/monitoring/orders/${orderId}`);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get Algorithm Activity Log
// Endpoint: GET /api/monitoring/activity-log
// Request: {}
// Response: { activities: Array<{ time: string, message: string, type: string }> }
export const getActivityLog = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        activities: [
          { time: '2024-01-15T14:35:22Z', message: 'Analyzing GOOGL for entry', type: 'info' },
          { time: '2024-01-15T14:34:15Z', message: 'Position sizing calculated for NVDA', type: 'info' },
          { time: '2024-01-15T14:32:08Z', message: 'Stop-loss triggered for TSLA', type: 'warning' },
          { time: '2024-01-15T14:30:45Z', message: 'New position opened: AMZN', type: 'success' },
          { time: '2024-01-15T14:28:33Z', message: 'Monitoring market volatility', type: 'info' },
          { time: '2024-01-15T14:25:12Z', message: 'Buy signal detected for NVDA', type: 'success' }
        ]
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/monitoring/activity-log');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Get Alerts
// Endpoint: GET /api/monitoring/alerts
// Request: {}
// Response: { alerts: Array<{ id: string, time: string, message: string, severity: string }> }
export const getAlerts = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        alerts: [
          { id: 'ALT001', time: '2024-01-15T14:32:08Z', message: 'Stop-loss hit for TSLA position', severity: 'critical' },
          { id: 'ALT002', time: '2024-01-15T14:15:30Z', message: 'Approaching position limit (7/8)', severity: 'warning' },
          { id: 'ALT003', time: '2024-01-15T13:45:22Z', message: 'Order filled: AMZN 20 shares @ $155.80', severity: 'info' }
        ]
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/monitoring/alerts');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};