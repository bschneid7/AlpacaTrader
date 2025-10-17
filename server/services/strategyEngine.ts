import axios from 'axios';
import AlpacaAccount from '../models/AlpacaAccount';
import StrategyConfig from '../models/StrategyConfig';
import StrategySignal from '../models/StrategySignal';
import Position from '../models/Position';
import { decryptApiKey } from '../utils/encryption';
import * as monitoringService from './monitoringService';

interface BarData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SignalResult {
  symbol: string;
  signalType: 'buy' | 'sell' | 'hold';
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  positionSize?: number;
  atr?: number;
  emaFast?: number;
  emaSlow?: number;
  riskAmount?: number;
  reason: string;
}

/**
 * Calculate Exponential Moving Average (EMA)
 */
function calculateEMA(data: number[], period: number): number[] {
  if (data.length < period) {
    return [];
  }

  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // Calculate initial SMA for first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema.push(sum / period);

  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1];
    ema.push(currentEMA);
  }

  return ema;
}

/**
 * Calculate Average True Range (ATR)
 */
function calculateATR(bars: BarData[], period: number): number[] {
  if (bars.length < period + 1) {
    return [];
  }

  const trueRanges: number[] = [];

  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    trueRanges.push(tr);
  }

  // Calculate ATR using SMA of TR
  const atr: number[] = [];
  for (let i = period - 1; i < trueRanges.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += trueRanges[i - j];
    }
    atr.push(sum / period);
  }

  return atr;
}

/**
 * Fetch daily bars from Alpaca API
 */
async function fetchDailyBars(
  symbol: string,
  apiKey: string,
  apiSecret: string,
  isPaper: boolean,
  lookbackDays: number = 200
): Promise<BarData[]> {
  const baseUrl = isPaper
    ? 'https://paper-api.alpaca.markets'
    : 'https://api.alpaca.markets';

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - lookbackDays);

  try {
    const response = await axios.get(`${baseUrl}/v2/stocks/${symbol}/bars`, {
      params: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        timeframe: '1Day',
        limit: 10000,
        adjustment: 'all',
        feed: 'iex',
      },
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': apiSecret,
      },
    });

    if (!response.data || !response.data.bars || response.data.bars.length === 0) {
      console.log(`No bar data available for ${symbol}`);
      return [];
    }

    const bars: BarData[] = response.data.bars.map((bar: any) => ({
      timestamp: new Date(bar.t),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }));

    return bars;
  } catch (error: any) {
    console.error(`Error fetching bars for ${symbol}:`, error.response?.data || error.message);
    return [];
  }
}

/**
 * Generate trading signal based on EMA crossover and ATR
 */
function generateSignal(
  symbol: string,
  bars: BarData[],
  config: any
): SignalResult {
  const closePrices = bars.map((b) => b.close);

  // Calculate EMAs
  const emaFastValues = calculateEMA(closePrices, config.emaFastPeriod);
  const emaSlowValues = calculateEMA(closePrices, config.emaSlowPeriod);

  // Calculate ATR
  const atrValues = calculateATR(bars, config.atrPeriod);

  // Need enough data
  if (
    emaFastValues.length < 2 ||
    emaSlowValues.length < 2 ||
    atrValues.length < 1
  ) {
    return {
      symbol,
      signalType: 'hold',
      price: bars[bars.length - 1].close,
      reason: 'Insufficient data for signal generation',
    };
  }

  const currentPrice = bars[bars.length - 1].close;
  const currentEMAFast = emaFastValues[emaFastValues.length - 1];
  const prevEMAFast = emaFastValues[emaFastValues.length - 2];
  const currentEMASlow = emaSlowValues[emaSlowValues.length - 1];
  const prevEMASlow = emaSlowValues[emaSlowValues.length - 2];
  const currentATR = atrValues[atrValues.length - 1];

  // Check for EMA crossover
  const crossedUp = prevEMAFast <= prevEMASlow && currentEMAFast > currentEMASlow;
  const emaFastRising = currentEMAFast > prevEMAFast;

  if (crossedUp && emaFastRising) {
    // Buy signal
    const stopLoss = currentPrice - config.atrStopMultiplier * currentATR;
    const takeProfit = currentPrice + config.atrTakeProfitMultiplier * currentATR;

    return {
      symbol,
      signalType: 'buy',
      price: currentPrice,
      stopLoss: Math.max(0.01, stopLoss),
      takeProfit,
      atr: currentATR,
      emaFast: currentEMAFast,
      emaSlow: currentEMASlow,
      reason: `EMA(${config.emaFastPeriod}) crossed above EMA(${config.emaSlowPeriod}) with rising trend`,
    };
  }

  return {
    symbol,
    signalType: 'hold',
    price: currentPrice,
    atr: currentATR,
    emaFast: currentEMAFast,
    emaSlow: currentEMASlow,
    reason: 'No crossover signal detected',
  };
}

/**
 * Calculate position size based on risk parameters
 */
