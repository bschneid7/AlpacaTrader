import mongoose from 'mongoose';
import axios, { AxiosInstance } from 'axios';
import RiskLimits, { IRiskLimits } from '../models/RiskLimits';
import RiskMetrics, { IRiskMetrics, ISectorConcentration, IPositionConcentration } from '../models/RiskMetrics';
import Position from '../models/Position';
import Trade from '../models/Trade';
import AlpacaAccount from '../models/AlpacaAccount';

// Sector mapping for stocks (simplified)
const SECTOR_MAPPING: Record<string, string> = {
  'AAPL': 'Technology',
  'MSFT': 'Technology',
  'GOOGL': 'Technology',
  'GOOG': 'Technology',
  'AMZN': 'Consumer Cyclical',
  'META': 'Technology',
  'TSLA': 'Consumer Cyclical',
  'NVDA': 'Technology',
  'JPM': 'Financial Services',
  'V': 'Financial Services',
  'MA': 'Financial Services',
  'JNJ': 'Healthcare',
  'UNH': 'Healthcare',
  'PFE': 'Healthcare',
  'XOM': 'Energy',
  'CVX': 'Energy',
  'WMT': 'Consumer Defensive',
  'PG': 'Consumer Defensive',
  'KO': 'Consumer Defensive',
  'DIS': 'Communication Services',
  'NFLX': 'Communication Services'
};

