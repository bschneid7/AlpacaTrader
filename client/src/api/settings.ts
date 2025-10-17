import api from './api';

// Description: Get user account settings
// Endpoint: GET /api/settings
// Request: {}
// Response: { settings: object }
export const getAccountSettings = async () => {
  try {
    const response = await api.get('/api/settings');
    return response.data;
  } catch (error: any) {
    console.error('Error fetching account settings:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update notification preferences
// Endpoint: PUT /api/settings/notifications
// Request: { emailNotifications: boolean, emailAddress?: string, alertFrequency?: string, ... }
// Response: { settings: object, message: string }
export const updateNotificationSettings = async (preferences: any) => {
  try {
    const response = await api.put('/api/settings/notifications', preferences);
    return response.data;
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update account details
// Endpoint: PUT /api/settings/account
// Request: { firstName?: string, lastName?: string, phone?: string, timezone?: string, language?: string }
// Response: { settings: object, message: string }
export const updateAccountDetails = async (details: any) => {
  try {
    const response = await api.put('/api/settings/account', details);
    return response.data;
  } catch (error: any) {
    console.error('Error updating account details:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update display preferences
// Endpoint: PUT /api/settings/display
// Request: { currencyFormat?: string, dateFormat?: string, timeFormat?: string, dashboardRefreshRate?: number }
// Response: { settings: object, message: string }
export const updateDisplayPreferences = async (preferences: any) => {
  try {
    const response = await api.put('/api/settings/display', preferences);
    return response.data;
  } catch (error: any) {
    console.error('Error updating display preferences:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Update session settings
// Endpoint: PUT /api/settings/session
// Request: { autoLogoutMinutes?: number, requirePasswordForSensitiveActions?: boolean }
// Response: { settings: object, message: string }
export const updateSessionSettings = async (settings: any) => {
  try {
    const response = await api.put('/api/settings/session', settings);
    return response.data;
  } catch (error: any) {
    console.error('Error updating session settings:', error);
    throw new Error(error?.response?.data?.error || error.message);
  }
};

// Description: Disconnect Alpaca Account
// Endpoint: DELETE /api/alpaca/disconnect
// Request: {}
// Response: { success: boolean, message: string }
export const disconnectAlpacaAccount = async () => {
  try {
    const response = await api.delete('/api/alpaca/disconnect');
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    const errorMessage = err?.response?.data?.error || err.message || 'Unknown error';
    // Only log if it's not the expected "account not found" error
    if (errorMessage !== 'Alpaca account not found') {
      console.error(error);
    }
    throw new Error(errorMessage);
  }
};
