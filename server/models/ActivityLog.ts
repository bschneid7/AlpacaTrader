import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'analysis' | 'trade' | 'signal' | 'risk' | 'system';
  action: string; // e.g., "Analyzing AAPL for entry", "Stop-loss triggered for TSLA"
  symbol?: string;
  details?: {
    [key: string]: unknown;
  };
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
}

const activityLogSchema = new Schema<IActivityLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['analysis', 'trade', 'signal', 'risk', 'system'],
    required: true
  },
  action: {
    type: String,
    required: true,
    trim: true
  },
  symbol: {
    type: String,
    uppercase: true,
    trim: true
  },
  details: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {}
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'success'],
    default: 'info'
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
activityLogSchema.index({ userId: 1, timestamp: -1 });
activityLogSchema.index({ userId: 1, type: 1, timestamp: -1 });
activityLogSchema.index({ userId: 1, symbol: 1, timestamp: -1 });

// TTL index to automatically delete old logs after 90 days
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);

export default ActivityLog;
