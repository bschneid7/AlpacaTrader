import mongoose from 'mongoose';
import Alpaca from '@alpacahq/alpaca-trade-api';
import AlpacaAccount from '../models/AlpacaAccount';
import Position from '../models/Position';
import PortfolioHistory from '../models/PortfolioHistory';
import { decrypt } from '../utils/encryption';

interface PortfolioValue {
  totalValue: number;
  equity: number;
  cash: number;
  buyingPower: number;
  dayPL: number;
  dayPLPercent: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  lastUpdated: Date;
}

interface PositionWithPL {
  symbol: string;
  qty: number;
  avgEntryPrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  side: 'long' | 'short';
  exchange: string;
  assetClass: string;
}

// Cache for portfolio data to reduce API calls
const portfolioCache = new Map<string, { data: PortfolioValue; timestamp: number }>();
const CACHE_TTL = 10000; // 10 seconds

/**
 * Get Alpaca client for a user
 */
async function getAlpacaClient(userId: string): Promise<Alpaca> {
  console.log(`[PortfolioService] Getting Alpaca client for user ${userId}`);

  const alpacaAccount = await AlpacaAccount.findOne({ userId: new mongoose.Types.ObjectId(userId), isConnected: true });

  if (!alpacaAccount) {
    throw new Error('Alpaca account not connected');
  }

  const apiKey = decrypt(alpacaAccount.apiKey);
  const apiSecret = decrypt(alpacaAccount.secretKey);

  return new Alpaca({
    keyId: apiKey,
    secretKey: apiSecret,
    paper: alpacaAccount.isPaperTrading,
  });
}

/**
 * Calculate real-time portfolio value with P&L
 */
