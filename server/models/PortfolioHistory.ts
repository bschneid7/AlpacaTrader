import mongoose, { Schema, Document } from 'mongoose';

export interface IPortfolioHistory extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  portfolioValue: number;
  equity: number;
  cash: number;
  longMarketValue: number;
  shortMarketValue: number;
  buyingPower: number;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioHistorySchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    portfolioValue: {
      type: Number,
      required: true,
      min: 0,
    },
    equity: {
      type: Number,
      required: true,
      min: 0,
    },
    cash: {
      type: Number,
      required: true,
    },
    longMarketValue: {
      type: Number,
      default: 0,
    },
    shortMarketValue: {
      type: Number,
      default: 0,
    },
    buyingPower: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one record per user per day
PortfolioHistorySchema.index({ userId: 1, date: 1 }, { unique: true });

// Index for time-based queries
PortfolioHistorySchema.index({ userId: 1, date: -1 });

export default mongoose.model<IPortfolioHistory>('PortfolioHistory', PortfolioHistorySchema);
