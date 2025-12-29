import express, { Request, Response } from 'express';
import { requireUser } from './middlewares/auth';
import * as monitoringService from '../services/monitoringService';

const router = express.Router();

// Description: Get user's watchlist stocks
// Endpoint: GET /api/monitoring/watchlist
// Request: {}
// Response: { watchlist: Array<WatchlistStock> }
router.get('/watchlist', requireUser(), async (req: Request, res: Response) => {
  try {
    console.log(`[MonitoringRoutes] GET /watchlist - User: ${req.user?._id}`);

    const watchlist = await monitoringService.getWatchlist(req.user!._id.toString());

    res.status(200).json({ watchlist });
  } catch (error) {
    console.error('[MonitoringRoutes] Error fetching watchlist:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch watchlist'
    });
  }
});

// Description: Add stock to watchlist
// Endpoint: POST /api/monitoring/watchlist
// Request: { symbol: string, name: string, price: number, change?: number, changePercent?: number, status?: string }
// Response: { stock: WatchlistStock }
router.post('/watchlist', requireUser(), async (req: Request, res: Response) => {
  try {
    console.log(`[MonitoringRoutes] POST /watchlist - User: ${req.user?._id}, Symbol: ${req.body.symbol}`);

    const { symbol, name, price, change, changePercent, status } = req.body;

    if (!symbol || !name || !price) {
      return res.status(400).json({
        error: 'Missing required fields: symbol, name, price'
      });
    }

    const stock = await monitoringService.addToWatchlist(req.user!._id.toString(), {
      symbol,
      name,
      price,
      change,
      changePercent,
      status
    });

    res.status(201).json({ stock });
  } catch (error) {
    console.error('[MonitoringRoutes] Error adding to watchlist:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to add to watchlist'
    });
  }
});

// Description: Remove stock from watchlist
// Endpoint: DELETE /api/monitoring/watchlist/:symbol
// Request: {}
// Response: { success: boolean }
router.delete('/watchlist/:symbol', requireUser(), async (req: Request, res: Response) => {
  try {
    console.log(`[MonitoringRoutes] DELETE /watchlist/${req.params.symbol} - User: ${req.user?._id}`);

    await monitoringService.removeFromWatchlist(req.user!._id.toString(), req.params.symbol);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[MonitoringRoutes] Error removing from watchlist:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to remove from watchlist'
    });
  }
});

// Description: Get active orders
// Endpoint: GET /api/monitoring/orders
// Request: {}
// Response: { orders: Array<Order> }
router.get('/orders', requireUser(), async (req: Request, res: Response) => {
  try {
    console.log(`[MonitoringRoutes] GET /orders - User: ${req.user?._id}`);

    const orders = await monitoringService.getActiveOrders(req.user!._id.toString());

    res.status(200).json({ orders });
  } catch (error) {
    console.error('[MonitoringRoutes] Error fetching active orders:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch active orders'
    });
  }
});

// Description: Cancel an order
// Endpoint: POST /api/monitoring/orders/:orderId/cancel
// Request: {}
// Response: { order: Order }
router.post('/orders/:orderId/cancel', requireUser(), async (req: Request, res: Response) => {
  try {
    console.log(`[MonitoringRoutes] POST /orders/${req.params.orderId}/cancel - User: ${req.user?._id}`);

    const order = await monitoringService.cancelOrder(req.user!._id.toString(), req.params.orderId);

    res.status(200).json({ order });
  } catch (error) {
    console.error('[MonitoringRoutes] Error cancelling order:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to cancel order'
    });
  }
});

// Description: Get activity log
// Endpoint: GET /api/monitoring/activity
// Request: { limit?: number, type?: string, symbol?: string }
// Response: { activities: Array<ActivityLog> }
router.get('/activity', requireUser(), async (req: Request, res: Response) => {
  try {
    console.log(`[MonitoringRoutes] GET /activity - User: ${req.user?._id}`);

    const { limit, type, symbol } = req.query;

    const activities = await monitoringService.getActivityLog(req.user!._id.toString(), {
      limit: limit ? parseInt(limit as string) : undefined,
      type: type as string,
      symbol: symbol as string
    });

    res.status(200).json({ activities });
  } catch (error) {
    console.error('[MonitoringRoutes] Error fetching activity log:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch activity log'
    });
  }
});

// Description: Get alerts
// Endpoint: GET /api/monitoring/alerts
// Request: { unreadOnly?: boolean, type?: string, limit?: number }
// Response: { alerts: Array<Alert> }
router.get('/alerts', requireUser(), async (req: Request, res: Response) => {
  try {
    console.log(`[MonitoringRoutes] GET /alerts - User: ${req.user?._id}`);

    const { unreadOnly, type, limit } = req.query;

    const alerts = await monitoringService.getAlerts(req.user!._id.toString(), {
      unreadOnly: unreadOnly === 'true',
      type: type as 'critical' | 'warning' | 'info',
      limit: limit ? parseInt(limit as string) : undefined
    });

    res.status(200).json({ alerts });
  } catch (error) {
    console.error('[MonitoringRoutes] Error fetching alerts:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch alerts'
    });
  }
});

// Description: Mark alert as read
// Endpoint: POST /api/monitoring/alerts/:alertId/read
// Request: {}
// Response: { alert: Alert }
router.post('/alerts/:alertId/read', requireUser(), async (req: Request, res: Response) => {
  try {
    console.log(`[MonitoringRoutes] POST /alerts/${req.params.alertId}/read - User: ${req.user?._id}`);

    const alert = await monitoringService.markAlertAsRead(req.user!._id.toString(), req.params.alertId);

    res.status(200).json({ alert });
  } catch (error) {
    console.error('[MonitoringRoutes] Error marking alert as read:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to mark alert as read'
    });
  }
});

// Description: Acknowledge alert
// Endpoint: POST /api/monitoring/alerts/:alertId/acknowledge
// Request: {}
// Response: { alert: Alert }
router.post('/alerts/:alertId/acknowledge', requireUser(), async (req: Request, res: Response) => {
  try {
    console.log(`[MonitoringRoutes] POST /alerts/${req.params.alertId}/acknowledge - User: ${req.user?._id}`);

    const alert = await monitoringService.acknowledgeAlert(req.user!._id.toString(), req.params.alertId);

    res.status(200).json({ alert });
  } catch (error) {
    console.error('[MonitoringRoutes] Error acknowledging alert:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to acknowledge alert'
    });
  }
});


// Description: Get a comprehensive health summary
// Endpoint: GET /api/monitoring/health-summary
// Request: {}
// Response: { ... }
router.get(
  "/health-summary",
  requireUser(),
  async (req: Request, res: Response) => {
    try {
      console.log(`[MonitoringRoutes] GET /health-summary - User: ${req.user?._id}`);
      const summary = await monitoringService.getHealthSummary(
        req.user!._id.toString()
      );
      res.status(200).json(summary);
    } catch (error) {
      console.error("[MonitoringRoutes] Error fetching health summary:", error);
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch health summary",
      });
    }
  }
);

export default router;
