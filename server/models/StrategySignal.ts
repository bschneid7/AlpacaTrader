import mongoose, { Schema, Document } from 'mongoose';

export interface IStrategySignal extends Document {
  userId: mongoose.Types.ObjectId;
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
  metadata?: Record<string, unknown>;
  executed: boolean;
  executedAt?: Date;
  orderId?: string;
  reason?: string;
  createdAt: Date;
}

const StrategySignalSchema = new Schema<IStrategySignal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
    },
    signalType: {
      type: String,
      enum: ['buy', 'sell', 'hold'],
      required: true,
    },
    strategy: {
      type: String,
      required: true,
      default: 'ema_atr_bracket',
    },
    price: {
      type: Number,
      required: true,
    },
    stopLoss: {
      type: Number,
    },
    takeProfit: {
      type: Number,
    },
    atr: {
      type: Number,
    },
    emaFast: {
      type: Number,
    },
    emaSlow: {
      type: Number,
    },
    positionSize: {
      type: Number,
    },
    riskAmount: {
      type: Number,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    executed: {
      type: Boolean,
      default: false,
    },
    executedAt: {
      type: Date,
    },
    orderId: {
      type: String,
    },
    reason: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Disable automatic timestamps to avoid duplicate createdAt index
  }
);

// Compound indexes for efficient queries
StrategySignalSchema.index({ userId: 1, createdAt: -1 });
StrategySignalSchema.index({ userId: 1, symbol: 1, createdAt: -1 });
StrategySignalSchema.index({ userId: 1, executed: 1 });

// Auto-delete signals older than 90 days
StrategySignalSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

export default mongoose.model<IStrategySignal>('StrategySignal', StrategySignalSchema);
