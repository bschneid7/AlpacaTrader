import api from './api';

// Description: Get Account Settings
// Endpoint: GET /api/settings/account
// Request: {}
// Response: { accountNumber: string, accountType: string, accountStatus: string, emailNotifications: boolean, email: string, alertFrequency: string }
export const getAccountSettings = () => {
  // Mocking the response - This will be implemented in a future task
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
  //   const response = await api.get('/api/settings/account');
  //   return response.data;
  // } catch (error: any) {
  //   console.error(error);
  //   throw new Error(error?.response?.data?.error || error.message);
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
  // Mocking the response - This will be implemented in a future task
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Notification settings updated successfully'
      });
    }, 500);
  });
  // try {
  //   const response = await api.put('/api/settings/notifications', data);
  //   return response.data;
  // } catch (error: any) {
  //   console.error(error);
  //   throw new Error(error?.response?.data?.error || error.message);
  // }
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
    console.error(error);
    const err = error as { response?: { data?: { error?: string } }; message?: string };
    throw new Error(err?.response?.data?.error || err.message || 'Unknown error');
  }
};
