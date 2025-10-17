/**
 * Trading Engine Service
 * Core automated trading logic for signal generation and trade execution
 */

import Alpaca from '@alpacahq/alpaca-trade-api';
import * as strategyService from './strategyService.js';
import * as riskService from './riskService.js';
import monitoringService from './monitoringService.js';
import * as technicalIndicators from './technicalIndicators.js';
import * as strategyEngine from './strategyEngine.js';
import * as bracketOrderService from './bracketOrderService.js';
import AlpacaAccount from '../models/AlpacaAccount.js';
import Position from '../models/Position.js';
import Order from '../models/Order.js';
import TradingPreferences from '../models/TradingPreferences.js';
import WatchlistStock from '../models/WatchlistStock.js';
import StrategyConfig from '../models/StrategyConfig.js';
import mongoose from 'mongoose';

interface TradeSignal {
  symbol: string;
  action: 'buy' | 'sell';
  reason: string;
  strength: number;
  price: number;
  quantity?: number;
}

/**
 * Check if market is currently open
 */
export async function isMarketOpen(alpaca: any): Promise<boolean> {
  try {
    const clock = await alpaca.getClock();
    return clock.is_open;
  } catch (error) {
    console.error('[Trading Engine] Error checking market status:', error);
    return false;
  }
}

/**
 * Get list of tradeable stocks based on strategy configuration
 */
export async function getTradeableStocks(userId: string): Promise<string[]> {
  try {
    console.log(`[Trading Engine] Getting tradeable stocks for user ${userId}`);

    const strategy = await strategyService.getStrategyConfig(userId);

    if (!strategy) {
      console.log('[Trading Engine] No strategy config found, using default stock universe');
    }

    // Start with a curated list of liquid, well-known stocks
    const stockUniverse = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA', 'JPM',
      'V', 'MA', 'UNH', 'HD', 'DIS', 'NFLX', 'ADBE', 'CRM', 'PYPL',
      'INTC', 'AMD', 'CSCO', 'ORCL', 'IBM', 'QCOM', 'TXN', 'AVGO',
      'BA', 'GE', 'CAT', 'MMM', 'HON', 'UPS', 'FDX',
      'WMT', 'TGT', 'COST', 'NKE', 'SBUX', 'MCD',
      'JNJ', 'PFE', 'ABBV', 'TMO', 'ABT', 'LLY', 'MRK',
      'XOM', 'CVX', 'COP', 'SLB'
    ];

    // Filter based on strategy preferences
    let filteredStocks = stockUniverse;

    // Filter by sectors if specified
    if (strategy && strategy.stockUniverse && strategy.stockUniverse.sectors && strategy.stockUniverse.sectors.length > 0) {
      const sectorMapping: { [key: string]: string[] } = {
        'technology': ['AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'ADBE', 'CRM', 'INTC', 'AMD', 'CSCO', 'ORCL', 'IBM', 'QCOM', 'TXN', 'AVGO'],
        'finance': ['JPM', 'V', 'MA', 'PYPL'],
        'healthcare': ['UNH', 'JNJ', 'PFE', 'ABBV', 'TMO', 'ABT', 'LLY', 'MRK'],
        'consumer': ['AMZN', 'WMT', 'TGT', 'COST', 'NKE', 'SBUX', 'MCD', 'HD', 'DIS', 'NFLX'],
        'industrial': ['BA', 'GE', 'CAT', 'MMM', 'HON', 'UPS', 'FDX'],
        'energy': ['XOM', 'CVX', 'COP', 'SLB'],
        'automotive': ['TSLA']
      };

      const allowedStocks = new Set<string>();
      strategy.stockUniverse.sectors.forEach(sector => {
        const stocks = sectorMapping[sector.toLowerCase()] || [];
        stocks.forEach(stock => allowedStocks.add(stock));
      });

      if (allowedStocks.size > 0) {
        filteredStocks = filteredStocks.filter(stock => allowedStocks.has(stock));
      }
    }

    console.log(`[Trading Engine] Found ${filteredStocks.length} tradeable stocks after filtering`);
    return filteredStocks;
  } catch (error) {
    console.error('[Trading Engine] Error getting tradeable stocks:', error);
    throw error;
  }
}

/**
 * Fetch historical price data for technical analysis
 */
