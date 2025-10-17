import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import AlpacaAccount from '../models/AlpacaAccount';
import Position from '../models/Position';
import RiskLimits from '../models/RiskLimits';
import RiskMetrics from '../models/RiskMetrics';
import riskService from '../services/riskService';
import { connectDB } from '../config/database';

dotenv.config();

async function testRisk() {
  try {
    console.log('=== Starting Risk Service Tests ===\n');

    // Connect to database
    console.log('[1/6] Connecting to database...');
    await connectDB();
    console.log('✓ Database connected successfully\n');

    // Find a user with Alpaca account
    console.log('[2/6] Finding test user...');
    const alpacaAccount = await AlpacaAccount.findOne({ isConnected: true });
    if (!alpacaAccount) {
      console.log('❌ No Alpaca accounts found. Please run seed script first.');
      process.exit(1);
    }

    const user = await User.findById(alpacaAccount.userId);
    if (!user) {
      console.log('❌ User not found.');
      process.exit(1);
    }
    console.log(`✓ Found user: ${user.email}`);
    console.log(`✓ Found Alpaca account (${alpacaAccount.isPaperTrading ? 'paper' : 'live'} mode)\n`);

    // Test 1: Get Risk Limits
    console.log('[3/6] Testing getRiskLimits...');
    try {
      const limits = await riskService.getRiskLimits(user._id.toString());
      console.log('✓ Risk limits retrieved:');
      console.log(`  - Daily Loss Limit: ${limits.dailyLossLimit.value}% (${limits.dailyLossLimit.enabled ? 'enabled' : 'disabled'})`);
      console.log(`  - Drawdown Limit: ${limits.portfolioDrawdownLimit.value}% (${limits.portfolioDrawdownLimit.enabled ? 'enabled' : 'disabled'})`);
      console.log(`  - Halt on Daily Limit: ${limits.haltTradingOnDailyLimit}`);
      console.log(`  - Halt on Drawdown: ${limits.haltTradingOnDrawdown}\n`);
    } catch (error) {
      console.error('❌ getRiskLimits failed:', error instanceof Error ? error.message : error);
    }

    // Test 2: Update Risk Limits
    console.log('[4/6] Testing updateRiskLimits...');
    try {
      const updatedLimits = await riskService.updateRiskLimits(user._id.toString(), {
        dailyLossLimit: {
          enabled: true,
          value: 7,
          type: 'percentage'
        },
        portfolioDrawdownLimit: {
          enabled: true,
          value: 20
        },
        haltTradingOnDailyLimit: false
      });
      console.log('✓ Risk limits updated:');
      console.log(`  - Daily Loss Limit: ${updatedLimits.dailyLossLimit.value}%`);
      console.log(`  - Drawdown Limit: ${updatedLimits.portfolioDrawdownLimit.value}%`);
      console.log(`  - Halt on Daily Limit: ${updatedLimits.haltTradingOnDailyLimit}\n`);
    } catch (error) {
      console.error('❌ updateRiskLimits failed:', error instanceof Error ? error.message : error);
    }

    // Test 3: Calculate Risk Metrics
    console.log('[5/6] Testing calculateRiskMetrics...');
    try {
      const metrics = await riskService.calculateRiskMetrics(user._id.toString());
      console.log('✓ Risk metrics calculated:');
      console.log(`  - Portfolio Value: $${metrics.portfolioValue.toFixed(2)}`);
      console.log(`  - Cash Available: $${metrics.cashAvailable.toFixed(2)}`);
      console.log(`  - Risk Exposure: ${metrics.currentRiskExposure.toFixed(2)}%`);
      console.log(`  - Daily P&L: $${metrics.dailyPnL.toFixed(2)} (${metrics.dailyPnLPercentage.toFixed(2)}%)`);
      console.log(`  - Current Drawdown: ${metrics.currentDrawdown.toFixed(2)}%`);
      console.log(`  - Max Drawdown: ${metrics.maxDrawdown.toFixed(2)}%`);
      console.log(`  - Sector Concentration: ${metrics.sectorConcentration.length} sectors`);
      metrics.sectorConcentration.forEach(sector => {
        console.log(`    * ${sector.sector}: ${sector.percentage.toFixed(2)}%`);
      });
      console.log(`  - Position Concentration: ${metrics.positionConcentration.length} positions`);
      metrics.positionConcentration.slice(0, 5).forEach(pos => {
        console.log(`    * ${pos.symbol}: ${pos.percentage.toFixed(2)}%`);
      });
      console.log(`  - Volatility Index: ${metrics.volatilityIndex.toFixed(2)}%\n`);
    } catch (error) {
      console.error('❌ calculateRiskMetrics failed:', error instanceof Error ? error.message : error);
      console.error('Full error:', error);
    }

    // Test 4: Get Risk Metrics (cached)
    console.log('[6/6] Testing getRiskMetrics (should use cache)...');
    try {
      const startTime = Date.now();
      const metrics = await riskService.getRiskMetrics(user._id.toString());
      const endTime = Date.now();
      console.log(`✓ Risk metrics retrieved in ${endTime - startTime}ms (cached)`);
      console.log(`  - Portfolio Value: $${metrics.portfolioValue.toFixed(2)}`);
      console.log(`  - Risk Exposure: ${metrics.currentRiskExposure.toFixed(2)}%\n`);
    } catch (error) {
      console.error('❌ getRiskMetrics failed:', error instanceof Error ? error.message : error);
    }

    // Test 5: Check Risk Breaches
    console.log('[Bonus] Testing checkRiskLimitBreaches...');
    try {
      const breachCheck = await riskService.checkRiskLimitBreaches(user._id.toString());
      console.log('✓ Risk breach check completed:');
      console.log(`  - Breached: ${breachCheck.breached}`);
      console.log(`  - Should Halt Trading: ${breachCheck.shouldHaltTrading}`);
      if (breachCheck.breaches.length > 0) {
        console.log(`  - Breaches:`);
        breachCheck.breaches.forEach(breach => {
          console.log(`    * ${breach}`);
        });
      } else {
        console.log(`  - No breaches detected`);
      }
      console.log();
    } catch (error) {
      console.error('❌ checkRiskLimitBreaches failed:', error instanceof Error ? error.message : error);
    }

    console.log('=== Risk Service Tests Completed ===');
    console.log('\n📊 Summary:');
    const totalMetrics = await RiskMetrics.countDocuments({ userId: user._id });
    const totalLimits = await RiskLimits.countDocuments({ userId: user._id });
    console.log(`  - Risk Metrics Records: ${totalMetrics}`);
    console.log(`  - Risk Limits Records: ${totalLimits}`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
    process.exit(1);
  }
}

testRisk();
