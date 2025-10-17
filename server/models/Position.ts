import mongoose, { Schema, Document } from 'mongoose';

export interface IPosition extends Document {
  userId: mongoose.Types.ObjectId;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  unrealizedPL: number;
  unrealizedPLPercent: number;
  side: 'long' | 'short';
  exchange: string;
  assetId: string;
  avgEntryPrice: number;
  status: 'open' | 'closed';
  openedAt: Date;
  closedAt?: Date;
  closePrice?: number;
  realizedPL?: number;
  alpacaAccountId: mongoose.Types.ObjectId;
  lastUpdated: Date;
}

const PositionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  symbol: {
    type: String,
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true
  },
  entryPrice: {
    type: Number,
    required: true
  },
  currentPrice: {
    type: Number,
    required: true
  },
  marketValue: {
    type: Number,
    required: true
  },
  costBasis: {
    type: Number,
    required: true
  },
  unrealizedPL: {
    type: Number,
    required: true
  },
  unrealizedPLPercent: {
    type: Number,
    required: true
  },
  side: {
    type: String,
    enum: ['long', 'short'],
    required: true
  },
  exchange: {
    type: String,
    required: true
  },
  assetId: {
    type: String,
    required: true
  },
  avgEntryPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
    index: true
  },
  openedAt: {
    type: Date,
    required: true
  },
  closedAt: {
    type: Date
  },
  closePrice: {
    type: Number
  },
  realizedPL: {
    type: Number
  },
  alpacaAccountId: {
    type: Schema.Types.ObjectId,
    ref: 'AlpacaAccount',
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for querying user's open positions
PositionSchema.index({ userId: 1, status: 1 });
PositionSchema.index({ userId: 1, symbol: 1, status: 1 });

export default mongoose.model<IPosition>('Position', PositionSchema);
