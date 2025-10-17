import mongoose, { Document, Schema } from 'mongoose';

export interface IRiskLimits extends Document {
  userId: mongoose.Types.ObjectId;
  dailyLossLimit: {
    enabled: boolean;
    value: number;
    type: 'percentage' | 'dollar';
  };
  portfolioDrawdownLimit: {
    enabled: boolean;
    value: number;
  };
  positionLossThreshold: {
    enabled: boolean;
    value: number;
  };
  dailyLossThreshold: {
    enabled: boolean;
    value: number;
  };
  drawdownThreshold: {
    enabled: boolean;
    value: number;
  };
  volatilityThreshold: {
    enabled: boolean;
    value: number;
  };
  haltTradingOnDailyLimit: boolean;
  haltTradingOnDrawdown: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const riskLimitsSchema = new Schema<IRiskLimits>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    dailyLossLimit: {
      enabled: { type: Boolean, default: true },
      value: { type: Number, default: 5 },
      type: { type: String, enum: ['percentage', 'dollar'], default: 'percentage' }
    },
    portfolioDrawdownLimit: {
      enabled: { type: Boolean, default: true },
      value: { type: Number, default: 15 }
    },
    positionLossThreshold: {
      enabled: { type: Boolean, default: true },
      value: { type: Number, default: 10 }
    },
    dailyLossThreshold: {
      enabled: { type: Boolean, default: true },
      value: { type: Number, default: 3 }
    },
    drawdownThreshold: {
      enabled: { type: Boolean, default: true },
      value: { type: Number, default: 10 }
    },
    volatilityThreshold: {
      enabled: { type: Boolean, default: true },
      value: { type: Number, default: 50 }
    },
    haltTradingOnDailyLimit: { type: Boolean, default: true },
    haltTradingOnDrawdown: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

// Ensure userId is unique
riskLimitsSchema.index({ userId: 1 }, { unique: true });

const RiskLimits = mongoose.model<IRiskLimits>('RiskLimits', riskLimitsSchema);

export default RiskLimits;
