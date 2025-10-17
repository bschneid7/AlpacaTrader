/**
 * Technical Indicators Service
 * Provides technical analysis calculations for trading signals
 */

interface PriceData {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TechnicalSignals {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    ema12: number;
    ema26: number;
  };
  trend: 'bullish' | 'bearish' | 'neutral';
  strength: number; // 0-100
}

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return 0;
  }

  const slice = prices.slice(-period);
  const sum = slice.reduce((acc, price) => acc + price, 0);
  return sum / period;
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return 0;
  }

  const multiplier = 2 / (period + 1);
  let ema = calculateSMA(prices.slice(0, period), period);

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

/**
 * Calculate Relative Strength Index (RSI)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // Neutral
  }

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let avgGain = 0;
  let avgLoss = 0;

  // Initial average
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      avgGain += changes[i];
    } else {
      avgLoss += Math.abs(changes[i]);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // Smooth subsequent values
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) {
    return 100;
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 */
export function calculateMACD(prices: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;

  // Calculate signal line (9-period EMA of MACD)
  const macdValues: number[] = [];
  for (let i = 26; i <= prices.length; i++) {
    const slice = prices.slice(0, i);
    const e12 = calculateEMA(slice, 12);
    const e26 = calculateEMA(slice, 26);
    macdValues.push(e12 - e26);
  }

  const signal = calculateEMA(macdValues, 9);
  const histogram = macd - signal;

  return { macd, signal, histogram };
}

/**
 * Determine trend based on moving averages
 */
export function determineTrend(sma20: number, sma50: number, currentPrice: number): 'bullish' | 'bearish' | 'neutral' {
  if (currentPrice > sma20 && sma20 > sma50) {
    return 'bullish';
  } else if (currentPrice < sma20 && sma20 < sma50) {
    return 'bearish';
  }
  return 'neutral';
}

/**
 * Calculate signal strength (0-100)
 */
export function calculateSignalStrength(signals: {
  rsi: number;
  macdHistogram: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  priceAboveSMA20: boolean;
}): number {
  let strength = 0;

  // RSI contribution (30 points)
  if (signals.rsi < 30) {
    strength += 30; // Oversold - strong buy signal
  } else if (signals.rsi > 70) {
    strength -= 30; // Overbought - strong sell signal
  } else if (signals.rsi >= 40 && signals.rsi <= 60) {
    strength += 10; // Neutral zone
  }

  // MACD contribution (30 points)
  if (signals.macdHistogram > 0) {
    strength += 30; // Bullish momentum
  } else if (signals.macdHistogram < 0) {
    strength -= 30; // Bearish momentum
  }

  // Trend contribution (20 points)
  if (signals.trend === 'bullish') {
    strength += 20;
  } else if (signals.trend === 'bearish') {
    strength -= 20;
  }

  // Price vs SMA contribution (20 points)
  if (signals.priceAboveSMA20) {
    strength += 20;
  } else {
    strength -= 20;
  }

  // Normalize to 0-100
  return Math.max(0, Math.min(100, strength + 50));
}

/**
 * Analyze price data and generate technical signals
 */
export async function analyzeTechnicals(priceHistory: PriceData[]): Promise<TechnicalSignals> {
  console.log(`[Technical Indicators] Analyzing ${priceHistory.length} price data points`);

  const closePrices = priceHistory.map(p => p.close);
  const currentPrice = closePrices[closePrices.length - 1];

  // Calculate indicators
  const rsi = calculateRSI(closePrices, 14);
  const macd = calculateMACD(closePrices);
  const sma20 = calculateSMA(closePrices, 20);
  const sma50 = calculateSMA(closePrices, 50);
  const ema12 = calculateEMA(closePrices, 12);
  const ema26 = calculateEMA(closePrices, 26);

  const trend = determineTrend(sma20, sma50, currentPrice);
  const strength = calculateSignalStrength({
    rsi,
    macdHistogram: macd.histogram,
    trend,
    priceAboveSMA20: currentPrice > sma20
  });

  const signals: TechnicalSignals = {
    rsi,
    macd,
    movingAverages: {
      sma20,
      sma50,
      ema12,
      ema26
    },
    trend,
    strength
  };

  console.log(`[Technical Indicators] RSI: ${rsi.toFixed(2)}, MACD Histogram: ${macd.histogram.toFixed(4)}, Trend: ${trend}, Strength: ${strength}`);

  return signals;
}

/**
 * Generate buy signal based on technical analysis
 */
export function shouldBuy(signals: TechnicalSignals): boolean {
  // Aggressive strategy criteria
  const conditions = [
    signals.rsi < 40, // Oversold or near oversold
    signals.macd.histogram > 0, // Positive momentum
    signals.trend === 'bullish' || signals.trend === 'neutral', // Not bearish
    signals.strength >= 60 // Strong signal
  ];

  const passedConditions = conditions.filter(c => c).length;
  const shouldBuySignal = passedConditions >= 3; // At least 3 out of 4 conditions

  console.log(`[Technical Indicators] Buy signal evaluation: ${passedConditions}/4 conditions met, Decision: ${shouldBuySignal ? 'BUY' : 'WAIT'}`);

  return shouldBuySignal;
}

/**
 * Generate sell signal based on technical analysis
 */
export function shouldSell(signals: TechnicalSignals, entryPrice: number, currentPrice: number, stopLossPercent: number, takeProfitPercent: number): {
  shouldSell: boolean;
  reason: string;
} {
  const priceChangePercent = ((currentPrice - entryPrice) / entryPrice) * 100;

  // Stop loss triggered
  if (priceChangePercent <= -stopLossPercent) {
    console.log(`[Technical Indicators] Stop loss triggered: ${priceChangePercent.toFixed(2)}%`);
    return { shouldSell: true, reason: 'stop_loss' };
  }

  // Take profit triggered
  if (priceChangePercent >= takeProfitPercent) {
    console.log(`[Technical Indicators] Take profit triggered: ${priceChangePercent.toFixed(2)}%`);
    return { shouldSell: true, reason: 'take_profit' };
  }

  // Technical sell signals
  const technicalSellConditions = [
    signals.rsi > 70, // Overbought
    signals.macd.histogram < 0, // Negative momentum
    signals.trend === 'bearish', // Bearish trend
    signals.strength < 40 // Weak signal
  ];

  const passedSellConditions = technicalSellConditions.filter(c => c).length;

  // Need at least 3 bearish conditions for technical sell
  if (passedSellConditions >= 3) {
    console.log(`[Technical Indicators] Technical sell signal: ${passedSellConditions}/4 conditions met`);
    return { shouldSell: true, reason: 'technical' };
  }

  return { shouldSell: false, reason: 'hold' };
}
