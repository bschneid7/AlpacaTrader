export interface AccountData {
  portfolioValue: number;
  todayPL: number;
  todayPLPercent: number;
  monthlyPL: number;
  monthlyPLPercent: number;
  cashAvailable: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  positionSize: number;
}

export interface RecentTrade {
  time: string;
  symbol: string;
  action: string;
  quantity: number;
  price: number;
  pl: number;
}

export interface StrategyPerformance {
  winRate: number;
  avgTradeDuration: string;
  riskExposure: number;
}