import mongoose, { Document, Schema } from 'mongoose';

export interface IStrategyConfig extends Document {
  userId: mongoose.Types.ObjectId;

  // Risk Tolerance Settings
  maxPositionSize: number; // percentage of portfolio (5-25%)
  maxConcurrentPositions: number; // number of positions (3-15)
  stopLossPercentage: number; // percentage (1-10%)
  takeProfitTarget: number; // percentage (5-20%)

  // Monthly Target Settings
  monthlyReturnTarget: {
    min: number; // percentage (e.g., 8)
    max: number; // percentage (e.g., 10)
  };

  // Trading Hours Configuration
  enablePreMarket: boolean;
  enableAfterHours: boolean;
  marketHoursOnly: boolean;

  // Stock Universe Filters
  minStockPrice: number; // minimum stock price in dollars
  minDailyVolume: number; // minimum daily volume
  marketCapPreferences: string[]; // ["small", "mid", "large"]
  sectorPreferences: string[]; // ["technology", "healthcare", "finance", etc.]

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const strategyConfigSchema = new Schema<IStrategyConfig>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    maxPositionSize: {
      type: Number,
      required: true,
      min: 5,
      max: 25,
      default: 15,
    },
    maxConcurrentPositions: {
      type: Number,
      required: true,
      min: 3,
      max: 15,
      default: 8,
    },
    stopLossPercentage: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
      default: 5,
    },
    takeProfitTarget: {
      type: Number,
      required: true,
      min: 5,
      max: 20,
      default: 12,
    },
    monthlyReturnTarget: {
      min: {
        type: Number,
        required: true,
        default: 8,
      },
      max: {
        type: Number,
        required: true,
        default: 10,
      },
    },
    enablePreMarket: {
      type: Boolean,
      default: false,
    },
    enableAfterHours: {
      type: Boolean,
      default: false,
    },
    marketHoursOnly: {
      type: Boolean,
      default: true,
    },
    minStockPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },
    minDailyVolume: {
      type: Number,
      required: true,
      min: 0,
      default: 1000000,
    },
    marketCapPreferences: {
      type: [String],
      enum: ['small', 'mid', 'large'],
      default: ['mid', 'large'],
    },
    sectorPreferences: {
      type: [String],
      enum: [
        'technology',
        'healthcare',
        'finance',
        'consumer',
        'industrial',
        'energy',
        'utilities',
        'materials',
        'real_estate',
        'communication',
      ],
      default: ['technology', 'healthcare', 'finance'],
    },
  },
  {
    timestamps: true,
  }
);

// Default aggressive strategy configuration
export const DEFAULT_AGGRESSIVE_STRATEGY = {
  maxPositionSize: 15,
  maxConcurrentPositions: 8,
  stopLossPercentage: 5,
  takeProfitTarget: 12,
  monthlyReturnTarget: {
    min: 8,
    max: 10,
  },
  enablePreMarket: false,
  enableAfterHours: false,
  marketHoursOnly: true,
  minStockPrice: 5,
  minDailyVolume: 1000000,
  marketCapPreferences: ['mid', 'large'],
  sectorPreferences: ['technology', 'healthcare', 'finance'],
};

const StrategyConfig = mongoose.model<IStrategyConfig>('StrategyConfig', strategyConfigSchema);

export default StrategyConfig;