export async function calculatePortfolioValue(userId: string): Promise<PortfolioValue> {
  console.log(`[PortfolioService] Calculating portfolio value for user ${userId}`);

  try {
    // Check cache first
    const cached = portfolioCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[PortfolioService] Returning cached portfolio data for user ${userId}`);
      return cached.data;
    }

    const alpaca = await getAlpacaClient(userId);

    // Get account information from Alpaca
    console.log(`[PortfolioService] Fetching account data from Alpaca for user ${userId}`);
    const account = await alpaca.getAccount();

    const portfolioValue: PortfolioValue = {
      totalValue: parseFloat(account.portfolio_value),
      equity: parseFloat(account.equity),
      cash: parseFloat(account.cash),
      buyingPower: parseFloat(account.buying_power),
      dayPL: parseFloat(account.equity) - parseFloat(account.last_equity),
      dayPLPercent: ((parseFloat(account.equity) - parseFloat(account.last_equity)) / parseFloat(account.last_equity)) * 100,
      unrealizedPL: parseFloat(account.equity) - parseFloat(account.cash) - (parseFloat(account.portfolio_value) - parseFloat(account.equity)),
      unrealizedPLPercent: 0, // Will be calculated below
      lastUpdated: new Date(),
    };

    // Calculate unrealized P&L percent
    const costBasis = parseFloat(account.portfolio_value) - portfolioValue.unrealizedPL;
    if (costBasis > 0) {
      portfolioValue.unrealizedPLPercent = (portfolioValue.unrealizedPL / costBasis) * 100;
    }

    console.log(`[PortfolioService] Portfolio value calculated: $${portfolioValue.totalValue.toFixed(2)}, Day P/L: $${portfolioValue.dayPL.toFixed(2)}`);

    // Cache the result
    portfolioCache.set(userId, {
      data: portfolioValue,
      timestamp: Date.now(),
    });

    return portfolioValue;
  } catch (error) {
    console.error(`[PortfolioService] Error calculating portfolio value for user ${userId}:`, error);
    throw new Error(`Failed to calculate portfolio value: ${error.message}`);
  }
}

/**
 * Get real-time positions with current prices and unrealized P&L
 */
export async function getPositionsWithPL(userId: string): Promise<PositionWithPL[]> {
  console.log(`[PortfolioService] Fetching positions with P&L for user ${userId}`);

  try {
    const alpaca = await getAlpacaClient(userId);

    // Get positions from Alpaca
    console.log(`[PortfolioService] Fetching positions from Alpaca for user ${userId}`);
    const alpacaPositions = await alpaca.getPositions();

    console.log(`[PortfolioService] Found ${alpacaPositions.length} positions for user ${userId}`);

    const positions: PositionWithPL[] = alpacaPositions.map((pos: unknown) => {
      const position = pos as {
        symbol: string;
        qty: string;
        avg_entry_price: string;
        current_price: string;
        market_value: string;
        cost_basis: string;
        unrealized_pl: string;
        unrealized_plpc: string;
        side: 'long' | 'short';
        exchange: string;
        asset_class: string;
      };
      const qty = parseFloat(position.qty);
      const avgEntryPrice = parseFloat(position.avg_entry_price);
      const currentPrice = parseFloat(position.current_price);
      const marketValue = parseFloat(position.market_value);
      const costBasis = parseFloat(position.cost_basis);
      const unrealizedPL = parseFloat(position.unrealized_pl);
      const unrealizedPLPercent = parseFloat(position.unrealized_plpc) * 100;

      return {
        symbol: position.symbol,
        qty,
        avgEntryPrice,
        currentPrice,
        marketValue,
        costBasis,
        unrealizedPL,
        unrealizedPLPercent,
        side: position.side,
        exchange: position.exchange,
        assetClass: position.asset_class,
      };
    });

    return positions;
  } catch (error) {
    console.error(`[PortfolioService] Error fetching positions for user ${userId}:`, error);
    throw new Error(`Failed to fetch positions: ${error.message}`);
  }
}

/**
 * Sync positions to database
 */
export async function syncPositionsToDatabase(userId: string): Promise<void> {
  console.log(`[PortfolioService] Syncing positions to database for user ${userId}`);

  try {
    const positions = await getPositionsWithPL(userId);

    // Get current positions from database
    const dbPositions = await Position.find({ userId, status: 'open' });

    // Create a map of current positions by symbol
    const positionMap = new Map(positions.map(p => [p.symbol, p]));

    // Update existing positions or mark as closed
    for (const dbPos of dbPositions) {
      const alpacaPos = positionMap.get(dbPos.symbol);

      if (alpacaPos) {
        // Update existing position
        dbPos.quantity = alpacaPos.qty;
        dbPos.currentPrice = alpacaPos.currentPrice;
        dbPos.marketValue = alpacaPos.marketValue;
        dbPos.unrealizedPL = alpacaPos.unrealizedPL;
        dbPos.unrealizedPLPercent = alpacaPos.unrealizedPLPercent;
        dbPos.lastUpdated = new Date();
        await dbPos.save();
        console.log(`[PortfolioService] Updated position ${dbPos.symbol} for user ${userId}`);
      } else {
        // Position no longer exists in Alpaca, mark as closed
        dbPos.status = 'closed';
        dbPos.exitPrice = dbPos.currentPrice;
        dbPos.exitDate = new Date();
        dbPos.realizedPL = dbPos.unrealizedPL;
        dbPos.realizedPLPercent = dbPos.unrealizedPLPercent;
        await dbPos.save();
        console.log(`[PortfolioService] Marked position ${dbPos.symbol} as closed for user ${userId}`);
      }
    }

    // Add new positions that don't exist in database
    const dbSymbols = new Set(dbPositions.map(p => p.symbol));
    for (const alpacaPos of positions) {
      if (!dbSymbols.has(alpacaPos.symbol)) {
        await Position.create({
          userId,
          symbol: alpacaPos.symbol,
          quantity: alpacaPos.qty,
          entryPrice: alpacaPos.avgEntryPrice,
          currentPrice: alpacaPos.currentPrice,
          marketValue: alpacaPos.marketValue,
          unrealizedPL: alpacaPos.unrealizedPL,
          unrealizedPLPercent: alpacaPos.unrealizedPLPercent,
          side: alpacaPos.side,
          exchange: alpacaPos.exchange,
          assetClass: alpacaPos.assetClass,
          status: 'open',
          entryDate: new Date(),
          lastUpdated: new Date(),
        });
        console.log(`[PortfolioService] Created new position ${alpacaPos.symbol} for user ${userId}`);
      }
    }

    console.log(`[PortfolioService] Successfully synced ${positions.length} positions for user ${userId}`);
  } catch (error) {
    console.error(`[PortfolioService] Error syncing positions for user ${userId}:`, error);
    throw new Error(`Failed to sync positions: ${error.message}`);
  }
}

/**
 * Record portfolio snapshot to history
 */
export async function recordPortfolioSnapshot(userId: string): Promise<void> {
  console.log(`[PortfolioService] Recording portfolio snapshot for user ${userId}`);

  try {
    const portfolio = await calculatePortfolioValue(userId);
    const positions = await getPositionsWithPL(userId);

    // Check if we already have a snapshot for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingSnapshot = await PortfolioHistory.findOne({
      userId,
      date: { $gte: today },
    });

    const snapshotData = {
      userId,
      date: new Date(),
      portfolioValue: portfolio.totalValue,
      cash: portfolio.cash,
      equity: portfolio.equity,
      buyingPower: portfolio.buyingPower,
      dailyPL: portfolio.dayPL,
      dailyPLPercent: portfolio.dayPLPercent,
      unrealizedPL: portfolio.unrealizedPL,
      unrealizedPLPercent: portfolio.unrealizedPLPercent,
      positionsCount: positions.length,
    };

    if (existingSnapshot) {
      // Update existing snapshot
      Object.assign(existingSnapshot, snapshotData);
      await existingSnapshot.save();
      console.log(`[PortfolioService] Updated portfolio snapshot for user ${userId}`);
    } else {
      // Create new snapshot
      await PortfolioHistory.create(snapshotData);
      console.log(`[PortfolioService] Created new portfolio snapshot for user ${userId}`);
    }
  } catch (error) {
    console.error(`[PortfolioService] Error recording portfolio snapshot for user ${userId}:`, error);
    throw new Error(`Failed to record portfolio snapshot: ${error.message}`);
  }
}

/**
 * Get monthly performance summary
 */
export async function getMonthlyPerformance(userId: string): Promise<{ month: string; return: number; returnPercent: number }[]> {
  console.log(`[PortfolioService] Calculating monthly performance for user ${userId}`);

  try {
    const history = await PortfolioHistory.find({ userId })
      .sort({ date: 1 })
      .lean();

    if (history.length === 0) {
      return [];
    }

    const monthlyData = new Map<string, { start: number; end: number }>();

    for (const record of history) {
      const monthKey = `${record.date.getFullYear()}-${String(record.date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { start: record.portfolioValue, end: record.portfolioValue });
      } else {
        monthlyData.get(monthKey)!.end = record.portfolioValue;
      }
    }

    const results = Array.from(monthlyData.entries()).map(([month, data]) => {
      const returnValue = data.end - data.start;
      const returnPercent = data.start > 0 ? (returnValue / data.start) * 100 : 0;
      return { month, return: returnValue, returnPercent };
    });

    console.log(`[PortfolioService] Calculated ${results.length} months of performance for user ${userId}`);
    return results;
  } catch (error) {
    console.error(`[PortfolioService] Error calculating monthly performance for user ${userId}:`, error);
    throw new Error(`Failed to calculate monthly performance: ${error.message}`);
  }
}

/**
 * Clear portfolio cache for a user
 */
export function clearPortfolioCache(userId: string): void {
  console.log(`[PortfolioService] Clearing portfolio cache for user ${userId}`);
  portfolioCache.delete(userId);
}

/**
 * Clear all portfolio caches
 */
export function clearAllPortfolioCaches(): void {
  console.log(`[PortfolioService] Clearing all portfolio caches`);
  portfolioCache.clear();
}

export default {
  calculatePortfolioValue,
  getPositionsWithPL,
  syncPositionsToDatabase,
  recordPortfolioSnapshot,
  getMonthlyPerformance,
  clearPortfolioCache,
  clearAllPortfolioCaches,
};
