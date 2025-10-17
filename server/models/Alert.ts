import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  symbol?: string;
  relatedData?: {
    orderId?: string;
    positionId?: string;
    price?: number;
    percentage?: number;
    [key: string]: unknown;
  };
  isRead: boolean;
  isAcknowledged: boolean;
  acknowledgedAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

const alertSchema = new Schema<IAlert>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    uppercase: true,
    trim: true
  },
  relatedData: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  isAcknowledged: {
    type: Boolean,
    default: false,
    index: true
  },
  acknowledgedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
alertSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
alertSchema.index({ userId: 1, type: 1, isAcknowledged: 1, createdAt: -1 });
alertSchema.index({ userId: 1, symbol: 1, createdAt: -1 });

// TTL index to automatically delete expired alerts
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Middleware to mark alert as read when acknowledged
alertSchema.pre('save', function(next) {
  if (this.isAcknowledged && !this.isRead) {
    this.isRead = true;
  }
  if (this.isAcknowledged && !this.acknowledgedAt) {
    this.acknowledgedAt = new Date();
  }
  next();
});

const Alert = mongoose.model<IAlert>('Alert', alertSchema);

export default Alert;
