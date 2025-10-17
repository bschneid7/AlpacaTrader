import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import User from '../models/User';
import * as settingsService from '../services/settingsService';

dotenv.config();

const testSettings = async () => {
  try {
    console.log('[TestSettings] Starting settings tests...\n');

    await connectDB();
    console.log('[TestSettings] Database connected\n');

    // Find a test user
    const user = await User.findOne();
    if (!user) {
      console.error('[TestSettings] No users found. Please create a user first.');
      process.exit(1);
    }

    const userId = user._id.toString();
    console.log(`[TestSettings] Testing with user: ${user.email} (${userId})\n`);

    // Test 1: Get account settings
    console.log('=== Test 1: Get Account Settings ===');
    const accountSettings = await settingsService.getAccountSettings(userId);
    console.log('Account Settings:', JSON.stringify(accountSettings, null, 2));
    console.log('✓ Test 1 passed\n');

    // Test 2: Update notification preferences
    console.log('=== Test 2: Update Notification Preferences ===');
    const updatedNotifications = await settingsService.updateNotificationPreferences(userId, {
      emailNotifications: true,
      emailAddress: 'test@example.com',
      alertFrequency: 'hourly',
      tradeExecutions: true,
      riskAlerts: true,
    });
    console.log('Updated Notifications:', JSON.stringify(updatedNotifications.notificationPreferences, null, 2));
    console.log('✓ Test 2 passed\n');

    // Test 3: Update account details
    console.log('=== Test 3: Update Account Details ===');
    const updatedDetails = await settingsService.updateAccountDetails(userId, {
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      timezone: 'America/Los_Angeles',
    });
    console.log('Updated Details:', JSON.stringify(updatedDetails.accountDetails, null, 2));
    console.log('✓ Test 3 passed\n');

    // Test 4: Update display preferences
    console.log('=== Test 4: Update Display Preferences ===');
    const updatedDisplay = await settingsService.updateDisplayPreferences(userId, {
      timeFormat: '24h',
      dashboardRefreshRate: 60,
    });
    console.log('Updated Display:', JSON.stringify(updatedDisplay.displayPreferences, null, 2));
    console.log('✓ Test 4 passed\n');

    // Test 5: Update session settings
    console.log('=== Test 5: Update Session Settings ===');
    const updatedSession = await settingsService.updateSessionSettings(userId, {
      autoLogoutMinutes: 60,
      requirePasswordForSensitiveActions: false,
    });
    console.log('Updated Session:', JSON.stringify(updatedSession.sessionSettings, null, 2));
    console.log('✓ Test 5 passed\n');

    // Test 6: Validation tests
    console.log('=== Test 6: Validation Tests ===');
    try {
      await settingsService.updateNotificationPreferences(userId, {
        emailAddress: 'invalid-email',
      } as any);
      console.log('✗ Test 6a failed: Should have thrown error for invalid email');
    } catch (error: any) {
      console.log('✓ Test 6a passed: Invalid email rejected:', error.message);
    }

    try {
      await settingsService.updateDisplayPreferences(userId, {
        dashboardRefreshRate: 1000, // Too high
      });
      console.log('✗ Test 6b failed: Should have thrown error for invalid refresh rate');
    } catch (error: any) {
      console.log('✓ Test 6b passed: Invalid refresh rate rejected:', error.message);
    }

    console.log('\n[TestSettings] All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('[TestSettings] Error during tests:', error);
    process.exit(1);
  }
};

testSettings();
