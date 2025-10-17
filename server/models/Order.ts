import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderId: string; // Alpaca order ID
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  status: 'pending' | 'accepted' | 'partially_filled' | 'filled' | 'cancelled' | 'rejected' | 'expired';
  filledQty: number;
  filledAvgPrice?: number;
  submittedAt: Date;
  filledAt?: Date;
  cancelledAt?: Date;
  expiredAt?: Date;
  extendedHours: boolean;
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
  notes?: string;
}

const orderSchema = new Schema<IOrder>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  side: {
    type: String,
    enum: ['buy', 'sell'],
    required: true
  },
  type: {
    type: String,
    enum: ['market', 'limit', 'stop', 'stop_limit'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  limitPrice: {
    type: Number,
    min: 0
  },
  stopPrice: {
    type: Number,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'partially_filled', 'filled', 'cancelled', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  filledQty: {
    type: Number,
    default: 0,
    min: 0
  },
  filledAvgPrice: {
    type: Number,
    min: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  filledAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  expiredAt: {
    type: Date
  },
  extendedHours: {
    type: Boolean,
    default: false
  },
  timeInForce: {
    type: String,
    enum: ['day', 'gtc', 'ioc', 'fok'],
    default: 'day'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
orderSchema.index({ userId: 1, status: 1, submittedAt: -1 });
orderSchema.index({ userId: 1, symbol: 1, status: 1 });

const Order = mongoose.model<IOrder>('Order', orderSchema);

export default Order;
