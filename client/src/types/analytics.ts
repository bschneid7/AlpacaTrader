export interface PortfolioDataPoint {
  date: string;
  value: number;
}

export interface MonthlyReturn {
  month: string;
  return: number;
}

export interface Trade {
  symbol: string;
  pl: number;
  plPercent: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  bestTrade: Trade;
  worstTrade: Trade;
  avgWin: number;
  avgLoss: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

export interface TradeHistoryItem {
  date: string;
  symbol: string;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  duration: string;
  pl: number;
  plPercent: number;
}