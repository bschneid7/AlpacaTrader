import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RiskLimits from '../models/RiskLimits';
import User from '../models/User';
import { connectDB } from '../config/database';

dotenv.config();

async function seedRiskLimits() {
  try {
    console.log('=== Starting Risk Limits Seeding ===\n');

    // Connect to database
    console.log('[1/4] Connecting to database...');
    await connectDB();
    console.log('✓ Database connected successfully\n');

    // Get all users
    console.log('[2/4] Fetching users...');
    const users = await User.find({});
    console.log(`✓ Found ${users.length} users\n`);

    if (users.length === 0) {
      console.log('⚠ No users found. Please run seed script first to create users.');
      process.exit(0);
    }

    // Create risk limits for each user
    console.log('[3/4] Creating risk limits for users...');
    let created = 0;
    let skipped = 0;

    for (const user of users) {
      const existingLimits = await RiskLimits.findOne({ userId: user._id });

      if (existingLimits) {
        console.log(`  ⊘ Skipping ${user.email} - risk limits already exist`);
        skipped++;
        continue;
      }

      await RiskLimits.create({
        userId: user._id,
        dailyLossLimit: {
          enabled: true,
          value: 5,
          type: 'percentage'
        },
        portfolioDrawdownLimit: {
          enabled: true,
          value: 15
        },
        positionLossThreshold: {
          enabled: true,
          value: 10
        },
        dailyLossThreshold: {
          enabled: true,
          value: 3
        },
        drawdownThreshold: {
          enabled: true,
          value: 10
        },
        volatilityThreshold: {
          enabled: true,
          value: 50
        },
        haltTradingOnDailyLimit: true,
        haltTradingOnDrawdown: true
      });

      console.log(`  ✓ Created risk limits for ${user.email}`);
      created++;
    }

    console.log(`\n✓ Risk limits creation completed: ${created} created, ${skipped} skipped\n`);

    // Verify creation
    console.log('[4/4] Verifying risk limits...');
    const totalLimits = await RiskLimits.countDocuments();
    console.log(`✓ Total risk limits in database: ${totalLimits}\n`);

    console.log('=== Risk Limits Seeding Completed Successfully ===');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding risk limits:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    process.exit(1);
  }
}

seedRiskLimits();