export async function fetchPriceHistory(alpaca: any, symbol: string, days: number = 60): Promise<any[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const bars = await alpaca.getBarsV2(symbol, {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      timeframe: '1Day',
      limit: days
    });

    const priceData: any[] = [];
    for await (const bar of bars) {
      priceData.push({
        timestamp: bar.Timestamp,
        open: bar.OpenPrice,
        high: bar.HighPrice,
        low: bar.LowPrice,
        close: bar.ClosePrice,
        volume: bar.Volume
      });
    }

    return priceData;
  } catch (error) {
    console.error(`[Trading Engine] Error fetching price history for ${symbol}:`, error);
    throw error;
  }
}

/**
 * Calculate position size based on strategy and risk parameters
 */
export async function calculatePositionSize(
  userId: string,
  currentPrice: number,
  buyingPower: number
): Promise<number> {
  try {
    const strategy = await strategyService.getStrategyConfig(userId);
    const maxPositionSizePercent = strategy?.riskTolerance?.maxPositionSize || 15; // Default 15%

    // Calculate max position value
    const maxPositionValue = buyingPower * (maxPositionSizePercent / 100);

    // Calculate quantity
    const quantity = Math.floor(maxPositionValue / currentPrice);

    console.log(`[Trading Engine] Calculated position size: ${quantity} shares at $${currentPrice} (${maxPositionSizePercent}% of buying power)`);

    return quantity;
  } catch (error) {
    console.error('[Trading Engine] Error calculating position size:', error);
    throw error;
  }
}

/**
 * Scan for buy opportunities
 */
export async function scanForBuySignals(userId: string, alpaca: any): Promise<TradeSignal[]> {
  try {
    console.log(`[Trading Engine] Scanning for buy signals for user ${userId}`);

    const signals: TradeSignal[] = [];
    const strategy = await strategyService.getStrategyConfig(userId);
    const riskLimits = await riskService.getRiskLimits(userId);
    const account = await alpaca.getAccount();

    // Check current positions count
    const currentPositions = await Position.find({ userId, status: 'open' });
    const maxConcurrentPositions = strategy?.riskTolerance?.maxConcurrentPositions || 8; // Default 8

    if (currentPositions.length >= maxConcurrentPositions) {
      console.log(`[Trading Engine] Max concurrent positions reached (${currentPositions.length}/${maxConcurrentPositions})`);
      return signals;
    }

    // Get tradeable stocks
    const tradeableStocks = await getTradeableStocks(userId);

    // Filter out stocks we already have positions in
    const currentSymbols = new Set(currentPositions.map(p => p.symbol));
    const candidateStocks = tradeableStocks.filter(symbol => !currentSymbols.has(symbol));

    console.log(`[Trading Engine] Analyzing ${candidateStocks.length} candidate stocks`);

    // Analyze a subset to avoid rate limits (analyze 5 stocks per cycle)
    const stocksToAnalyze = candidateStocks.slice(0, 5);

    for (const symbol of stocksToAnalyze) {
      try {
        // Fetch price history
        const priceHistory = await fetchPriceHistory(alpaca, symbol);

        if (priceHistory.length < 50) {
          console.log(`[Trading Engine] Insufficient price history for ${symbol}, skipping`);
          continue;
        }

        const currentPrice = priceHistory[priceHistory.length - 1].close;

        // Check minimum price filter
        const minPrice = strategy?.stockUniverse?.minPrice || 5; // Default $5
        if (currentPrice < minPrice) {
          console.log(`[Trading Engine] ${symbol} price $${currentPrice} below minimum $${minPrice}`);
          continue;
        }

        // Analyze technicals
        const technicals = await technicalIndicators.analyzeTechnicals(priceHistory);

        // Update watchlist
        await WatchlistStock.findOneAndUpdate(
          { userId, symbol },
          {
            userId,
            symbol,
            currentPrice,
            status: 'monitoring',
            indicators: {
              rsi: technicals.rsi,
              macd: technicals.macd.macd,
              sma20: technicals.movingAverages.sma20,
              sma50: technicals.movingAverages.sma50
            },
            lastAnalyzed: new Date()
          },
          { upsert: true, new: true }
        );

        // Check for buy signal
        if (technicalIndicators.shouldBuy(technicals)) {
          signals.push({
            symbol,
            action: 'buy',
            reason: 'technical_signal',
            strength: technicals.strength,
            price: currentPrice
          });

          console.log(`[Trading Engine] BUY SIGNAL: ${symbol} at $${currentPrice} (strength: ${technicals.strength})`);

          // Log activity
          await monitoringService.createActivityLog(
            userId,
            'analysis',
            `Buy signal detected for ${symbol}`,
            'info',
            { symbol, price: currentPrice, strength: technicals.strength, technicals }
          );
        }
      } catch (error) {
        console.error(`[Trading Engine] Error analyzing ${symbol}:`, error);
        continue;
      }
    }

    console.log(`[Trading Engine] Found ${signals.length} buy signals`);
    return signals;
  } catch (error) {
    console.error('[Trading Engine] Error scanning for buy signals:', error);
    throw error;
  }
}

