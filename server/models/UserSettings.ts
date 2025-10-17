import mongoose, { Schema, Document } from 'mongoose';

export interface IUserSettings extends Document {
  userId: mongoose.Types.ObjectId;

  // Account Details
  accountDetails: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    timezone?: string;
    language?: string;
  };

  // Notification Preferences
  notificationPreferences: {
    emailNotifications: boolean;
    emailAddress?: string;
    alertFrequency: 'immediate' | 'hourly' | 'daily';

    // Notification Types
    tradeExecutions: boolean;
    positionUpdates: boolean;
    riskAlerts: boolean;
    dailySummary: boolean;
    weeklySummary: boolean;
    monthlySummary: boolean;
  };

  // Display Preferences
  displayPreferences: {
    currencyFormat: string;
    dateFormat: string;
    timeFormat: '12h' | '24h';
    dashboardRefreshRate: number; // in seconds
  };

  // Session Settings
  sessionSettings: {
    autoLogoutMinutes: number;
    requirePasswordForSensitiveActions: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

const UserSettingsSchema = new Schema<IUserSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // unique: true already creates an index, no need for explicit index
    },
    accountDetails: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      phone: { type: String, trim: true },
      timezone: { type: String, default: 'America/New_York' },
      language: { type: String, default: 'en' },
    },
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      emailAddress: { type: String, trim: true, lowercase: true },
      alertFrequency: {
        type: String,
        enum: ['immediate', 'hourly', 'daily'],
        default: 'immediate',
      },
      tradeExecutions: { type: Boolean, default: true },
      positionUpdates: { type: Boolean, default: true },
      riskAlerts: { type: Boolean, default: true },
      dailySummary: { type: Boolean, default: true },
      weeklySummary: { type: Boolean, default: false },
      monthlySummary: { type: Boolean, default: true },
    },
    displayPreferences: {
      currencyFormat: { type: String, default: 'USD' },
      dateFormat: { type: String, default: 'MM/DD/YYYY' },
      timeFormat: { type: String, enum: ['12h', '24h'], default: '12h' },
      dashboardRefreshRate: { type: Number, default: 30 }, // 30 seconds
    },
    sessionSettings: {
      autoLogoutMinutes: { type: Number, default: 30 },
      requirePasswordForSensitiveActions: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Note: No need for explicit userId index as unique: true already creates one

const UserSettings = mongoose.model<IUserSettings>('UserSettings', UserSettingsSchema);

export default UserSettings;
