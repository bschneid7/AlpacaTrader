import mongoose, { Schema, Document } from 'mongoose';

export interface ITradingPreferences extends Document {
  userId: mongoose.Types.ObjectId;
  autoTradingEnabled: boolean;
  lastToggleTime: Date;
  tradingStatus: 'active' | 'paused' | 'stopped';
  createdAt: Date;
  updatedAt: Date;
}

const TradingPreferencesSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    autoTradingEnabled: {
      type: Boolean,
      default: false,
    },
    lastToggleTime: {
      type: Date,
      default: Date.now,
    },
    tradingStatus: {
      type: String,
      enum: ['active', 'paused', 'stopped'],
      default: 'stopped',
    },
  },
  {
    timestamps: true,
  }
);

// Note: Index on userId is already created by unique: true, no need to add it again

const TradingPreferences = mongoose.model<ITradingPreferences>(
  'TradingPreferences',
  TradingPreferencesSchema
);

export default TradingPreferences;
