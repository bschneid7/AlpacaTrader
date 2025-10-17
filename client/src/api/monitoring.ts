import api from './api';

// Description: Get Watchlist
// Endpoint: GET /api/monitoring/watchlist
// Request: {}
// Response: { watchlist: Array<{ symbol: string, name: string, price: number, change: number, changePercent: number, status: string, indicators?: object, lastAnalyzed: string, addedAt: string }> }
export const getWatchlist = async () => {
  try {
    const response = await api.get('/api/monitoring/watchlist');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching watchlist:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get Active Orders
// Endpoint: GET /api/monitoring/orders
// Request: {}
// Response: { orders: Array<{ _id: string, orderId: string, symbol: string, side: string, type: string, quantity: number, limitPrice?: number, stopPrice?: number, status: string, filledQty: number, submittedAt: string, timeInForce: string }> }
export const getActiveOrders = async () => {
  try {
    const response = await api.get('/api/monitoring/orders');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching active orders:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Cancel Order
// Endpoint: POST /api/monitoring/orders/:orderId/cancel
// Request: { orderId: string }
// Response: { order: Order }
export const cancelOrder = async (orderId: string) => {
  try {
    const response = await api.post(`/api/monitoring/orders/${orderId}/cancel`);
    return response.data;
  } catch (error: any) {
    console.error('Error cancelling order:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get Algorithm Activity Log
// Endpoint: GET /api/monitoring/activity
// Request: { limit?: number, type?: string, symbol?: string }
// Response: { activities: Array<{ _id: string, type: string, action: string, symbol?: string, details?: object, severity: string, timestamp: string }> }
export const getActivityLog = async (params?: { limit?: number; type?: string; symbol?: string }) => {
  try {
    const response = await api.get('/api/monitoring/activity', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching activity log:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Get Alerts
// Endpoint: GET /api/monitoring/alerts
// Request: { unreadOnly?: boolean, type?: string, limit?: number }
// Response: { alerts: Array<{ _id: string, type: string, title: string, message: string, symbol?: string, relatedData?: object, isRead: boolean, isAcknowledged: boolean, createdAt: string }> }
export const getAlerts = async (params?: { unreadOnly?: boolean; type?: string; limit?: number }) => {
  try {
    const response = await api.get('/api/monitoring/alerts', { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching alerts:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Mark alert as read
// Endpoint: POST /api/monitoring/alerts/:alertId/read
// Request: { alertId: string }
// Response: { alert: Alert }
export const markAlertAsRead = async (alertId: string) => {
  try {
    const response = await api.post(`/api/monitoring/alerts/${alertId}/read`);
    return response.data;
  } catch (error: any) {
    console.error('Error marking alert as read:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Acknowledge alert
// Endpoint: POST /api/monitoring/alerts/:alertId/acknowledge
// Request: { alertId: string }
// Response: { alert: Alert }
export const acknowledgeAlert = async (alertId: string) => {
  try {
    const response = await api.post(`/api/monitoring/alerts/${alertId}/acknowledge`);
    return response.data;
  } catch (error: any) {
    console.error('Error acknowledging alert:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};
