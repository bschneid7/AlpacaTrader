import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User';
import TradingPreferences from '../models/TradingPreferences';

// ES module equivalents of __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alpaca-trader';

/**
 * Seed script to create default trading preferences for all existing users
 * This ensures users have trading preferences records even if they existed before this feature
 */
async function seedTradingPreferences() {
  try {
    console.log('=== Seeding Trading Preferences ===');
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);

    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users in database`);

    if (users.length === 0) {
      console.log('No users found. Nothing to seed.');
      await mongoose.connection.close();
      return;
    }

    let createdCount = 0;
    let skippedCount = 0;

    // Create trading preferences for each user if they don't exist
    for (const user of users) {
      const existingPrefs = await TradingPreferences.findOne({ userId: user._id });

      if (existingPrefs) {
        console.log(`Trading preferences already exist for user: ${user.email}`);
        skippedCount++;
        continue;
      }

      // Create default trading preferences
      await TradingPreferences.create({
        userId: user._id,
        autoTradingEnabled: false,
        tradingStatus: 'stopped',
        lastToggleTime: new Date(),
      });

      console.log(`Created default trading preferences for user: ${user.email}`);
      createdCount++;
    }

    console.log('\n=== Seeding Complete ===');
    console.log(`Total users: ${users.length}`);
    console.log(`Created new preferences: ${createdCount}`);
    console.log(`Skipped (already exist): ${skippedCount}`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding trading preferences:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the seed function
seedTradingPreferences();
