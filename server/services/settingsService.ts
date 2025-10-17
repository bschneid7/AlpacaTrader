import UserSettings, { IUserSettings } from '../models/UserSettings';
import User from '../models/User';
import AlpacaAccount from '../models/AlpacaAccount';
import mongoose from 'mongoose';

/**
 * Get or create user settings
 */
export const getUserSettings = async (userId: string): Promise<IUserSettings> => {
  console.log(`[SettingsService] Fetching settings for user: ${userId}`);

  try {
    let settings = await UserSettings.findOne({ userId });

    // If settings don't exist, create default settings
    if (!settings) {
      console.log(`[SettingsService] No settings found, creating default settings for user: ${userId}`);

      // Get user email for notification preferences
      const user = await User.findById(userId);

      settings = await UserSettings.create({
        userId,
        notificationPreferences: {
          emailAddress: user?.email,
        },
      });

      console.log(`[SettingsService] Created default settings for user: ${userId}`);
    }

    return settings;
  } catch (error) {
    console.error(`[SettingsService] Error fetching user settings for ${userId}:`, error);
    throw new Error('Failed to fetch user settings');
  }
};

/**
 * Get complete account settings including Alpaca account info
 */
export const getAccountSettings = async (userId: string) => {
  console.log(`[SettingsService] Fetching complete account settings for user: ${userId}`);

  try {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('User not found');
    }

    const settings = await getUserSettings(userId);
    const alpacaAccount = await AlpacaAccount.findOne({ userId });

    const accountSettings = {
      user: {
        email: user.email,
        id: user._id,
      },
      accountDetails: settings.accountDetails,
      notificationPreferences: settings.notificationPreferences,
      displayPreferences: settings.displayPreferences,
      sessionSettings: settings.sessionSettings,
      alpacaAccount: alpacaAccount ? {
        connected: alpacaAccount.isConnected,
        accountNumber: alpacaAccount.accountNumber ?
          alpacaAccount.accountNumber.replace(/(.{4})$/, '****') : null,
        accountType: alpacaAccount.accountType,
        isPaperTrading: alpacaAccount.isPaperTrading,
        autoTradingEnabled: alpacaAccount.autoTradingEnabled,
        lastSyncedAt: alpacaAccount.lastSyncedAt,
      } : null,
    };

    console.log(`[SettingsService] Successfully fetched account settings for user: ${userId}`);
    return accountSettings;
  } catch (error) {
    console.error(`[SettingsService] Error fetching account settings for ${userId}:`, error);
    throw error;
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (
  userId: string,
  preferences: Partial<IUserSettings['notificationPreferences']>
): Promise<IUserSettings> => {
  console.log(`[SettingsService] Updating notification preferences for user: ${userId}`);

  try {
    // Validate email if provided
    if (preferences.emailAddress) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(preferences.emailAddress)) {
        throw new Error('Invalid email address format');
      }
    }

    // Validate alert frequency if provided
    if (preferences.alertFrequency && !['immediate', 'hourly', 'daily'].includes(preferences.alertFrequency)) {
      throw new Error('Invalid alert frequency. Must be immediate, hourly, or daily');
    }

    let settings = await UserSettings.findOne({ userId });

    if (!settings) {
      console.log(`[SettingsService] Creating new settings for user: ${userId}`);
      settings = await UserSettings.create({
        userId,
        notificationPreferences: preferences,
      });
    } else {
      // Update notification preferences
      settings.notificationPreferences = {
        ...settings.notificationPreferences,
        ...preferences,
      };
      await settings.save();
    }

    console.log(`[SettingsService] Successfully updated notification preferences for user: ${userId}`);
    return settings;
  } catch (error) {
    console.error(`[SettingsService] Error updating notification preferences for ${userId}:`, error);
    throw error;
  }
};

/**
 * Update account details
 */
export const updateAccountDetails = async (
  userId: string,
  details: Partial<IUserSettings['accountDetails']>
): Promise<IUserSettings> => {
  console.log(`[SettingsService] Updating account details for user: ${userId}`);

  try {
    // Validate phone number if provided
    if (details.phone) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(details.phone)) {
        throw new Error('Invalid phone number format');
      }
    }

    let settings = await UserSettings.findOne({ userId });

    if (!settings) {
      console.log(`[SettingsService] Creating new settings for user: ${userId}`);
      settings = await UserSettings.create({
        userId,
        accountDetails: details,
      });
    } else {
      // Update account details
      settings.accountDetails = {
        ...settings.accountDetails,
        ...details,
      };
      await settings.save();
    }

    console.log(`[SettingsService] Successfully updated account details for user: ${userId}`);
    return settings;
  } catch (error) {
    console.error(`[SettingsService] Error updating account details for ${userId}:`, error);
    throw error;
  }
};

/**
 * Update display preferences
 */
export const updateDisplayPreferences = async (
  userId: string,
  preferences: Partial<IUserSettings['displayPreferences']>
): Promise<IUserSettings> => {
  console.log(`[SettingsService] Updating display preferences for user: ${userId}`);

  try {
    // Validate time format if provided
    if (preferences.timeFormat && !['12h', '24h'].includes(preferences.timeFormat)) {
      throw new Error('Invalid time format. Must be 12h or 24h');
    }

    // Validate refresh rate if provided
    if (preferences.dashboardRefreshRate !== undefined) {
      if (preferences.dashboardRefreshRate < 5 || preferences.dashboardRefreshRate > 300) {
        throw new Error('Dashboard refresh rate must be between 5 and 300 seconds');
      }
    }

    let settings = await UserSettings.findOne({ userId });

    if (!settings) {
      settings = await UserSettings.create({
        userId,
        displayPreferences: preferences,
      });
    } else {
      settings.displayPreferences = {
        ...settings.displayPreferences,
        ...preferences,
      };
      await settings.save();
    }

    console.log(`[SettingsService] Successfully updated display preferences for user: ${userId}`);
    return settings;
  } catch (error) {
    console.error(`[SettingsService] Error updating display preferences for ${userId}:`, error);
    throw error;
  }
};

/**
 * Update session settings
 */
export const updateSessionSettings = async (
  userId: string,
  settings: Partial<IUserSettings['sessionSettings']>
): Promise<IUserSettings> => {
  console.log(`[SettingsService] Updating session settings for user: ${userId}`);

  try {
    // Validate auto-logout minutes if provided
    if (settings.autoLogoutMinutes !== undefined) {
      if (settings.autoLogoutMinutes < 5 || settings.autoLogoutMinutes > 480) {
        throw new Error('Auto-logout must be between 5 and 480 minutes');
      }
    }

    let userSettings = await UserSettings.findOne({ userId });

    if (!userSettings) {
      userSettings = await UserSettings.create({
        userId,
        sessionSettings: settings,
      });
    } else {
      userSettings.sessionSettings = {
        ...userSettings.sessionSettings,
        ...settings,
      };
      await userSettings.save();
    }

    console.log(`[SettingsService] Successfully updated session settings for user: ${userId}`);
    return userSettings;
  } catch (error) {
    console.error(`[SettingsService] Error updating session settings for ${userId}:`, error);
    throw error;
  }
};

/**
 * Delete user settings
 */
export const deleteUserSettings = async (userId: string): Promise<void> => {
  console.log(`[SettingsService] Deleting settings for user: ${userId}`);

  try {
    await UserSettings.deleteOne({ userId });
    console.log(`[SettingsService] Successfully deleted settings for user: ${userId}`);
  } catch (error) {
    console.error(`[SettingsService] Error deleting settings for ${userId}:`, error);
    throw new Error('Failed to delete user settings');
  }
};