/**
 * Scan existing positions for sell signals
 */
export async function scanForSellSignals(userId: string, alpaca: any): Promise<TradeSignal[]> {
  try {
    console.log(`[Trading Engine] Scanning for sell signals for user ${userId}`);

    const signals: TradeSignal[] = [];
    const strategy = await strategyService.getStrategyConfig(userId);
    const positions = await Position.find({ userId, status: 'open' });

    console.log(`[Trading Engine] Analyzing ${positions.length} open positions`);

    for (const position of positions) {
      try {
        // Fetch current price and history
        const priceHistory = await fetchPriceHistory(alpaca, position.symbol);

        if (priceHistory.length < 50) {
          continue;
        }

        const currentPrice = priceHistory[priceHistory.length - 1].close;

        // Analyze technicals
        const technicals = await technicalIndicators.analyzeTechnicals(priceHistory);

        // Check for sell signal
        const stopLoss = strategy?.riskTolerance?.stopLoss || 5; // Default 5%
        const takeProfit = strategy?.riskTolerance?.takeProfit || 12; // Default 12%
        const sellDecision = technicalIndicators.shouldSell(
          technicals,
          position.entryPrice,
          currentPrice,
          stopLoss,
          takeProfit
        );

        if (sellDecision.shouldSell) {
          signals.push({
            symbol: position.symbol,
            action: 'sell',
            reason: sellDecision.reason,
            strength: technicals.strength,
            price: currentPrice,
            quantity: position.quantity
          });

          console.log(`[Trading Engine] SELL SIGNAL: ${position.symbol} at $${currentPrice} (reason: ${sellDecision.reason})`);

          // Log activity
          await monitoringService.createActivityLog(
            userId,
            'analysis',
            `Sell signal detected for ${position.symbol} (${sellDecision.reason})`,
            'info',
            { symbol: position.symbol, price: currentPrice, reason: sellDecision.reason }
          );
        }
      } catch (error) {
        console.error(`[Trading Engine] Error analyzing position ${position.symbol}:`, error);
        continue;
      }
    }

    console.log(`[Trading Engine] Found ${signals.length} sell signals`);
    return signals;
  } catch (error) {
    console.error('[Trading Engine] Error scanning for sell signals:', error);
    throw error;
  }
}

/**
 * Execute a buy order
 */
export async function executeBuyOrder(userId: string, alpaca: any, signal: TradeSignal): Promise<void> {
  try {
    console.log(`[Trading Engine] Executing BUY order for ${signal.symbol}`);

    const account = await alpaca.getAccount();
    const buyingPower = parseFloat(account.buying_power);

    // Calculate position size
    const quantity = await calculatePositionSize(userId, signal.price, buyingPower);

    if (quantity < 1) {
      console.log(`[Trading Engine] Insufficient buying power for ${signal.symbol}`);
      await monitoringService.createAlert(
        userId,
        'warning',
        'Insufficient Buying Power',
        `Cannot buy ${signal.symbol}: insufficient funds`,
        { symbol: signal.symbol, price: signal.price }
      );
      return;
    }

    // Submit order to Alpaca
    const order = await alpaca.createOrder({
      symbol: signal.symbol,
      qty: quantity,
      side: 'buy',
      type: 'market',
      time_in_force: 'day'
    });

    console.log(`[Trading Engine] Buy order submitted: ${order.id} for ${quantity} shares of ${signal.symbol}`);

    // Save order to database
    await Order.create({
      userId,
      alpacaOrderId: order.id,
      symbol: signal.symbol,
      side: 'buy',
      quantity,
      orderType: 'market',
      status: order.status,
      submittedAt: new Date(order.submitted_at),
      metadata: {
        signal: signal.reason,
        strength: signal.strength
      }
    });

    // Log activity
    await monitoringService.createActivityLog(
      userId,
      'trade',
      `Buy order submitted: ${quantity} shares of ${signal.symbol} at ~$${signal.price}`,
      'info',
      { orderId: order.id, symbol: signal.symbol, quantity, price: signal.price }
    );

    // Create alert
    await monitoringService.createAlert(
      userId,
      'info',
      'Buy Order Submitted',
      `${quantity} shares of ${signal.symbol} at market price`,
      { orderId: order.id, symbol: signal.symbol, quantity }
    );
  } catch (error) {
    console.error(`[Trading Engine] Error executing buy order for ${signal.symbol}:`, error);

    await monitoringService.createActivityLog(
      userId,
      'error',
      `Failed to execute buy order for ${signal.symbol}: ${error.message}`,
      'error',
      { symbol: signal.symbol, error: error.message }
    );

    throw error;
  }
}

