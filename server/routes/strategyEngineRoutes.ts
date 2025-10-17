import express from 'express';
import { requireUser } from './middlewares/auth';
import * as strategyEngine from '../services/strategyEngine';
import * as bracketOrderService from '../services/bracketOrderService';

const router = express.Router();

// Description: Run strategy analysis manually
// Endpoint: POST /api/strategy-engine/analyze
// Request: {}
// Response: { signals: Array<SignalResult>, count: number }
router.post('/analyze', requireUser(), async (req, res) => {
  try {
    console.log(`[Strategy Engine API] Running analysis for user ${req.user._id}`);

    const signals = await strategyEngine.runStrategyAnalysis(req.user._id.toString());

    res.status(200).json({
      signals,
      count: signals.length,
      buySignals: signals.filter((s) => s.signalType === 'buy').length,
    });
  } catch (error: unknown) {
    console.error('[Strategy Engine API] Error running analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to run strategy analysis';
    res.status(500).json({
      error: errorMessage,
    });
  }
});

// Description: Get unexecuted signals
// Endpoint: GET /api/strategy-engine/signals/unexecuted
// Request: {}
// Response: { signals: Array<StrategySignal> }
router.get('/signals/unexecuted', requireUser(), async (req, res) => {
  try {
    const signals = await strategyEngine.getUnexecutedSignals(req.user._id.toString());

    res.status(200).json({ signals });
  } catch (error: unknown) {
    console.error('[Strategy Engine API] Error fetching unexecuted signals:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch unexecuted signals';
    res.status(500).json({
      error: errorMessage,
    });
  }
});

// Description: Get recent signals
// Endpoint: GET /api/strategy-engine/signals/recent
// Request: { limit?: number }
// Response: { signals: Array<StrategySignal> }
router.get('/signals/recent', requireUser(), async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const signals = await strategyEngine.getRecentSignals(req.user._id.toString(), limit);

    res.status(200).json({ signals });
  } catch (error: unknown) {
    console.error('[Strategy Engine API] Error fetching recent signals:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch recent signals';
    res.status(500).json({
      error: errorMessage,
    });
  }
});

// Description: Submit a bracket order
// Endpoint: POST /api/strategy-engine/bracket-order
// Request: { symbol: string, quantity: number, takeProfit: number, stopLoss: number, side?: 'buy' | 'sell', timeInForce?: string }
// Response: { order: BracketOrderResponse, success: boolean }
router.post('/bracket-order', requireUser(), async (req, res) => {
  try {
    const { symbol, quantity, takeProfit, stopLoss, side, timeInForce } = req.body;

    if (!symbol || !quantity || !takeProfit || !stopLoss) {
      return res.status(400).json({
        error: 'Missing required fields: symbol, quantity, takeProfit, stopLoss',
      });
    }

    console.log(`[Strategy Engine API] Submitting bracket order for ${symbol}`);

    const order = await bracketOrderService.submitBracketOrder(req.user._id.toString(), {
      symbol,
      quantity,
      takeProfit,
      stopLoss,
      side,
      timeInForce,
    });

    res.status(200).json({ order, success: true });
  } catch (error: unknown) {
    console.error('[Strategy Engine API] Error submitting bracket order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to submit bracket order';
    res.status(500).json({
      error: errorMessage,
    });
  }
});

// Description: Get order status
// Endpoint: GET /api/strategy-engine/order/:orderId
// Request: {}
// Response: { order: BracketOrderResponse }
router.get('/order/:orderId', requireUser(), async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await bracketOrderService.getOrderStatus(req.user._id.toString(), orderId);

    res.status(200).json({ order });
  } catch (error: unknown) {
    console.error('[Strategy Engine API] Error fetching order status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch order status';
    res.status(500).json({
      error: errorMessage,
    });
  }
});

// Description: Cancel an order
// Endpoint: DELETE /api/strategy-engine/order/:orderId
// Request: {}
// Response: { success: boolean, message: string }
router.delete('/order/:orderId', requireUser(), async (req, res) => {
  try {
    const { orderId } = req.params;

    await bracketOrderService.cancelOrder(req.user._id.toString(), orderId);

    res.status(200).json({
      success: true,
      message: `Order ${orderId} canceled successfully`,
    });
  } catch (error: unknown) {
    console.error('[Strategy Engine API] Error canceling order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel order';
    res.status(500).json({
      error: errorMessage,
    });
  }
});

export default router;
