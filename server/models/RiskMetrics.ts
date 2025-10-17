import mongoose, { Document, Schema } from 'mongoose';

export interface ISectorConcentration {
  sector: string;
  value: number;
  percentage: number;
}

export interface IPositionConcentration {
  symbol: string;
  value: number;
  percentage: number;
}

export interface IRiskMetrics extends Document {
  userId: mongoose.Types.ObjectId;
  currentRiskExposure: number;
  portfolioValue: number;
  cashAvailable: number;
  dailyPnL: number;
  dailyPnLPercentage: number;
  peakPortfolioValue: number;
  currentDrawdown: number;
  maxDrawdown: number;
  sectorConcentration: ISectorConcentration[];
  positionConcentration: IPositionConcentration[];
  correlationMatrix: Record<string, Record<string, number>>;
  volatilityIndex: number;
  calculatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const riskMetricsSchema = new Schema<IRiskMetrics>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    currentRiskExposure: { type: Number, required: true, default: 0 },
    portfolioValue: { type: Number, required: true, default: 0 },
    cashAvailable: { type: Number, required: true, default: 0 },
    dailyPnL: { type: Number, required: true, default: 0 },
    dailyPnLPercentage: { type: Number, required: true, default: 0 },
    peakPortfolioValue: { type: Number, required: true, default: 0 },
    currentDrawdown: { type: Number, required: true, default: 0 },
    maxDrawdown: { type: Number, required: true, default: 0 },
    sectorConcentration: [{
      sector: { type: String, required: true },
      value: { type: Number, required: true },
      percentage: { type: Number, required: true }
    }],
    positionConcentration: [{
      symbol: { type: String, required: true },
      value: { type: Number, required: true },
      percentage: { type: Number, required: true }
    }],
    correlationMatrix: { type: Schema.Types.Mixed, default: {} },
    volatilityIndex: { type: Number, default: 0 },
    calculatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

// Index for efficient querying
riskMetricsSchema.index({ userId: 1, calculatedAt: -1 });

const RiskMetrics = mongoose.model<IRiskMetrics>('RiskMetrics', riskMetricsSchema);

export default RiskMetrics;