/**
 * Execute a sell order
 */
export async function executeSellOrder(userId: string, alpaca: any, signal: TradeSignal): Promise<void> {
  try {
    console.log(`[Trading Engine] Executing SELL order for ${signal.symbol}`);

    // Submit order to Alpaca
    const order = await alpaca.createOrder({
      symbol: signal.symbol,
      qty: signal.quantity,
      side: 'sell',
      type: 'market',
      time_in_force: 'day'
    });

    console.log(`[Trading Engine] Sell order submitted: ${order.id} for ${signal.quantity} shares of ${signal.symbol}`);

    // Save order to database
    await Order.create({
      userId,
      alpacaOrderId: order.id,
      symbol: signal.symbol,
      side: 'sell',
      quantity: signal.quantity,
      orderType: 'market',
      status: order.status,
      submittedAt: new Date(order.submitted_at),
      metadata: {
        reason: signal.reason,
        strength: signal.strength
      }
    });

    // Log activity
    await monitoringService.createActivityLog(
      userId,
      'trade',
      `Sell order submitted: ${signal.quantity} shares of ${signal.symbol} at ~$${signal.price} (${signal.reason})`,
      'info',
      { orderId: order.id, symbol: signal.symbol, quantity: signal.quantity, price: signal.price, reason: signal.reason }
    );

    // Create alert
    const alertType = signal.reason === 'stop_loss' ? 'critical' : 'info';
    const alertTitle = signal.reason === 'stop_loss' ? 'Stop Loss Triggered' :
                       signal.reason === 'take_profit' ? 'Take Profit Target Hit' :
                       'Sell Order Submitted';

    await monitoringService.createAlert(
      userId,
      alertType,
      alertTitle,
      `${signal.quantity} shares of ${signal.symbol} at market price`,
      { orderId: order.id, symbol: signal.symbol, quantity: signal.quantity, reason: signal.reason }
    );
  } catch (error) {
    console.error(`[Trading Engine] Error executing sell order for ${signal.symbol}:`, error);

    await monitoringService.createActivityLog(
      userId,
      'error',
      `Failed to execute sell order for ${signal.symbol}: ${error.message}`,
      'error',
      { symbol: signal.symbol, error: error.message }
    );

    throw error;
  }
}

/**
 * Execute EMA/ATR strategy with bracket orders
 */
export async function executeEMAATRStrategy(userId: string): Promise<void> {
  try {
    console.log(`[Trading Engine] Executing EMA/ATR bracket strategy for user ${userId}`);

    // Run strategy analysis
    const signals = await strategyEngine.runStrategyAnalysis(userId);

    // Filter buy signals with valid position sizes
    const executableSignals = signals.filter(
      (s) => s.signalType === 'buy' && s.positionSize && s.positionSize > 0
    );

    console.log(`[Trading Engine] Found ${executableSignals.length} executable EMA/ATR signals`);

    // Execute bracket orders for each signal
    for (const signal of executableSignals) {
      try {
        if (!signal.stopLoss || !signal.takeProfit || !signal.positionSize) {
          continue;
        }

        await bracketOrderService.submitBracketOrder(userId, {
          symbol: signal.symbol,
          quantity: signal.positionSize,
          takeProfit: signal.takeProfit,
          stopLoss: signal.stopLoss,
          side: 'buy',
          timeInForce: 'day',
        });

        // Mark signal as executed
        const strategySignal = await strategyEngine.getUnexecutedSignals(userId);
        const matchingSignal = strategySignal.find((s) => s.symbol === signal.symbol);
        if (matchingSignal) {
          await strategyEngine.markSignalExecuted(matchingSignal._id.toString(), 'pending');
        }

        // Small delay between orders
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`[Trading Engine] Error executing bracket order for ${signal.symbol}:`, error);
      }
    }

    console.log(`[Trading Engine] EMA/ATR strategy execution complete`);
  } catch (error: any) {
    console.error(`[Trading Engine] Error executing EMA/ATR strategy:`, error);
    throw error;
  }
}

