import express, { Request, Response } from 'express';
import { requireUser } from './middlewares/auth';
import analyticsService from '../services/analyticsService';

const router = express.Router();

interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
  };
}

// Description: Get Portfolio History
// Endpoint: GET /api/analytics/portfolio-history
// Request: { timeframe?: string }
// Response: { data: Array<{ date: string, value: number }> }
router.get('/portfolio-history', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user._id.toString();
    const { timeframe = '1M' } = req.query;

    console.log(`GET /api/analytics/portfolio-history - User: ${userId}, Timeframe: ${timeframe}`);

    const data = await analyticsService.getPortfolioHistory(userId, timeframe as string);

    console.log(`Portfolio history retrieved: ${data.length} data points`);

    res.status(200).json({ data });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error in GET /api/analytics/portfolio-history:', error.message, error.stack);
      res.status(500).json({ message: error.message });
    } else {
      console.error('Unknown error in GET /api/analytics/portfolio-history:', error);
      res.status(500).json({ message: 'Failed to fetch portfolio history' });
    }
  }
});

// Description: Get Monthly Returns
// Endpoint: GET /api/analytics/monthly-returns
// Request: {}
// Response: { data: Array<{ month: string, return: number }> }
router.get('/monthly-returns', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user._id.toString();

    console.log(`GET /api/analytics/monthly-returns - User: ${userId}`);

    const data = await analyticsService.getMonthlyReturns(userId);

    console.log(`Monthly returns retrieved: ${data.length} months`);

    res.status(200).json({ data });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error in GET /api/analytics/monthly-returns:', error.message, error.stack);
      res.status(500).json({ message: error.message });
    } else {
      console.error('Unknown error in GET /api/analytics/monthly-returns:', error);
      res.status(500).json({ message: 'Failed to fetch monthly returns' });
    }
  }
});

// Description: Get Performance Metrics
// Endpoint: GET /api/analytics/performance-metrics
// Request: {}
// Response: { totalReturn: number, totalReturnPercent: number, bestTrade: object, worstTrade: object, avgWin: number, avgLoss: number, sharpeRatio: number, maxDrawdown: number }
router.get('/performance-metrics', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user._id.toString();

    console.log(`GET /api/analytics/performance-metrics - User: ${userId}`);

    const metrics = await analyticsService.getPerformanceMetrics(userId);

    console.log('Performance metrics retrieved successfully');

    res.status(200).json(metrics);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error in GET /api/analytics/performance-metrics:', error.message, error.stack);
      res.status(500).json({ message: error.message });
    } else {
      console.error('Unknown error in GET /api/analytics/performance-metrics:', error);
      res.status(500).json({ message: 'Failed to fetch performance metrics' });
    }
  }
});

// Description: Get Trade History
// Endpoint: GET /api/analytics/trade-history
// Request: {}
// Response: { trades: Array<{ date: string, symbol: string, entryPrice: number, exitPrice: number, quantity: number, duration: string, pl: number, plPercent: number }> }
router.get('/trade-history', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user._id.toString();

    console.log(`GET /api/analytics/trade-history - User: ${userId}`);

    const trades = await analyticsService.getTradeHistory(userId);

    console.log(`Trade history retrieved: ${trades.length} trades`);

    res.status(200).json({ trades });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error in GET /api/analytics/trade-history:', error.message, error.stack);
      res.status(500).json({ message: error.message });
    } else {
      console.error('Unknown error in GET /api/analytics/trade-history:', error);
      res.status(500).json({ message: 'Failed to fetch trade history' });
    }
  }
});

// Description: Record Portfolio Snapshot
// Endpoint: POST /api/analytics/portfolio-snapshot
// Request: { portfolioValue: number, equity: number, cash: number, longMarketValue?: number, shortMarketValue?: number, buyingPower?: number }
// Response: { success: boolean, message: string }
router.post('/portfolio-snapshot', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const userId = req.user._id.toString();
    const portfolioData = req.body;

    console.log(`POST /api/analytics/portfolio-snapshot - User: ${userId}`);

    if (!portfolioData.portfolioValue || !portfolioData.equity || portfolioData.cash === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: portfolioValue, equity, and cash are required',
      });
    }

    await analyticsService.recordPortfolioSnapshot(userId, portfolioData);

    console.log('Portfolio snapshot recorded successfully');

    res.status(200).json({
      success: true,
      message: 'Portfolio snapshot recorded successfully',
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error in POST /api/analytics/portfolio-snapshot:', error.message, error.stack);
      res.status(500).json({ success: false, message: error.message });
    } else {
      console.error('Unknown error in POST /api/analytics/portfolio-snapshot:', error);
      res.status(500).json({ success: false, message: 'Failed to record portfolio snapshot' });
    }
  }
});

export default router;
