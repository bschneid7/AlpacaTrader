export interface SectorConcentration {
  [sector: string]: number;
}

export interface PositionConcentration {
  symbol: string;
  percentage: number;
}

export interface RiskMetrics {
  currentRiskExposure: number;
  dailyLoss: number;
  dailyLossPercent: number;
  portfolioDrawdown: number;
  sectorConcentration: SectorConcentration;
  positionConcentration: PositionConcentration[];
}

export interface RiskLimits {
  dailyLossLimit: number;
  dailyLossLimitPercent: number;
  haltOnLimit: boolean;
  drawdownLimit: number;
}