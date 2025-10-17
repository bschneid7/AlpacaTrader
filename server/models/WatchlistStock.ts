import mongoose, { Schema, Document } from 'mongoose';

export interface IWatchlistStock extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  status: 'monitoring' | 'buy_signal' | 'analyzing';
  indicators?: {
    rsi?: number;
    macd?: number;
    movingAverage?: number;
    [key: string]: number | undefined;
  };
  lastAnalyzed: Date;
  addedAt: Date;
  isActive: boolean;
}

const watchlistStockSchema = new Schema<IWatchlistStock>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  change: {
    type: Number,
    required: true,
    default: 0
  },
  changePercent: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['monitoring', 'buy_signal', 'analyzing'],
    default: 'monitoring'
  },
  indicators: {
    type: Map,
    of: Number,
    default: {}
  },
  lastAnalyzed: {
    type: Date,
    default: Date.now
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for efficient user + symbol queries
watchlistStockSchema.index({ userId: 1, symbol: 1 });
watchlistStockSchema.index({ userId: 1, isActive: 1, lastAnalyzed: -1 });

const WatchlistStock = mongoose.model<IWatchlistStock>('WatchlistStock', watchlistStockSchema);

export default WatchlistStock;
