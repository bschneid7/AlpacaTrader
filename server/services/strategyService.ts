import mongoose from 'mongoose';
import StrategyConfig, { IStrategyConfig, DEFAULT_AGGRESSIVE_STRATEGY } from '../models/StrategyConfig';
import Position from '../models/Position';

/**
 * Get user's strategy configuration
 */
export const getStrategyConfig = async (userId: string): Promise<IStrategyConfig> => {
  console.log(`[StrategyService] Fetching strategy config for user: ${userId}`);

  try {
    let strategyConfig = await StrategyConfig.findOne({ userId });

    // If no config exists, create one with default values
    if (!strategyConfig) {
      console.log(`[StrategyService] No strategy config found for user ${userId}, creating default config`);
      strategyConfig = await StrategyConfig.create({
        userId,
        ...DEFAULT_AGGRESSIVE_STRATEGY,
      });
      console.log(`[StrategyService] Created default strategy config for user ${userId}`);
    }

    return strategyConfig;
  } catch (error) {
    console.error(`[StrategyService] Error fetching strategy config for user ${userId}:`, error);
    throw new Error(`Failed to fetch strategy configuration: ${error.message}`);
  }
};

/**
 * Update user's strategy configuration
 */
export const updateStrategyConfig = async (
  userId: string,
  updates: Partial<IStrategyConfig>
): Promise<IStrategyConfig> => {
  console.log(`[StrategyService] Updating strategy config for user: ${userId}`);

  try {
    // Validate updates
    if (updates.maxPositionSize !== undefined && (updates.maxPositionSize < 5 || updates.maxPositionSize > 25)) {
      throw new Error('Max position size must be between 5 and 25');
    }

    if (
      updates.maxConcurrentPositions !== undefined &&
      (updates.maxConcurrentPositions < 3 || updates.maxConcurrentPositions > 15)
    ) {
      throw new Error('Max concurrent positions must be between 3 and 15');
    }

    if (
      updates.stopLossPercentage !== undefined &&
      (updates.stopLossPercentage < 1 || updates.stopLossPercentage > 10)
    ) {
      throw new Error('Stop loss percentage must be between 1 and 10');
    }

    if (updates.takeProfitTarget !== undefined && (updates.takeProfitTarget < 5 || updates.takeProfitTarget > 20)) {
      throw new Error('Take profit target must be between 5 and 20');
    }

    if (updates.minStockPrice !== undefined && updates.minStockPrice < 0) {
      throw new Error('Minimum stock price must be non-negative');
    }

    if (updates.minDailyVolume !== undefined && updates.minDailyVolume < 0) {
      throw new Error('Minimum daily volume must be non-negative');
    }

    // Find and update the strategy config
    let strategyConfig = await StrategyConfig.findOne({ userId });

    if (!strategyConfig) {
      console.log(`[StrategyService] No strategy config found for user ${userId}, creating with updates`);
      strategyConfig = await StrategyConfig.create({
        userId,
        ...DEFAULT_AGGRESSIVE_STRATEGY,
        ...updates,
      });
    } else {
      Object.assign(strategyConfig, updates);
      await strategyConfig.save();
    }

    console.log(`[StrategyService] Successfully updated strategy config for user ${userId}`);
    return strategyConfig;
  } catch (error) {
    console.error(`[StrategyService] Error updating strategy config for user ${userId}:`, error);
    throw new Error(`Failed to update strategy configuration: ${error.message}`);
  }
};

/**
 * Reset user's strategy configuration to default aggressive strategy
 */
export const resetStrategyToDefaults = async (userId: string): Promise<IStrategyConfig> => {
  console.log(`[StrategyService] Resetting strategy config to defaults for user: ${userId}`);

  try {
    let strategyConfig = await StrategyConfig.findOne({ userId });

    if (!strategyConfig) {
      console.log(`[StrategyService] No strategy config found for user ${userId}, creating with defaults`);
      strategyConfig = await StrategyConfig.create({
        userId,
        ...DEFAULT_AGGRESSIVE_STRATEGY,
      });
    } else {
      Object.assign(strategyConfig, DEFAULT_AGGRESSIVE_STRATEGY);
      await strategyConfig.save();
    }

    console.log(`[StrategyService] Successfully reset strategy config to defaults for user ${userId}`);
    return strategyConfig;
  } catch (error) {
    console.error(`[StrategyService] Error resetting strategy config for user ${userId}:`, error);
    throw new Error(`Failed to reset strategy configuration: ${error.message}`);
  }
};

/**
 * Get strategy performance metrics
 */
export const getStrategyPerformance = async (userId: string) => {
  console.log(`[StrategyService] Calculating strategy performance for user: ${userId}`);

  try {
    // Get all closed positions for the user
    const closedPositions = await Position.find({
      userId,
      status: 'closed',
    }).sort({ exitTime: -1 });

    if (closedPositions.length === 0) {
      console.log(`[StrategyService] No closed positions found for user ${userId}`);
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        totalProfit: 0,
        totalLoss: 0,
        netProfit: 0,
        averageTradeDuration: 0,
        largestWin: 0,
        largestLoss: 0,
      };
    }

    // Calculate metrics
    const winningTrades = closedPositions.filter((p) => (p.profitLoss || 0) > 0);
    const losingTrades = closedPositions.filter((p) => (p.profitLoss || 0) <= 0);

    const totalProfit = winningTrades.reduce((sum, p) => sum + (p.profitLoss || 0), 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, p) => sum + (p.profitLoss || 0), 0));

    const averageWin = winningTrades.length > 0 ? totalProfit / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLoss / losingTrades.length : 0;

    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    // Calculate average trade duration (in hours)
    const tradesWithDuration = closedPositions.filter((p) => p.entryTime && p.exitTime);
    const averageTradeDuration =
      tradesWithDuration.length > 0
        ? tradesWithDuration.reduce((sum, p) => {
            const duration = (new Date(p.exitTime!).getTime() - new Date(p.entryTime!).getTime()) / (1000 * 60 * 60);
            return sum + duration;
          }, 0) / tradesWithDuration.length
        : 0;

    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map((p) => p.profitLoss || 0)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map((p) => p.profitLoss || 0)) : 0;

    const performance = {
      totalTrades: closedPositions.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / closedPositions.length) * 100,
      averageWin: Math.round(averageWin * 100) / 100,
      averageLoss: Math.round(averageLoss * 100) / 100,
      profitFactor: Math.round(profitFactor * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      totalLoss: Math.round(totalLoss * 100) / 100,
      netProfit: Math.round((totalProfit - totalLoss) * 100) / 100,
      averageTradeDuration: Math.round(averageTradeDuration * 100) / 100, // in hours
      largestWin: Math.round(largestWin * 100) / 100,
      largestLoss: Math.round(largestLoss * 100) / 100,
    };

    console.log(`[StrategyService] Successfully calculated performance for user ${userId}:`, performance);
    return performance;
  } catch (error) {
    console.error(`[StrategyService] Error calculating strategy performance for user ${userId}:`, error);
    throw new Error(`Failed to calculate strategy performance: ${error.message}`);
  }
};
