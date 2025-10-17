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
}