import express from 'express';
import { requireUser } from './middlewares/auth';
import * as strategyService from '../services/strategyService';

const router = express.Router();

// Description: Get user's strategy configuration
// Endpoint: GET /api/strategy/config
// Request: {}
// Response: { config: StrategyConfig }
router.get('/config', requireUser(), async (req, res) => {
  console.log(`[StrategyRoutes] GET /config - User: ${req.user._id}`);

  try {
    const config = await strategyService.getStrategyConfig(req.user._id.toString());

    console.log(`[StrategyRoutes] Successfully retrieved strategy config for user ${req.user._id}`);
    res.status(200).json({ config });
  } catch (error) {
    console.error(`[StrategyRoutes] Error retrieving strategy config:`, error);
    res.status(500).json({
      error: error.message || 'Failed to retrieve strategy configuration',
    });
  }
});

// Description: Update user's strategy configuration
// Endpoint: PUT /api/strategy/config
// Request: { Partial<StrategyConfig> }
// Response: { config: StrategyConfig, message: string }
router.put('/config', requireUser(), async (req, res) => {
  console.log(`[StrategyRoutes] PUT /config - User: ${req.user._id}`);

  try {
    const updates = req.body;

    if (!updates || Object.keys(updates).length === 0) {
      console.log(`[StrategyRoutes] No updates provided in request body`);
      return res.status(400).json({
        error: 'No configuration updates provided',
      });
    }

    // Remove fields that shouldn't be updated directly
    delete updates.userId;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;
    delete updates.__v;

    const config = await strategyService.updateStrategyConfig(req.user._id.toString(), updates);

    console.log(`[StrategyRoutes] Successfully updated strategy config for user ${req.user._id}`);
    res.status(200).json({
      config,
      message: 'Strategy configuration updated successfully',
    });
  } catch (error) {
    console.error(`[StrategyRoutes] Error updating strategy config:`, error);

    // Send appropriate status code based on error type
    const statusCode = error.message.includes('must be between') || error.message.includes('must be') ? 400 : 500;

    res.status(statusCode).json({
      error: error.message || 'Failed to update strategy configuration',
    });
  }
});

// Description: Reset user's strategy configuration to defaults
// Endpoint: POST /api/strategy/config/reset
// Request: {}
// Response: { config: StrategyConfig, message: string }
router.post('/config/reset', requireUser(), async (req, res) => {
  console.log(`[StrategyRoutes] POST /config/reset - User: ${req.user._id}`);

  try {
    const config = await strategyService.resetStrategyToDefaults(req.user._id.toString());

    console.log(`[StrategyRoutes] Successfully reset strategy config to defaults for user ${req.user._id}`);
    res.status(200).json({
      config,
      message: 'Strategy configuration reset to defaults successfully',
    });
  } catch (error) {
    console.error(`[StrategyRoutes] Error resetting strategy config:`, error);
    res.status(500).json({
      error: error.message || 'Failed to reset strategy configuration',
    });
  }
});

// Description: Get strategy performance metrics
// Endpoint: GET /api/strategy/performance
// Request: {}
// Response: { performance: StrategyPerformance }
router.get('/performance', requireUser(), async (req, res) => {
  console.log(`[StrategyRoutes] GET /performance - User: ${req.user._id}`);

  try {
    const performance = await strategyService.getStrategyPerformance(req.user._id.toString());

    console.log(`[StrategyRoutes] Successfully retrieved strategy performance for user ${req.user._id}`);
    res.status(200).json({ performance });
  } catch (error) {
    console.error(`[StrategyRoutes] Error retrieving strategy performance:`, error);
    res.status(500).json({
      error: error.message || 'Failed to retrieve strategy performance',
    });
  }
});

export default router;
