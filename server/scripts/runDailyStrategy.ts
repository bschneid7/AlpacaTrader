/**
 * Daily Strategy Execution Script
 *
 * Manually run the EMA/ATR bracket order strategy for all users with auto-trading enabled.
 * This can be scheduled via cron or run manually after market close.
 *
 * Usage: npx ts-node server/scripts/runDailyStrategy.ts
 */

import { connectDB } from '../config/database';
import TradingPreferences from '../models/TradingPreferences';
import AlpacaAccount from '../models/AlpacaAccount';
import User from '../models/User';
import * as strategyEngine from '../services/strategyEngine';
import * as bracketOrderService from '../services/bracketOrderService';
import * as monitoringService from '../services/monitoringService';

async function runDailyStrategy() {
  console.log('\n' + '='.repeat(70));
  console.log('DAILY EMA/ATR STRATEGY EXECUTION');
  console.log(new Date().toLocaleString());
  console.log('='.repeat(70));

  try {
    // Connect to database
    await connectDB();
    console.log('✓ Database connected');

    // Find all users with auto-trading enabled
    const activePreferences = await TradingPreferences.find({
      autoTradingEnabled: true,
    });

    if (activePreferences.length === 0) {
      console.log('\nNo users with auto-trading enabled.');
      console.log('Exiting...');
      process.exit(0);
    }

    console.log(`\n📊 Found ${activePreferences.length} user(s) with auto-trading enabled\n`);

    // Process each user
    for (const pref of activePreferences) {
      const userId = pref.userId.toString();

      try {
        console.log('-'.repeat(70));

        // Get user details
        const user = await User.findById(userId);
        if (!user) {
          console.log(`⚠️  User ${userId} not found, skipping`);
          continue;
        }

        console.log(`Processing user: ${user.email} (${userId})`);

        // Check Alpaca account
        const alpacaAccount = await AlpacaAccount.findOne({ userId });
        if (!alpacaAccount || !alpacaAccount.isConnected) {
          console.log('  ⚠️  Alpaca account not connected, skipping');
          continue;
        }

        console.log(`  ✓ Alpaca account connected (${alpacaAccount.mode} mode)`);

        // Run strategy analysis
        console.log('  📈 Running strategy analysis...');
        const signals = await strategyEngine.runStrategyAnalysis(userId);

        const buySignals = signals.filter(
          (s) => s.signalType === 'buy' && s.positionSize && s.positionSize > 0
        );

        console.log(`  ✓ Analysis complete: ${buySignals.length} buy signal(s) generated`);

        if (buySignals.length === 0) {
          console.log('  ℹ️  No actionable buy signals found');
          continue;
        }

        // Execute bracket orders
        let successCount = 0;
        let failureCount = 0;

        for (const signal of buySignals) {
          try {
            if (!signal.stopLoss || !signal.takeProfit || !signal.positionSize) {
              continue;
            }

            console.log(`  📤 Submitting bracket order for ${signal.symbol}...`);
            console.log(`     Qty: ${signal.positionSize}, Entry: $${signal.price.toFixed(2)}`);
            console.log(`     Stop: $${signal.stopLoss.toFixed(2)}, Target: $${signal.takeProfit.toFixed(2)}`);

            const order = await bracketOrderService.submitBracketOrder(userId, {
              symbol: signal.symbol,
              quantity: signal.positionSize,
              takeProfit: signal.takeProfit,
              stopLoss: signal.stopLoss,
              side: 'buy',
              timeInForce: 'day',
            });

            console.log(`  ✓ Order submitted: ${order.id}`);
            successCount++;

            // Mark signal as executed
            const unexecutedSignals = await strategyEngine.getUnexecutedSignals(userId);
            const matchingSignal = unexecutedSignals.find((s) => s.symbol === signal.symbol);
            if (matchingSignal) {
              await strategyEngine.markSignalExecuted(matchingSignal._id.toString(), order.id);
            }

            // Delay between orders
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } catch (error: any) {
            console.error(`  ✗ Failed to submit order for ${signal.symbol}:`, error.message);
            failureCount++;
          }
        }

        console.log(`\n  📊 Results for ${user.email}:`);
        console.log(`     Success: ${successCount}, Failed: ${failureCount}`);

        // Create summary alert
        if (successCount > 0) {
          await monitoringService.createAlert(
            userId,
            'info',
            'Daily Strategy Executed',
            `${successCount} bracket order(s) submitted successfully`,
            { successCount, failureCount, totalSignals: buySignals.length }
          );
        }
      } catch (error: any) {
        console.error(`✗ Error processing user ${userId}:`, error.message);
        console.error(error.stack);

        // Log error for user
        try {
          await monitoringService.createActivityLog(
            userId,
            'error',
            `Daily strategy execution failed: ${error.message}`,
            { error: error.message },
            'error'
          );
        } catch (logError) {
          console.error('Failed to log error:', logError);
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✓ DAILY STRATEGY EXECUTION COMPLETE');
    console.log('='.repeat(70));
  } catch (error: any) {
    console.error('\n✗ FATAL ERROR');
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }

  process.exit(0);
}

// Run the daily strategy
runDailyStrategy();
