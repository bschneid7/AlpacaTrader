// Mock data for login response
// Users can customize this file to add additional user data as needed

import { User } from '@shared/types/user';
import { ROLES } from '@shared/config/roles';

// Login response spreads user fields at root level along with tokens
export type LoginMockResponse = User & {
  accessToken: string;
  refreshToken: string;
};

export const getLoginMockData = (email: string): LoginMockResponse => {
  const now = new Date().toISOString();

  return {
    _id: 'mock_user_id_1',
    email: email, // Use the email passed from login function
    role: ROLES.USER,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    isActive: true,
    accessToken: 'mock_access_token_123',
    refreshToken: 'mock_refresh_token_456',
    // Users can add additional mock fields here as needed
  };
};
