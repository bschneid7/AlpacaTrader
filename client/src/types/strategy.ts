export interface StrategyConfig {
  maxPositionSize: number;
  maxConcurrentPositions: number;
  stopLoss: number;
  takeProfit: number;
  targetMonthlyReturn: number;
  preMarket: boolean;
  afterHours: boolean;
  minStockPrice: number;
  minDailyVolume: number;
  marketCaps: string[];
  sectors: string[];
  // EMA/ATR Strategy Parameters
  emaFastPeriod?: number;
  emaSlowPeriod?: number;
  atrPeriod?: number;
  atrStopMultiplier?: number;
  atrTakeProfitMultiplier?: number;
  riskPerTrade?: number;
  maxPortfolioRisk?: number;
  tradingUniverse?: string[];
}

export interface StrategySignal {
  _id: string;
  symbol: string;
  signalType: 'buy' | 'sell' | 'hold';
  strategy: string;
  price: number;
  stopLoss?: number;
  takeProfit?: number;
  atr?: number;
  emaFast?: number;
  emaSlow?: number;
  positionSize?: number;
  riskAmount?: number;
  executed: boolean;
  executedAt?: Date;
  orderId?: string;
  reason?: string;
  createdAt: Date;
}