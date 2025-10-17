import express from 'express';
import { requireUser } from './middlewares/auth';
import * as settingsService from '../services/settingsService';

const router = express.Router();

// Description: Get user account settings
// Endpoint: GET /api/settings
// Request: {}
// Response: { accountNumber: string, accountType: string, accountStatus: string, emailNotifications: boolean, email: string, alertFrequency: string }
router.get('/', requireUser, async (req, res) => {
  console.log(`[SettingsRoutes] GET /api/settings - User: ${req.user._id}`);

  try {
    const settings = await settingsService.getAccountSettings(req.user._id.toString());

    // Transform the response to match frontend expectations
    const response = {
      accountNumber: settings.alpacaAccount?.accountNumber || '',
      accountType: settings.alpacaAccount?.accountType || '',
      accountStatus: settings.alpacaAccount?.connected ? 'Active' : 'Not Connected',
      emailNotifications: settings.notificationPreferences?.emailNotifications || false,
      email: settings.notificationPreferences?.emailAddress || settings.user?.email || '',
      alertFrequency: settings.notificationPreferences?.alertFrequency || 'immediate',
    };

    console.log(`[SettingsRoutes] Successfully retrieved settings for user: ${req.user._id}`);
    res.status(200).json(response);
  } catch (error: any) {
    console.error(`[SettingsRoutes] Error fetching settings:`, error);
    res.status(500).json({
      error: error.message || 'Failed to fetch account settings'
    });
  }
});

// Description: Update notification preferences
// Endpoint: PUT /api/settings/notifications
// Request: { emailNotifications: boolean, emailAddress?: string, alertFrequency?: string, ... }
// Response: { settings: object, message: string }
router.put('/notifications', requireUser, async (req, res) => {
  console.log(`[SettingsRoutes] PUT /api/settings/notifications - User: ${req.user._id}`);

  try {
    const preferences = req.body;

    const settings = await settingsService.updateNotificationPreferences(
      req.user._id.toString(),
      preferences
    );

    console.log(`[SettingsRoutes] Successfully updated notification preferences for user: ${req.user._id}`);
    res.status(200).json({
      settings: settings.notificationPreferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error: any) {
    console.error(`[SettingsRoutes] Error updating notification preferences:`, error);
    res.status(400).json({
      error: error.message || 'Failed to update notification preferences'
    });
  }
});

// Description: Update account details
// Endpoint: PUT /api/settings/account
// Request: { firstName?: string, lastName?: string, phone?: string, timezone?: string, language?: string }
// Response: { settings: object, message: string }
router.put('/account', requireUser, async (req, res) => {
  console.log(`[SettingsRoutes] PUT /api/settings/account - User: ${req.user._id}`);

  try {
    const details = req.body;

    const settings = await settingsService.updateAccountDetails(
      req.user._id.toString(),
      details
    );

    console.log(`[SettingsRoutes] Successfully updated account details for user: ${req.user._id}`);
    res.status(200).json({
      settings: settings.accountDetails,
      message: 'Account details updated successfully'
    });
  } catch (error: any) {
    console.error(`[SettingsRoutes] Error updating account details:`, error);
    res.status(400).json({
      error: error.message || 'Failed to update account details'
    });
  }
});

// Description: Update display preferences
// Endpoint: PUT /api/settings/display
// Request: { currencyFormat?: string, dateFormat?: string, timeFormat?: string, dashboardRefreshRate?: number }
// Response: { settings: object, message: string }
router.put('/display', requireUser, async (req, res) => {
  console.log(`[SettingsRoutes] PUT /api/settings/display - User: ${req.user._id}`);

  try {
    const preferences = req.body;

    const settings = await settingsService.updateDisplayPreferences(
      req.user._id.toString(),
      preferences
    );

    console.log(`[SettingsRoutes] Successfully updated display preferences for user: ${req.user._id}`);
    res.status(200).json({
      settings: settings.displayPreferences,
      message: 'Display preferences updated successfully'
    });
  } catch (error: any) {
    console.error(`[SettingsRoutes] Error updating display preferences:`, error);
    res.status(400).json({
      error: error.message || 'Failed to update display preferences'
    });
  }
});

// Description: Update session settings
// Endpoint: PUT /api/settings/session
// Request: { autoLogoutMinutes?: number, requirePasswordForSensitiveActions?: boolean }
// Response: { settings: object, message: string }
router.put('/session', requireUser, async (req, res) => {
  console.log(`[SettingsRoutes] PUT /api/settings/session - User: ${req.user._id}`);

  try {
    const sessionSettings = req.body;

    const settings = await settingsService.updateSessionSettings(
      req.user._id.toString(),
      sessionSettings
    );

    console.log(`[SettingsRoutes] Successfully updated session settings for user: ${req.user._id}`);
    res.status(200).json({
      settings: settings.sessionSettings,
      message: 'Session settings updated successfully'
    });
  } catch (error: any) {
    console.error(`[SettingsRoutes] Error updating session settings:`, error);
    res.status(400).json({
      error: error.message || 'Failed to update session settings'
    });
  }
});

export default router;
