import express from 'express';
import { requireUser } from './middlewares/auth';
import AlpacaService from '../services/alpacaService';
const router = express.Router();
// Description: Connect Alpaca Account
// Endpoint: POST /api/alpaca/connect
// Request: { apiKey: string, secretKey: string, isPaper?: boolean }
// Response: { success: boolean, accountNumber: string, accountType: string, buyingPower: number }
router.post('/connect', requireUser(), async (req, res) => {
    try {
        const { apiKey, secretKey, isPaper = true } = req.body;
        if (!apiKey || !secretKey) {
            return res.status(400).json({ error: 'API key and secret key are required' });
        }
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        console.log(`Processing Alpaca connection request for user: ${req.user.email}`);
        const alpacaAccount = await AlpacaService.connectAccount(req.user._id, apiKey, secretKey, isPaper);
        res.status(200).json({
            success: true,
            accountNumber: alpacaAccount.accountNumber,
            accountType: alpacaAccount.accountType,
            buyingPower: alpacaAccount.buyingPower,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error connecting Alpaca account: ${error.message}`);
            res.status(400).json({ error: error.message });
        }
        else {
            console.error('Unknown error connecting Alpaca account');
            res.status(500).json({ error: 'Failed to connect Alpaca account' });
        }
    }
});
// Description: Get Account Overview
// Endpoint: GET /api/alpaca/account
// Request: {}
// Response: { portfolioValue: number, todayPL: number, todayPLPercent: number, cashAvailable: number, buyingPower: number, accountNumber: string, accountType: string }
router.get('/account', requireUser(), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        console.log(`Fetching account overview for user: ${req.user.email}`);
        const accountOverview = await AlpacaService.getAccountOverview(req.user._id);
        res.status(200).json(accountOverview);
    }
    catch (error) {
        if (error instanceof Error) {
            // Only log if it's NOT the expected "account not connected" error
            if (error.message !== 'Alpaca account not connected') {
                console.error(`Error fetching account overview: ${error.message}`);
            }
            res.status(400).json({ error: error.message });
        }
        else {
            console.error('Unknown error fetching account overview');
            res.status(500).json({ error: 'Failed to fetch account overview' });
        }
    }
});
// Description: Get Current Positions
// Endpoint: GET /api/alpaca/positions
// Request: {}
// Response: { positions: Array<{ symbol: string, quantity: number, entryPrice: number, currentPrice: number, unrealizedPL: number, unrealizedPLPercent: number, positionSize: number }> }
router.get('/positions', requireUser(), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        console.log(`Fetching positions for user: ${req.user.email}`);
        const positions = await AlpacaService.getPositions(req.user._id);
        res.status(200).json({ positions });
    }
    catch (error) {
        if (error instanceof Error) {
            // Only log if it's NOT the expected "account not connected" error
            if (error.message !== 'Alpaca account not connected') {
                console.error(`Error fetching positions: ${error.message}`);
            }
            res.status(400).json({ error: error.message });
        }
        else {
            console.error('Unknown error fetching positions');
            res.status(500).json({ error: 'Failed to fetch positions' });
        }
    }
});
// Description: Disconnect Alpaca Account
// Endpoint: DELETE /api/alpaca/disconnect
// Request: {}
// Response: { success: boolean, message: string }
router.delete('/disconnect', requireUser(), async (req, res) => {
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
    }
    catch (error) {
        if (error instanceof Error) {
            // Only log if it's NOT the expected "account not found" error
            if (error.message !== 'Alpaca account not found') {
                console.error(`Error disconnecting Alpaca account: ${error.message}`);
            }
            res.status(400).json({ error: error.message });
        }
        else {
            console.error('Unknown error disconnecting Alpaca account');
            res.status(500).json({ error: 'Failed to disconnect Alpaca account' });
        }
    }
});
// Description: Get Account Connection Status
// Endpoint: GET /api/alpaca/status
// Request: {}
// Response: { isConnected: boolean, accountNumber?: string, accountType?: string, isPaperTrading?: boolean }
router.get('/status', requireUser(), async (req, res) => {
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
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error checking connection status: ${error.message}`);
            res.status(400).json({ error: error.message });
        }
        else {
            console.error('Unknown error checking connection status');
            res.status(500).json({ error: 'Failed to check connection status' });
        }
    }
});
// Description: Toggle Auto Trading
// Endpoint: POST /api/alpaca/auto-trading/toggle
// Request: { enabled: boolean }
// Response: { success: boolean, enabled: boolean, status: string, lastToggleTime: string }
router.post('/auto-trading/toggle', requireUser(), async (req, res) => {
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
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error toggling auto-trading: ${error.message}`);
            res.status(400).json({ error: error.message });
        }
        else {
            console.error('Unknown error toggling auto-trading');
            res.status(500).json({ error: 'Failed to toggle auto-trading' });
        }
    }
});
// Description: Get Auto Trading Status
// Endpoint: GET /api/alpaca/auto-trading/status
// Request: {}
// Response: { enabled: boolean, status: string, lastToggleTime: string | null, isAccountConnected: boolean }
router.get('/auto-trading/status', requireUser(), async (req, res) => {
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
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error fetching auto-trading status: ${error.message}`);
            res.status(400).json({ error: error.message });
        }
        else {
            console.error('Unknown error fetching auto-trading status');
            res.status(500).json({ error: 'Failed to fetch auto-trading status' });
        }
    }
});
// Description: Close Position
// Endpoint: POST /api/alpaca/positions/:symbol/close
// Request: { symbol: string (in URL params) }
// Response: { success: boolean, message: string, orderId?: string }
router.post('/positions/:symbol/close', requireUser(), async (req, res) => {
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
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error closing position: ${error.message}`);
            res.status(400).json({ error: error.message });
        }
        else {
            console.error('Unknown error closing position');
            res.status(500).json({ error: 'Failed to close position' });
        }
    }
});
// Description: Get Recent Trades (last 20 trades)
// Endpoint: GET /api/alpaca/trades/recent
// Request: {}
// Response: { trades: Array<{ id: string, symbol: string, side: string, quantity: number, price: number, time: string, profitLoss?: number, status: string }> }
router.get('/trades/recent', requireUser(), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        console.log(`Fetching recent trades for user: ${req.user.email}`);
        const trades = await AlpacaService.getRecentTrades(req.user._id);
        res.status(200).json({ trades });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error fetching recent trades: ${error.message}`);
            res.status(400).json({ error: error.message });
        }
        else {
            console.error('Unknown error fetching recent trades');
            res.status(500).json({ error: 'Failed to fetch recent trades' });
        }
    }
});
// Description: Get Trade History with filtering
// Endpoint: GET /api/alpaca/trades/history
// Request: { startDate?: string, endDate?: string, symbol?: string, status?: string, limit?: number, offset?: number }
// Response: { trades: Array<{ id: string, symbol: string, side: string, quantity: number, entryPrice: number, exitPrice?: number, entryTime: string, exitTime?: string, duration?: number, profitLoss?: number, profitLossPercentage?: number, status: string }>, total: number, hasMore: boolean }
router.get('/trades/history', requireUser(), async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        console.log(`Fetching trade history for user: ${req.user.email}`);
        const { startDate, endDate, symbol, status, limit, offset } = req.query;
        const options = {};
        if (startDate && typeof startDate === 'string') {
            options.startDate = new Date(startDate);
        }
        if (endDate && typeof endDate === 'string') {
            options.endDate = new Date(endDate);
        }
        if (symbol && typeof symbol === 'string') {
            options.symbol = symbol;
        }
        if (status && typeof status === 'string') {
            options.status = status;
        }
        if (limit && typeof limit === 'string') {
            options.limit = parseInt(limit, 10);
        }
        if (offset && typeof offset === 'string') {
            options.offset = parseInt(offset, 10);
        }
        const result = await AlpacaService.getTradeHistory(req.user._id, options);
        res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error fetching trade history: ${error.message}`);
            res.status(400).json({ error: error.message });
        }
        else {
            console.error('Unknown error fetching trade history');
            res.status(500).json({ error: 'Failed to fetch trade history' });
        }
    }
});
export default router;
//# sourceMappingURL=alpacaRoutes.js.map