async function calculatePositionSize(
  userId: string,
  price: number,
  stopLoss: number,
  config: any
): Promise<{ quantity: number; riskAmount: number }> {
  try {
    // Get account equity
    const alpacaAccount = await AlpacaAccount.findOne({ userId });
    if (!alpacaAccount) {
      return { quantity: 0, riskAmount: 0 };
    }

    const equity = alpacaAccount.equity || 100000;
    const riskAmount = equity * (config.riskPerTrade / 100);
    const perShareRisk = Math.max(0.01, price - stopLoss);
    const quantity = Math.floor(riskAmount / perShareRisk);

    // Check max portfolio risk
    const currentPositions = await Position.find({
      userId,
      status: 'open',
    });

    const currentRisk = currentPositions.reduce((sum, pos) => {
      const posRisk = pos.quantity * Math.abs(pos.currentPrice - (pos.stopLoss || pos.entryPrice * 0.95));
      return sum + posRisk;
    }, 0);

    const maxRisk = equity * (config.maxPortfolioRisk / 100);
    const availableRisk = maxRisk - currentRisk;

    if (riskAmount > availableRisk) {
      console.log(`Risk limit reached. Available risk: $${availableRisk.toFixed(2)}, Required: $${riskAmount.toFixed(2)}`);
      return { quantity: 0, riskAmount: 0 };
    }

    return {
      quantity: Math.max(1, quantity),
      riskAmount,
    };
  } catch (error: any) {
    console.error('Error calculating position size:', error);
    return { quantity: 0, riskAmount: 0 };
  }
}

/**
 * Run strategy analysis for a user
 */
export async function runStrategyAnalysis(
  userId: string
): Promise<SignalResult[]> {
  console.log(`[StrategyEngine] Running analysis for user ${userId}`);

  try {
    // Get user's Alpaca account
    const alpacaAccount = await AlpacaAccount.findOne({ userId });
    if (!alpacaAccount || !alpacaAccount.isConnected) {
      throw new Error('Alpaca account not connected');
    }

    // Get strategy config
    const config = await StrategyConfig.findOne({ userId });
    if (!config) {
      throw new Error('Strategy configuration not found');
    }

    // Decrypt API credentials
    const apiKey = decryptApiKey(alpacaAccount.apiKey);
    const apiSecret = decryptApiKey(alpacaAccount.apiSecret);

    const signals: SignalResult[] = [];

    // Analyze each symbol in trading universe
    for (const symbol of config.tradingUniverse) {
      console.log(`[StrategyEngine] Analyzing ${symbol}...`);

      // Fetch daily bars
      const bars = await fetchDailyBars(
        symbol,
        apiKey,
        apiSecret,
        alpacaAccount.isPaper,
        250
      );

      if (bars.length < Math.max(config.emaSlowPeriod, config.atrPeriod) + 10) {
        console.log(`[StrategyEngine] Insufficient data for ${symbol}, skipping`);
        continue;
      }

      // Generate signal
      const signal = generateSignal(symbol, bars, config);

      if (signal.signalType === 'buy' && signal.stopLoss && signal.takeProfit) {
        // Calculate position size
        const { quantity, riskAmount } = await calculatePositionSize(
          userId,
          signal.price,
          signal.stopLoss,
          config
        );

        signal.positionSize = quantity;
        signal.riskAmount = riskAmount;

        // Save signal to database
        await StrategySignal.create({
          userId,
          symbol: signal.symbol,
          signalType: signal.signalType,
          strategy: 'ema_atr_bracket',
          price: signal.price,
          stopLoss: signal.stopLoss,
          takeProfit: signal.takeProfit,
          atr: signal.atr,
          emaFast: signal.emaFast,
          emaSlow: signal.emaSlow,
          positionSize: signal.positionSize,
          riskAmount: signal.riskAmount,
          reason: signal.reason,
          executed: false,
        });

        // Log activity
        await monitoringService.createActivityLog(
          userId,
          'signal_generated',
          `Buy signal for ${symbol} at $${signal.price.toFixed(2)}`,
          { signal },
          'info'
        );
      }

      signals.push(signal);
    }

    console.log(`[StrategyEngine] Analysis complete. Generated ${signals.filter(s => s.signalType === 'buy').length} buy signals`);

    return signals;
  } catch (error: any) {
    console.error('[StrategyEngine] Error running analysis:', error);
    throw error;
  }
}

/**
 * Get unexecuted signals for a user
 */
export async function getUnexecutedSignals(userId: string) {
  return await StrategySignal.find({
    userId,
    executed: false,
    signalType: 'buy',
  })
    .sort({ createdAt: -1 })
    .limit(50);
}

/**
 * Get recent signals for a user
 */
export async function getRecentSignals(userId: string, limit: number = 50) {
  return await StrategySignal.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit);
}

/**
 * Mark signal as executed
 */
export async function markSignalExecuted(
  signalId: string,
  orderId: string
) {
  return await StrategySignal.findByIdAndUpdate(
    signalId,
    {
      executed: true,
      executedAt: new Date(),
      orderId,
    },
    { new: true }
  );
}