class RiskService {
  /**
   * Get or create risk limits for a user
   */
  async getRiskLimits(userId: string): Promise<IRiskLimits> {
    try {
      console.log(`[RiskService] Getting risk limits for user: ${userId}`);

      let riskLimits = await RiskLimits.findOne({ userId });

      if (!riskLimits) {
        console.log(`[RiskService] No risk limits found, creating default for user: ${userId}`);
        riskLimits = await RiskLimits.create({ userId });
      }

      return riskLimits;
    } catch (error) {
      console.error(`[RiskService] Error getting risk limits: ${error}`);
      throw new Error(`Failed to get risk limits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update risk limits for a user
   */
  async updateRiskLimits(userId: string, updates: Partial<IRiskLimits>): Promise<IRiskLimits> {
    try {
      console.log(`[RiskService] Updating risk limits for user: ${userId}`);

      // Validate updates
      if (updates.dailyLossLimit) {
        if (updates.dailyLossLimit.value < 0 || updates.dailyLossLimit.value > 100) {
          throw new Error('Daily loss limit must be between 0 and 100');
        }
      }

      if (updates.portfolioDrawdownLimit) {
        if (updates.portfolioDrawdownLimit.value < 0 || updates.portfolioDrawdownLimit.value > 100) {
          throw new Error('Portfolio drawdown limit must be between 0 and 100');
        }
      }

      const riskLimits = await RiskLimits.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true, upsert: true }
      );

      if (!riskLimits) {
        throw new Error('Failed to update risk limits');
      }

      console.log(`[RiskService] Risk limits updated successfully for user: ${userId}`);
      return riskLimits;
    } catch (error) {
      console.error(`[RiskService] Error updating risk limits: ${error}`);
      throw new Error(`Failed to update risk limits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate real-time risk metrics for a user
   */
  async calculateRiskMetrics(userId: string): Promise<IRiskMetrics> {
    try {
      console.log(`[RiskService] Calculating risk metrics for user: ${userId}`);

      // Get user's Alpaca account
      const alpacaAccount = await AlpacaAccount.findOne({ userId });
      if (!alpacaAccount || !alpacaAccount.isConnected) {
        console.log(`[RiskService] No connected Alpaca account found, returning default metrics`);

        // Return default/zero metrics for users without connected accounts
        const defaultMetrics = await RiskMetrics.create({
          userId,
          currentRiskExposure: 0,
          portfolioValue: 0,
          cashAvailable: 0,
          dailyPnL: 0,
          dailyPnLPercentage: 0,
          peakPortfolioValue: 0,
          currentDrawdown: 0,
          maxDrawdown: 0,
          sectorConcentration: [],
          positionConcentration: [],
          correlationMatrix: {},
          volatilityIndex: 0,
          calculatedAt: new Date()
        });

        return defaultMetrics;
      }

      // Get current positions
      const positions = await Position.find({
        userId,
        status: 'open'
      });

      console.log(`[RiskService] Found ${positions.length} open positions`);

      // Initialize Alpaca client
      const apiKey = alpacaAccount.getDecryptedApiKey();
      const secretKey = alpacaAccount.getDecryptedSecretKey();
      const baseURL = alpacaAccount.isPaperTrading
        ? 'https://paper-api.alpaca.markets'
        : 'https://api.alpaca.markets';

      const alpacaClient = axios.create({
        baseURL,
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': secretKey,
        },
      });

      // Get account info
      const accountResponse = await alpacaClient.get('/v2/account');
      const account = accountResponse.data;
      const portfolioValue = parseFloat(account.portfolio_value);
      const cashAvailable = parseFloat(account.cash);
      const equity = parseFloat(account.equity);
      const lastEquity = parseFloat(account.last_equity);

      // Calculate daily P&L
      const dailyPnL = equity - lastEquity;
      const dailyPnLPercentage = lastEquity > 0 ? (dailyPnL / lastEquity) * 100 : 0;

      // Calculate peak portfolio value and drawdown
      const historicalMetrics = await RiskMetrics.find({ userId })
        .sort({ calculatedAt: -1 })
        .limit(100)
        .exec();

      let peakPortfolioValue = portfolioValue;
      if (historicalMetrics.length > 0) {
        const historicalPeak = Math.max(...historicalMetrics.map(m => m.portfolioValue));
        peakPortfolioValue = Math.max(portfolioValue, historicalPeak);
      }

      const currentDrawdown = peakPortfolioValue > 0
        ? ((peakPortfolioValue - portfolioValue) / peakPortfolioValue) * 100
        : 0;

      const maxDrawdown = historicalMetrics.length > 0
        ? Math.max(currentDrawdown, ...historicalMetrics.map(m => m.currentDrawdown))
        : currentDrawdown;

      // Calculate sector concentration
      const sectorConcentration = this.calculateSectorConcentration(positions, portfolioValue);

      // Calculate position concentration
      const positionConcentration = this.calculatePositionConcentration(positions, portfolioValue);

      // Calculate risk exposure (percentage of portfolio in open positions)
      const totalPositionValue = positions.reduce((sum, pos) => sum + pos.currentValue, 0);
      const currentRiskExposure = portfolioValue > 0 ? (totalPositionValue / portfolioValue) * 100 : 0;

      // Calculate correlation matrix (simplified - would need historical price data for real implementation)
      const correlationMatrix = this.calculateCorrelationMatrix(positions);

      // Calculate volatility index (simplified)
      const volatilityIndex = this.calculateVolatilityIndex(positions, historicalMetrics);

      // Create or update risk metrics
      const riskMetrics = await RiskMetrics.create({
        userId,
        currentRiskExposure,
        portfolioValue,
        cashAvailable,
        dailyPnL,
        dailyPnLPercentage,
        peakPortfolioValue,
        currentDrawdown,
        maxDrawdown,
        sectorConcentration,
        positionConcentration,
        correlationMatrix,
        volatilityIndex,
        calculatedAt: new Date()
      });

      console.log(`[RiskService] Risk metrics calculated successfully - Exposure: ${currentRiskExposure.toFixed(2)}%, Drawdown: ${currentDrawdown.toFixed(2)}%`);

      return riskMetrics;
    } catch (error) {
      console.error(`[RiskService] Error calculating risk metrics: ${error}`);
      throw new Error(`Failed to calculate risk metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get latest risk metrics for a user
   */
  async getRiskMetrics(userId: string): Promise<IRiskMetrics> {
    try {
      console.log(`[RiskService] Getting latest risk metrics for user: ${userId}`);

      // Try to get recent metrics (within last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      let riskMetrics = await RiskMetrics.findOne({
        userId,
        calculatedAt: { $gte: fiveMinutesAgo }
      }).sort({ calculatedAt: -1 });

      // If no recent metrics, calculate new ones
      if (!riskMetrics) {
        console.log(`[RiskService] No recent metrics found, calculating new ones`);
        riskMetrics = await this.calculateRiskMetrics(userId);
      }

      return riskMetrics;
    } catch (error) {
      console.error(`[RiskService] Error getting risk metrics: ${error}`);
      throw new Error(`Failed to get risk metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emergency stop - close all positions
   */
  async emergencyStopAllPositions(userId: string): Promise<{ success: boolean; message: string; closedPositions: number }> {
    try {
      console.log(`[RiskService] EMERGENCY STOP initiated for user: ${userId}`);

      // Get user's Alpaca account
      const alpacaAccount = await AlpacaAccount.findOne({ userId });
      if (!alpacaAccount) {
        throw new Error('Alpaca account not found');
      }

      if (!alpacaAccount.isConnected) {
        throw new Error('Alpaca account is not connected');
      }

      // Initialize Alpaca client
      const apiKey = alpacaAccount.getDecryptedApiKey();
      const secretKey = alpacaAccount.getDecryptedSecretKey();
      const baseURL = alpacaAccount.isPaperTrading
        ? 'https://paper-api.alpaca.markets'
        : 'https://api.alpaca.markets';

      const alpacaClient = axios.create({
        baseURL,
        headers: {
          'APCA-API-KEY-ID': apiKey,
          'APCA-API-SECRET-KEY': secretKey,
        },
      });

      // Get all open positions from Alpaca
      const positionsResponse = await alpacaClient.get('/v2/positions');
      const alpacaPositions = positionsResponse.data;
      console.log(`[RiskService] Found ${alpacaPositions.length} positions to close on Alpaca`);

      if (alpacaPositions.length === 0) {
        console.log(`[RiskService] No open positions to close`);
        return {
          success: true,
          message: 'No open positions to close',
          closedPositions: 0
        };
      }

      // Close all positions
      const closePromises = alpacaPositions.map(async (position: { symbol: string; current_price: string }) => {
        try {
          console.log(`[RiskService] Closing position: ${position.symbol}`);
          await alpacaClient.delete(`/v2/positions/${position.symbol}`);

          // Update position in database
          await Position.findOneAndUpdate(
            { userId, symbol: position.symbol, status: 'open' },
            {
              status: 'closed',
              exitPrice: parseFloat(position.current_price),
              exitDate: new Date(),
              closedBy: 'emergency_stop'
            }
          );

          return { symbol: position.symbol, success: true };
        } catch (error) {
          console.error(`[RiskService] Error closing position ${position.symbol}:`, error);
          return { symbol: position.symbol, success: false, error };
        }
      });

      const results = await Promise.allSettled(closePromises);
      const successfulCloses = results.filter(r => r.status === 'fulfilled').length;

      console.log(`[RiskService] Emergency stop completed - ${successfulCloses}/${alpacaPositions.length} positions closed`);

      // Disable auto-trading
      const TradingPreferences = mongoose.model('TradingPreferences');
      await TradingPreferences.findOneAndUpdate(
        { userId },
        {
          autoTradingEnabled: false,
          lastToggledAt: new Date(),
          lastToggledBy: 'emergency_stop'
        }
      );

      console.log(`[RiskService] Auto-trading disabled for user: ${userId}`);

      return {
        success: true,
        message: `Emergency stop completed. ${successfulCloses} positions closed successfully.`,
        closedPositions: successfulCloses
      };
    } catch (error) {
      console.error(`[RiskService] Error during emergency stop: ${error}`);
      throw new Error(`Emergency stop failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate sector concentration
   */
  private calculateSectorConcentration(positions: Array<{ symbol: string; currentValue: number }>, portfolioValue: number): ISectorConcentration[] {
    const sectorMap = new Map<string, number>();

    positions.forEach(position => {
      const sector = SECTOR_MAPPING[position.symbol] || 'Other';
      const currentValue = sectorMap.get(sector) || 0;
      sectorMap.set(sector, currentValue + position.currentValue);
    });

    const sectorConcentration: ISectorConcentration[] = [];
    sectorMap.forEach((value, sector) => {
      sectorConcentration.push({
        sector,
        value,
        percentage: portfolioValue > 0 ? (value / portfolioValue) * 100 : 0
      });
    });

    return sectorConcentration.sort((a, b) => b.value - a.value);
  }

  /**
   * Calculate position concentration
   */
  private calculatePositionConcentration(positions: Array<{ symbol: string; currentValue: number }>, portfolioValue: number): IPositionConcentration[] {
    return positions
      .map(position => ({
        symbol: position.symbol,
        value: position.currentValue,
        percentage: portfolioValue > 0 ? (position.currentValue / portfolioValue) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 positions
  }

  /**
   * Calculate correlation matrix (simplified)
   */
  private calculateCorrelationMatrix(positions: Array<{ symbol: string }>): Record<string, Record<string, number>> {
    // This is a simplified implementation
    // Real implementation would need historical price data to calculate actual correlations
    const matrix: Record<string, Record<string, number>> = {};

    positions.forEach(pos1 => {
      matrix[pos1.symbol] = {};
      positions.forEach(pos2 => {
        if (pos1.symbol === pos2.symbol) {
          matrix[pos1.symbol][pos2.symbol] = 1;
        } else {
          // Simplified: assume some correlation based on sector
          const sector1 = SECTOR_MAPPING[pos1.symbol] || 'Other';
          const sector2 = SECTOR_MAPPING[pos2.symbol] || 'Other';
          matrix[pos1.symbol][pos2.symbol] = sector1 === sector2 ? 0.6 : 0.2;
        }
      });
    });

    return matrix;
  }

  /**
   * Calculate volatility index (simplified)
   */
  private calculateVolatilityIndex(positions: Array<{ symbol: string }>, historicalMetrics: IRiskMetrics[]): number {
    if (historicalMetrics.length < 2) {
      return 0;
    }

    // Calculate standard deviation of portfolio value changes
    const values = historicalMetrics.slice(0, 30).map(m => m.portfolioValue);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Normalize to percentage
    return mean > 0 ? (stdDev / mean) * 100 : 0;
  }

  /**
   * Check if risk limits are breached
   */
  async checkRiskLimitBreaches(userId: string): Promise<{
    breached: boolean;
    breaches: string[];
    shouldHaltTrading: boolean;
  }> {
    try {
      const riskLimits = await this.getRiskLimits(userId);
      const riskMetrics = await this.getRiskMetrics(userId);

      const breaches: string[] = [];
      let shouldHaltTrading = false;

      // Check daily loss limit
      if (riskLimits.dailyLossLimit.enabled) {
        if (riskLimits.dailyLossLimit.type === 'percentage') {
          if (riskMetrics.dailyPnLPercentage < -riskLimits.dailyLossLimit.value) {
            breaches.push(`Daily loss limit breached: ${riskMetrics.dailyPnLPercentage.toFixed(2)}%`);
            if (riskLimits.haltTradingOnDailyLimit) {
              shouldHaltTrading = true;
            }
          }
        }
      }

      // Check drawdown limit
      if (riskLimits.portfolioDrawdownLimit.enabled) {
        if (riskMetrics.currentDrawdown > riskLimits.portfolioDrawdownLimit.value) {
          breaches.push(`Drawdown limit breached: ${riskMetrics.currentDrawdown.toFixed(2)}%`);
          if (riskLimits.haltTradingOnDrawdown) {
            shouldHaltTrading = true;
          }
        }
      }

      console.log(`[RiskService] Risk check for user ${userId}: ${breaches.length} breaches, halt trading: ${shouldHaltTrading}`);

      return {
        breached: breaches.length > 0,
        breaches,
        shouldHaltTrading
      };
    } catch (error) {
      console.error(`[RiskService] Error checking risk limit breaches: ${error}`);
      throw error;
    }
  }
}

export default new RiskService();