/**
 * Process trading signals for a user
 */
export async function processUserTrading(userId: string): Promise<void> {
  try {
    console.log(`\n[Trading Engine] ========================================`);
    console.log(`[Trading Engine] Processing trading for user: ${userId}`);
    console.log(`[Trading Engine] ========================================`);

    // Check if auto-trading is enabled
    const preferences = await TradingPreferences.findOne({ userId });
    if (!preferences || !preferences.autoTradingEnabled) {
      console.log(`[Trading Engine] Auto-trading disabled for user ${userId}`);
      return;
    }

    // Get Alpaca account
    const alpacaAccount = await AlpacaAccount.findOne({ userId });
    if (!alpacaAccount) {
      console.log(`[Trading Engine] No Alpaca account found for user ${userId}`);
      return;
    }

    // Check risk limits
    const riskLimits = await riskService.getRiskLimits(userId);
    if (riskLimits.haltTrading) {
      console.log(`[Trading Engine] Trading halted for user ${userId} due to risk limits`);

      await monitoringService.createActivityLog(
        userId,
        'risk',
        'Trading halted due to risk limit breach',
        'warning',
        { riskLimits }
      );

      return;
    }

    // Get strategy config to determine which strategy to use
    const config = await StrategyConfig.findOne({ userId });
    const useEMAATRStrategy = config && config.tradingUniverse && config.tradingUniverse.length > 0;

    if (useEMAATRStrategy) {
      // Use EMA/ATR bracket order strategy
      console.log(`[Trading Engine] Using EMA/ATR bracket order strategy`);
      await executeEMAATRStrategy(userId);
    } else {
      // Use traditional technical indicator strategy
      console.log(`[Trading Engine] Using traditional technical indicator strategy`);

      // Decrypt credentials
      const apiKey = alpacaAccount.getDecryptedApiKey();
      const secretKey = alpacaAccount.getDecryptedSecretKey();

      // Initialize Alpaca client
      const alpaca = new Alpaca({
        keyId: apiKey,
        secretKey: secretKey,
        paper: alpacaAccount.isPaperTrading
      });

      // Check if market is open
      const marketOpen = await isMarketOpen(alpaca);
      if (!marketOpen) {
        console.log(`[Trading Engine] Market is closed for user ${userId}`);
        return;
      }

      // Scan for sell signals first (manage existing positions)
      const sellSignals = await scanForSellSignals(userId, alpaca);
      for (const signal of sellSignals) {
        try {
          await executeSellOrder(userId, alpaca, signal);

          // Small delay between orders
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`[Trading Engine] Error executing sell order:`, error);
        }
      }

      // Scan for buy signals
      const buySignals = await scanForBuySignals(userId, alpaca);

      // Sort by signal strength and take top signals
      const sortedBuySignals = buySignals.sort((a, b) => b.strength - a.strength);
      const maxNewPositions = 2; // Maximum new positions per cycle
      const signalsToExecute = sortedBuySignals.slice(0, maxNewPositions);

      for (const signal of signalsToExecute) {
        try {
          await executeBuyOrder(userId, alpaca, signal);

          // Small delay between orders
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`[Trading Engine] Error executing buy order:`, error);
        }
      }
    }

    console.log(`[Trading Engine] Completed trading cycle for user ${userId}`);
    console.log(`[Trading Engine] ========================================\n`);
  } catch (error: any) {
    console.error(`[Trading Engine] Error processing user trading for ${userId}:`, error);

    try {
      await monitoringService.createActivityLog(
        userId,
        'error',
        `Trading engine error: ${error.message}`,
        'error',
        { error: error.message, stack: error.stack }
      );
    } catch (logError) {
      console.error('[Trading Engine] Failed to log error:', logError);
    }
  }
}

export const tradingEngine = {
  isMarketOpen,
  getTradeableStocks,
  fetchPriceHistory,
  calculatePositionSize,
  scanForBuySignals,
  scanForSellSignals,
  executeBuyOrder,
  executeSellOrder,
  processUserTrading
};
