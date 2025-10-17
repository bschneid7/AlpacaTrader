import express, { Request, Response } from 'express';
import { requireUser } from './middlewares/auth';
import AlpacaService from '../services/alpacaService';

const router = express.Router();

interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
  };
}

// Description: Connect Alpaca Account
// Endpoint: POST /api/alpaca/connect
// Request: { apiKey: string, secretKey: string, isPaper?: boolean }
// Response: { success: boolean, accountNumber: string, accountType: string, buyingPower: number }
router.post('/connect', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    const { apiKey, secretKey, isPaper = true } = req.body;

    if (!apiKey || !secretKey) {
      return res.status(400).json({ error: 'API key and secret key are required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`Processing Alpaca connection request for user: ${req.user.email}`);

    const alpacaAccount = await AlpacaService.connectAccount(
      req.user._id,
      apiKey,
      secretKey,
      isPaper
    );

    res.status(200).json({
      success: true,
      accountNumber: alpacaAccount.accountNumber,
      accountType: alpacaAccount.accountType,
      buyingPower: alpacaAccount.buyingPower,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error connecting Alpaca account: ${error.message}`);
      res.status(400).json({ error: error.message });
    } else {
      console.error('Unknown error connecting Alpaca account');
      res.status(500).json({ error: 'Failed to connect Alpaca account' });
    }
  }
});

// Description: Get Account Overview
// Endpoint: GET /api/alpaca/account
// Request: {}
// Response: { portfolioValue: number, todayPL: number, todayPLPercent: number, cashAvailable: number, buyingPower: number, accountNumber: string, accountType: string }
router.get('/account', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`Fetching account overview for user: ${req.user.email}`);

    const accountOverview = await AlpacaService.getAccountOverview(req.user._id);

    res.status(200).json(accountOverview);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error fetching account overview: ${error.message}`);
      res.status(400).json({ error: error.message });
    } else {
      console.error('Unknown error fetching account overview');
      res.status(500).json({ error: 'Failed to fetch account overview' });
    }
  }
});

// Description: Get Current Positions
// Endpoint: GET /api/alpaca/positions
// Request: {}
// Response: { positions: Array<{ symbol: string, quantity: number, entryPrice: number, currentPrice: number, unrealizedPL: number, unrealizedPLPercent: number, positionSize: number }> }
router.get('/positions', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`Fetching positions for user: ${req.user.email}`);

    const positions = await AlpacaService.getPositions(req.user._id);

    res.status(200).json({ positions });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error fetching positions: ${error.message}`);
      res.status(400).json({ error: error.message });
    } else {
      console.error('Unknown error fetching positions');
      res.status(500).json({ error: 'Failed to fetch positions' });
    }
  }
});

// Description: Disconnect Alpaca Account
// Endpoint: DELETE /api/alpaca/disconnect
// Request: {}
// Response: { success: boolean, message: string }
router.delete('/disconnect', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`Disconnecting Alpaca account for user: ${req.user.email}`);

    await AlpacaService.disconnectAccount(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Alpaca account disconnected successfully',
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error disconnecting Alpaca account: ${error.message}`);
      res.status(400).json({ error: error.message });
    } else {
      console.error('Unknown error disconnecting Alpaca account');
      res.status(500).json({ error: 'Failed to disconnect Alpaca account' });
    }
  }
});

// Description: Get Account Connection Status
// Endpoint: GET /api/alpaca/status
// Request: {}
// Response: { isConnected: boolean, accountNumber?: string, accountType?: string, isPaperTrading?: boolean }
router.get('/status', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`Checking Alpaca connection status for user: ${req.user.email}`);

    const alpacaAccount = await AlpacaService.getAccountByUserId(req.user._id);

    if (!alpacaAccount) {
      return res.status(200).json({ isConnected: false });
    }

    res.status(200).json({
      isConnected: true,
      accountNumber: alpacaAccount.accountNumber,
      accountType: alpacaAccount.accountType,
      isPaperTrading: alpacaAccount.isPaperTrading,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error checking connection status: ${error.message}`);
      res.status(400).json({ error: error.message });
    } else {
      console.error('Unknown error checking connection status');
      res.status(500).json({ error: 'Failed to check connection status' });
    }
  }
});

// Description: Toggle Auto Trading
// Endpoint: POST /api/alpaca/auto-trading/toggle
// Request: { enabled: boolean }
// Response: { success: boolean, enabled: boolean, status: string, lastToggleTime: string }
router.post('/auto-trading/toggle', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    const { enabled } = req.body;

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ error: 'enabled field must be a boolean' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`Toggling auto-trading for user: ${req.user.email} to ${enabled}`);

    const result = await AlpacaService.toggleAutoTrading(req.user._id, enabled);

    res.status(200).json({
      success: true,
      enabled: result.enabled,
      status: result.status,
      lastToggleTime: result.lastToggleTime.toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error toggling auto-trading: ${error.message}`);
      res.status(400).json({ error: error.message });
    } else {
      console.error('Unknown error toggling auto-trading');
      res.status(500).json({ error: 'Failed to toggle auto-trading' });
    }
  }
});

// Description: Get Auto Trading Status
// Endpoint: GET /api/alpaca/auto-trading/status
// Request: {}
// Response: { enabled: boolean, status: string, lastToggleTime: string | null, isAccountConnected: boolean }
router.get('/auto-trading/status', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`Fetching auto-trading status for user: ${req.user.email}`);

    const statusData = await AlpacaService.getAutoTradingStatus(req.user._id);

    res.status(200).json({
      enabled: statusData.enabled,
      status: statusData.status,
      lastToggleTime: statusData.lastToggleTime ? statusData.lastToggleTime.toISOString() : null,
      isAccountConnected: statusData.isAccountConnected,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error fetching auto-trading status: ${error.message}`);
      res.status(400).json({ error: error.message });
    } else {
      console.error('Unknown error fetching auto-trading status');
      res.status(500).json({ error: 'Failed to fetch auto-trading status' });
    }
  }
});

// Description: Close Position
// Endpoint: POST /api/alpaca/positions/:symbol/close
// Request: { symbol: string (in URL params) }
// Response: { success: boolean, message: string, orderId?: string }
router.post('/positions/:symbol/close', requireUser(), async (req: AuthRequest, res: Response) => {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log(`Closing position ${symbol} for user: ${req.user.email}`);

    const result = await AlpacaService.closePosition(req.user._id, symbol);

    res.status(200).json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`Error closing position: ${error.message}`);
      res.status(400).json({ error: error.message });
    } else {
      console.error('Unknown error closing position');
      res.status(500).json({ error: 'Failed to close position' });
    }
  }
});

export default router;
