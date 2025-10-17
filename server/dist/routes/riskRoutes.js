import express from 'express';
import { requireUser } from './middlewares/auth';
import riskService from '../services/riskService';
const router = express.Router();
// Description: Get risk metrics for the authenticated user
// Endpoint: GET /api/risk/metrics
// Request: {}
// Response: { metrics: IRiskMetrics }
router.get('/metrics', requireUser(), async (req, res) => {
    try {
        console.log(`[RiskRoutes] GET /api/risk/metrics - User: ${req.user._id}`);
        const metrics = await riskService.getRiskMetrics(req.user._id.toString());
        res.status(200).json({ metrics });
    }
    catch (error) {
        console.error(`[RiskRoutes] Error fetching risk metrics:`, error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch risk metrics'
        });
    }
});
// Description: Calculate fresh risk metrics for the authenticated user
// Endpoint: POST /api/risk/metrics/calculate
// Request: {}
// Response: { metrics: IRiskMetrics }
router.post('/metrics/calculate', requireUser(), async (req, res) => {
    try {
        console.log(`[RiskRoutes] POST /api/risk/metrics/calculate - User: ${req.user._id}`);
        const metrics = await riskService.calculateRiskMetrics(req.user._id.toString());
        res.status(200).json({ metrics });
    }
    catch (error) {
        console.error(`[RiskRoutes] Error calculating risk metrics:`, error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to calculate risk metrics'
        });
    }
});
// Description: Get risk limits for the authenticated user
// Endpoint: GET /api/risk/limits
// Request: {}
// Response: { limits: IRiskLimits }
router.get('/limits', requireUser(), async (req, res) => {
    try {
        console.log(`[RiskRoutes] GET /api/risk/limits - User: ${req.user._id}`);
        const limits = await riskService.getRiskLimits(req.user._id.toString());
        res.status(200).json({ limits });
    }
    catch (error) {
        console.error(`[RiskRoutes] Error fetching risk limits:`, error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to fetch risk limits'
        });
    }
});
// Description: Update risk limits for the authenticated user
// Endpoint: PUT /api/risk/limits
// Request: { dailyLossLimit?, portfolioDrawdownLimit?, positionLossThreshold?, dailyLossThreshold?, drawdownThreshold?, volatilityThreshold?, haltTradingOnDailyLimit?, haltTradingOnDrawdown? }
// Response: { limits: IRiskLimits, message: string }
router.put('/limits', requireUser(), async (req, res) => {
    try {
        console.log(`[RiskRoutes] PUT /api/risk/limits - User: ${req.user._id}`);
        const updates = req.body;
        // Validate required fields exist in updates
        const allowedFields = [
            'dailyLossLimit',
            'portfolioDrawdownLimit',
            'positionLossThreshold',
            'dailyLossThreshold',
            'drawdownThreshold',
            'volatilityThreshold',
            'haltTradingOnDailyLimit',
            'haltTradingOnDrawdown'
        ];
        const updateKeys = Object.keys(updates);
        const hasValidFields = updateKeys.some(key => allowedFields.includes(key));
        if (!hasValidFields) {
            return res.status(400).json({
                error: 'No valid fields provided for update'
            });
        }
        const limits = await riskService.updateRiskLimits(req.user._id.toString(), updates);
        res.status(200).json({
            limits,
            message: 'Risk limits updated successfully'
        });
    }
    catch (error) {
        console.error(`[RiskRoutes] Error updating risk limits:`, error);
        res.status(400).json({
            error: error instanceof Error ? error.message : 'Failed to update risk limits'
        });
    }
});
// Description: Emergency stop - close all positions and halt trading
// Endpoint: POST /api/risk/emergency-stop
// Request: { confirmation: string }
// Response: { success: boolean, message: string, closedPositions: number }
router.post('/emergency-stop', requireUser(), async (req, res) => {
    try {
        console.log(`[RiskRoutes] POST /api/risk/emergency-stop - User: ${req.user._id}`);
        const { confirmation } = req.body;
        // Require confirmation
        if (confirmation !== 'CONFIRM') {
            return res.status(400).json({
                error: 'Confirmation required. Please send "CONFIRM" in the confirmation field.'
            });
        }
        const result = await riskService.emergencyStopAllPositions(req.user._id.toString());
        res.status(200).json(result);
    }
    catch (error) {
        console.error(`[RiskRoutes] Error during emergency stop:`, error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Emergency stop failed'
        });
    }
});
// Description: Check if risk limits are breached
// Endpoint: GET /api/risk/check-breaches
// Request: {}
// Response: { breached: boolean, breaches: string[], shouldHaltTrading: boolean }
router.get('/check-breaches', requireUser(), async (req, res) => {
    try {
        console.log(`[RiskRoutes] GET /api/risk/check-breaches - User: ${req.user._id}`);
        const result = await riskService.checkRiskLimitBreaches(req.user._id.toString());
        res.status(200).json(result);
    }
    catch (error) {
        console.error(`[RiskRoutes] Error checking risk breaches:`, error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to check risk breaches'
        });
    }
});
export default router;
//# sourceMappingURL=riskRoutes.js.map