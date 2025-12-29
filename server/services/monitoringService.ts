import WatchlistStock, { IWatchlistStock } from '../models/WatchlistStock';
import Order, { IOrder } from '../models/Order';
import ActivityLog, { IActivityLog } from '../models/ActivityLog';
import Alert, { IAlert } from '../models/Alert';
import AlpacaAccount from '../models/AlpacaAccount';
import mongoose from 'mongoose';
import alpacaService from './alpacaService';

/**
 * Monitoring Service
 * Handles watchlist, orders, activity logs, and alerts
 */

// Get user's watchlist stocks
export const getWatchlist = async (userId: string): Promise<IWatchlistStock[]> => {
  console.log(`[MonitoringService] Fetching watchlist for user: ${userId}`);

  try {
    const watchlist = await WatchlistStock.find({
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true
    }).sort({ lastAnalyzed: -1 }).limit(50);

    console.log(`[MonitoringService] Found ${watchlist.length} stocks in watchlist`);
    return watchlist;
  } catch (error) {
    console.error(`[MonitoringService] Error fetching watchlist:`, error);
    throw new Error(`Failed to fetch watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Add stock to watchlist
export const addToWatchlist = async (
  userId: string,
  stockData: {
    symbol: string;
    name: string;
    price: number;
    change?: number;
    changePercent?: number;
    status?: 'monitoring' | 'buy_signal' | 'analyzing';
  }
): Promise<IWatchlistStock> => {
  console.log(`[MonitoringService] Adding ${stockData.symbol} to watchlist for user: ${userId}`);

  try {
    // Check if stock already exists in watchlist
    const existing = await WatchlistStock.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      symbol: stockData.symbol
    });

    if (existing) {
      // Update existing stock
      existing.price = stockData.price;
      existing.change = stockData.change || 0;
      existing.changePercent = stockData.changePercent || 0;
      existing.status = stockData.status || existing.status;
      existing.lastAnalyzed = new Date();
      existing.isActive = true;
      await existing.save();

      console.log(`[MonitoringService] Updated existing watchlist entry for ${stockData.symbol}`);
      return existing;
    }

    // Create new watchlist entry
    const watchlistStock = new WatchlistStock({
      userId: new mongoose.Types.ObjectId(userId),
      symbol: stockData.symbol,
      name: stockData.name,
      price: stockData.price,
      change: stockData.change || 0,
      changePercent: stockData.changePercent || 0,
      status: stockData.status || 'monitoring',
      lastAnalyzed: new Date(),
      addedAt: new Date(),
      isActive: true
    });

    await watchlistStock.save();
    console.log(`[MonitoringService] Added ${stockData.symbol} to watchlist`);
    return watchlistStock;
  } catch (error) {
    console.error(`[MonitoringService] Error adding to watchlist:`, error);
    throw new Error(`Failed to add to watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Remove stock from watchlist
export const removeFromWatchlist = async (userId: string, symbol: string): Promise<void> => {
  console.log(`[MonitoringService] Removing ${symbol} from watchlist for user: ${userId}`);

  try {
    await WatchlistStock.updateOne(
      {
        userId: new mongoose.Types.ObjectId(userId),
        symbol: symbol.toUpperCase()
      },
      { isActive: false }
    );

    console.log(`[MonitoringService] Removed ${symbol} from watchlist`);
  } catch (error) {
    console.error(`[MonitoringService] Error removing from watchlist:`, error);
    throw new Error(`Failed to remove from watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get active orders for user
export const getActiveOrders = async (userId: string): Promise<IOrder[]> => {
  console.log(`[MonitoringService] Fetching active orders for user: ${userId}`);

  try {
    const activeStatuses = ['pending', 'accepted', 'partially_filled'];
    const orders = await Order.find({
      userId: new mongoose.Types.ObjectId(userId),
      status: { $in: activeStatuses }
    }).sort({ submittedAt: -1 });

    console.log(`[MonitoringService] Found ${orders.length} active orders`);
    return orders;
  } catch (error) {
    console.error(`[MonitoringService] Error fetching active orders:`, error);
    throw new Error(`Failed to fetch active orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Create order record
export const createOrder = async (orderData: Partial<IOrder>): Promise<IOrder> => {
  console.log(`[MonitoringService] Creating order record for ${orderData.symbol}`);

  try {
    const order = new Order(orderData);
    await order.save();

    console.log(`[MonitoringService] Created order: ${order.orderId}`);
    return order;
  } catch (error) {
    console.error(`[MonitoringService] Error creating order:`, error);
    throw new Error(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Cancel order
export const cancelOrder = async (userId: string, orderId: string): Promise<IOrder> => {
  console.log(`[MonitoringService] Cancelling order ${orderId} for user: ${userId}`);

  try {
    const order = await Order.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      orderId: orderId
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (!['pending', 'accepted', 'partially_filled'].includes(order.status)) {
      throw new Error(`Cannot cancel order with status: ${order.status}`);
    }

    // Update order status
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    // Log the cancellation
    await logActivity({
      userId: userId,
      type: 'trade',
      action: `Order cancelled for ${order.symbol}`,
      symbol: order.symbol,
      details: { orderId: order.orderId, side: order.side, quantity: order.quantity },
      severity: 'info'
    });

    console.log(`[MonitoringService] Cancelled order: ${orderId}`);
    return order;
  } catch (error) {
    console.error(`[MonitoringService] Error cancelling order:`, error);
    throw new Error(`Failed to cancel order: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get activity log
export const getActivityLog = async (
  userId: string,
  options: {
    limit?: number;
    type?: string;
    symbol?: string;
  } = {}
): Promise<IActivityLog[]> => {
  console.log(`[MonitoringService] Fetching activity log for user: ${userId}`);

  try {
    const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };

    if (options.type) {
      query.type = options.type;
    }

    if (options.symbol) {
      query.symbol = options.symbol.toUpperCase();
    }

    const limit = options.limit || 100;

    const activities = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);

    console.log(`[MonitoringService] Found ${activities.length} activity log entries`);
    return activities;
  } catch (error) {
    console.error(`[MonitoringService] Error fetching activity log:`, error);
    throw new Error(`Failed to fetch activity log: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Log activity
export const logActivity = async (activityData: {
  userId: string;
  type: 'analysis' | 'trade' | 'signal' | 'risk' | 'system';
  action: string;
  symbol?: string;
  details?: Record<string, unknown>;
  severity?: 'info' | 'warning' | 'error' | 'success';
}): Promise<IActivityLog> => {
  try {
    const activity = new ActivityLog({
      userId: new mongoose.Types.ObjectId(activityData.userId),
      type: activityData.type,
      action: activityData.action,
      symbol: activityData.symbol,
      details: activityData.details || {},
      severity: activityData.severity || 'info',
      timestamp: new Date()
    });

    await activity.save();
    return activity;
  } catch (error) {
    console.error(`[MonitoringService] Error logging activity:`, error);
    throw new Error(`Failed to log activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get alerts
export const getAlerts = async (
  userId: string,
  options: {
    unreadOnly?: boolean;
    type?: 'critical' | 'warning' | 'info';
    limit?: number;
  } = {}
): Promise<IAlert[]> => {
  console.log(`[MonitoringService] Fetching alerts for user: ${userId}`);

  try {
    const query: Record<string, unknown> = { userId: new mongoose.Types.ObjectId(userId) };

    if (options.unreadOnly) {
      query.isRead = false;
    }

    if (options.type) {
      query.type = options.type;
    }

    const limit = options.limit || 50;

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    console.log(`[MonitoringService] Found ${alerts.length} alerts`);
    return alerts;
  } catch (error) {
    console.error(`[MonitoringService] Error fetching alerts:`, error);
    throw new Error(`Failed to fetch alerts: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Create alert
export const createAlert = async (alertData: {
  userId: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  symbol?: string;
  relatedData?: Record<string, unknown>;
  expiresAt?: Date;
}): Promise<IAlert> => {
  console.log(`[MonitoringService] Creating ${alertData.type} alert for user: ${alertData.userId}`);

  try {
    const alert = new Alert({
      userId: new mongoose.Types.ObjectId(alertData.userId),
      type: alertData.type,
      title: alertData.title,
      message: alertData.message,
      symbol: alertData.symbol,
      relatedData: alertData.relatedData || {},
      isRead: false,
      isAcknowledged: false,
      createdAt: new Date(),
      expiresAt: alertData.expiresAt
    });

    await alert.save();
    console.log(`[MonitoringService] Created alert: ${alert._id}`);
    return alert;
  } catch (error) {
    console.error(`[MonitoringService] Error creating alert:`, error);
    throw new Error(`Failed to create alert: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Mark alert as read
export const markAlertAsRead = async (userId: string, alertId: string): Promise<IAlert> => {
  console.log(`[MonitoringService] Marking alert ${alertId} as read for user: ${userId}`);

  try {
    const alert = await Alert.findOne({
      _id: new mongoose.Types.ObjectId(alertId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.isRead = true;
    await alert.save();

    console.log(`[MonitoringService] Marked alert ${alertId} as read`);
    return alert;
  } catch (error) {
    console.error(`[MonitoringService] Error marking alert as read:`, error);
    throw new Error(`Failed to mark alert as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Acknowledge alert
export const acknowledgeAlert = async (userId: string, alertId: string): Promise<IAlert> => {
  console.log(`[MonitoringService] Acknowledging alert ${alertId} for user: ${userId}`);

  try {
    const alert = await Alert.findOne({
      _id: new mongoose.Types.ObjectId(alertId),
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.isAcknowledged = true;
    alert.acknowledgedAt = new Date();
    await alert.save();

    console.log(`[MonitoringService] Acknowledged alert ${alertId}`);
    return alert;
  } catch (error) {
    console.error(`[MonitoringService] Error acknowledging alert:`, error);
    throw new Error(`Failed to acknowledge alert: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get comprehensive health summary including holdings
export const getHealthSummary = async (userId: string): Promise<any> => {
  console.log(`[MonitoringService] Generating health summary for user: ${userId}`);
  try {
    // 1. Get account overview
    let account = null;
    try {
      account = await alpacaService.getAccountOverview(userId);
    } catch (e) {
      console.warn(`[MonitoringService] Could not fetch account overview:`, e);
    }

    // 2. Get current positions (holdings)
    let holdings = [];
    try {
      holdings = await alpacaService.getPositions(userId);
    } catch (e) {
      console.warn(`[MonitoringService] Could not fetch positions:`, e);
    }

    // 3. Get auto-trading status
    const trading = await alpacaService.getAutoTradingStatus(userId);

    // 4. Get recent alerts
    const recentAlerts = await getAlerts(userId, { limit: 5, unreadOnly: true });

    return {
      account,
      holdings,
      trading,
      recentAlerts,
      timestamp: new Date()
    };
  } catch (error) {
    console.error(`[MonitoringService] Error generating health summary:`, error);
    throw new Error(`Failed to generate health summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export default {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getActiveOrders,
  createOrder,
  cancelOrder,
  getActivityLog,
  logActivity,
  getAlerts,
  createAlert,
  markAlertAsRead,
  acknowledgeAlert,
  getHealthSummary
};
