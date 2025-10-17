import api from './api';

// Description: Get Account Settings
// Endpoint: GET /api/settings/account
// Request: {}
// Response: { accountNumber: string, accountType: string, accountStatus: string, emailNotifications: boolean, email: string, alertFrequency: string }
export const getAccountSettings = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        accountNumber: 'ACC123456789',
        accountType: 'Margin',
        accountStatus: 'Active',
        emailNotifications: true,
        email: 'user@example.com',
        alertFrequency: 'Immediate'
      });
    }, 500);
  });
  // try {
  //   return await api.get('/api/settings/account');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Update Notification Settings
// Endpoint: PUT /api/settings/notifications
// Request: { emailNotifications: boolean, email: string, alertFrequency: string }
// Response: { success: boolean, message: string }
export const updateNotificationSettings = (data: {
  emailNotifications: boolean;
  email: string;
  alertFrequency: string;
}) => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Notification settings updated successfully'
      });
    }, 500);
  });
  // try {
  //   return await api.put('/api/settings/notifications', data);
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};

// Description: Disconnect Alpaca Account
// Endpoint: POST /api/settings/disconnect
// Request: {}
// Response: { success: boolean, message: string }
export const disconnectAlpacaAccount = () => {
  // Mocking the response
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Alpaca account disconnected successfully'
      });
    }, 500);
  });
  // try {
  //   return await api.post('/api/settings/disconnect');
  // } catch (error) {
  //   throw new Error(error?.response?.data?.message || error.message);
  // }
};