import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import User from '../models/User';
import StrategyConfig, { DEFAULT_AGGRESSIVE_STRATEGY } from '../models/StrategyConfig';

dotenv.config();

/**
 * Seed script to create default strategy configurations for existing users
 */
async function seedStrategyConfigs() {
  console.log('=== Strategy Config Seeding Script ===\n');

  try {
    // Connect to database
    console.log('[1/4] Connecting to database...');
    await connectDB();
    console.log('✓ Database connected successfully\n');

    // Get all users
    console.log('[2/4] Fetching all users...');
    const users = await User.find({});
    console.log(`✓ Found ${users.length} users\n`);

    if (users.length === 0) {
      console.log('No users found. Please run the main seed script first.');
      process.exit(0);
    }

    // Create strategy configs for users who don't have one
    console.log('[3/4] Creating strategy configurations...');
    let createdCount = 0;
    let existingCount = 0;

    for (const user of users) {
      const existingConfig = await StrategyConfig.findOne({ userId: user._id });

      if (existingConfig) {
        console.log(`  - User ${user.email}: Strategy config already exists`);
        existingCount++;
      } else {
        await StrategyConfig.create({
          userId: user._id,
          ...DEFAULT_AGGRESSIVE_STRATEGY,
        });
        console.log(`  - User ${user.email}: Created default strategy config`);
        createdCount++;
      }
    }

    console.log(`\n✓ Strategy config creation complete:`);
    console.log(`  - Created: ${createdCount}`);
    console.log(`  - Already existed: ${existingCount}`);
    console.log(`  - Total: ${users.length}\n`);

    // Verify the data
    console.log('[4/4] Verifying data...');
    const totalConfigs = await StrategyConfig.countDocuments();
    console.log(`✓ Total strategy configs in database: ${totalConfigs}\n`);

    // Display sample config
    const sampleConfig = await StrategyConfig.findOne().populate('userId', 'email');
    if (sampleConfig) {
      console.log('Sample strategy configuration:');
      const populatedUser = sampleConfig.userId as { email: string };
      console.log(`  User: ${populatedUser.email}`);
      console.log(`  Max Position Size: ${sampleConfig.maxPositionSize}%`);
      console.log(`  Max Concurrent Positions: ${sampleConfig.maxConcurrentPositions}`);
      console.log(`  Stop Loss: ${sampleConfig.stopLossPercentage}%`);
      console.log(`  Take Profit: ${sampleConfig.takeProfitTarget}%`);
      console.log(`  Monthly Target: ${sampleConfig.monthlyReturnTarget.min}-${sampleConfig.monthlyReturnTarget.max}%`);
      console.log(`  Market Hours Only: ${sampleConfig.marketHoursOnly}`);
      console.log(`  Min Stock Price: $${sampleConfig.minStockPrice}`);
      console.log(`  Min Daily Volume: ${sampleConfig.minDailyVolume.toLocaleString()}`);
      console.log(`  Market Caps: ${sampleConfig.marketCapPreferences.join(', ')}`);
      console.log(`  Sectors: ${sampleConfig.sectorPreferences.join(', ')}`);
    }

    console.log('\n=== Seeding completed successfully! ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seed function
seedStrategyConfigs();
