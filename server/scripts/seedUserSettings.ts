import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import User from '../models/User';
import UserSettings from '../models/UserSettings';

dotenv.config();

const seedUserSettings = async () => {
  try {
    console.log('[SeedUserSettings] Starting user settings seeding...');

    await connectDB();
    console.log('[SeedUserSettings] Database connected');

    // Get all users
    const users = await User.find();
    console.log(`[SeedUserSettings] Found ${users.length} users`);

    if (users.length === 0) {
      console.log('[SeedUserSettings] No users found. Please seed users first.');
      process.exit(0);
    }

    let createdCount = 0;
    let existingCount = 0;

    for (const user of users) {
      const existingSettings = await UserSettings.findOne({ userId: user._id });

      if (existingSettings) {
        console.log(`[SeedUserSettings] Settings already exist for user: ${user.email}`);
        existingCount++;
        continue;
      }

      const settings = await UserSettings.create({
        userId: user._id,
        accountDetails: {
          firstName: '',
          lastName: '',
          phone: '',
          timezone: 'America/New_York',
          language: 'en',
        },
        notificationPreferences: {
          emailNotifications: true,
          emailAddress: user.email,
          alertFrequency: 'immediate',
          tradeExecutions: true,
          positionUpdates: true,
          riskAlerts: true,
          dailySummary: true,
          weeklySummary: false,
          monthlySummary: true,
        },
        displayPreferences: {
          currencyFormat: 'USD',
          dateFormat: 'MM/DD/YYYY',
          timeFormat: '12h',
          dashboardRefreshRate: 30,
        },
        sessionSettings: {
          autoLogoutMinutes: 30,
          requirePasswordForSensitiveActions: true,
        },
      });

      console.log(`[SeedUserSettings] Created settings for user: ${user.email} (ID: ${settings._id})`);
      createdCount++;
    }

    console.log('\n[SeedUserSettings] Seeding Summary:');
    console.log(`  - Created: ${createdCount}`);
    console.log(`  - Already existed: ${existingCount}`);
    console.log(`  - Total users: ${users.length}`);
    console.log('[SeedUserSettings] User settings seeding completed successfully!');

    process.exit(0);
  } catch (error) {
    console.error('[SeedUserSettings] Error seeding user settings:', error);
    process.exit(1);
  }
};

seedUserSettings();
