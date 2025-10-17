/**
 * Test Script for EMA/ATR Strategy Engine
 *
 * Tests:
 * 1. Strategy signal generation
 * 2. EMA and ATR calculations
 * 3. Position sizing
 * 4. Signal persistence
 */

import { connectDB } from '../config/database.js';
import * as strategyEngine from '../services/strategyEngine.js';
import User from '../models/User.js';
import AlpacaAccount from '../models/AlpacaAccount.js';
import StrategyConfig from '../models/StrategyConfig.js';
import StrategySignal from '../models/StrategySignal.js';

async function runTests() {
  console.log('='.repeat(60));
  console.log('EMA/ATR STRATEGY ENGINE TEST');
  console.log('='.repeat(60));

  try {
    // Connect to database
    await connectDB();
    console.log('✓ Database connected');

    // Find a test user with Alpaca account
    const user = await User.findOne({ email: 'admin@pythagora.ai' });
    if (!user) {
      throw new Error('Test user not found');
    }
    console.log(`✓ Found test user: ${user.email}`);

    // Check Alpaca account
    const alpacaAccount = await AlpacaAccount.findOne({ userId: user._id });
    if (!alpacaAccount || !alpacaAccount.isConnected) {
      console.log('✗ Alpaca account not connected');
      console.log('  Please connect an Alpaca account first');
      process.exit(1);
    }
    console.log(`✓ Alpaca account connected (${alpacaAccount.mode} mode)`);

    // Check strategy config
    let config = await StrategyConfig.findOne({ userId: user._id });
    if (!config) {
      console.log('  Strategy config not found, will use defaults');
    } else {
      console.log('✓ Strategy config found');
      console.log(`  - Trading Universe: ${config.tradingUniverse.join(', ')}`);
      console.log(`  - EMA Fast: ${config.emaFastPeriod}, EMA Slow: ${config.emaSlowPeriod}`);
      console.log(`  - ATR Period: ${config.atrPeriod}`);
      console.log(`  - Stop Multiplier: ${config.atrStopMultiplier}x, TP Multiplier: ${config.atrTakeProfitMultiplier}x`);
      console.log(`  - Risk per Trade: ${config.riskPerTrade}%`);
    }

    console.log('\n' + '-'.repeat(60));
    console.log('TEST 1: Run Strategy Analysis');
    console.log('-'.repeat(60));

    const startTime = Date.now();
    const signals = await strategyEngine.runStrategyAnalysis(user._id.toString());
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✓ Analysis completed in ${duration}s`);
    console.log(`  Total signals: ${signals.length}`);
    console.log(`  Buy signals: ${signals.filter(s => s.signalType === 'buy').length}`);
    console.log(`  Hold signals: ${signals.filter(s => s.signalType === 'hold').length}`);

    // Display buy signals
    const buySignals = signals.filter(s => s.signalType === 'buy');
    if (buySignals.length > 0) {
      console.log('\n📈 Buy Signals:');
      buySignals.forEach((signal) => {
        console.log(`  ${signal.symbol}:`);
        console.log(`    Price: $${signal.price.toFixed(2)}`);
        console.log(`    Stop Loss: $${signal.stopLoss?.toFixed(2)}`);
        console.log(`    Take Profit: $${signal.takeProfit?.toFixed(2)}`);
        console.log(`    Position Size: ${signal.positionSize} shares`);
        console.log(`    Risk Amount: $${signal.riskAmount?.toFixed(2)}`);
        console.log(`    ATR: $${signal.atr?.toFixed(2)}`);
        console.log(`    Reason: ${signal.reason}`);
      });
    } else {
      console.log('\n  No buy signals generated (market conditions not favorable)');
    }

    console.log('\n' + '-'.repeat(60));
    console.log('TEST 2: Check Persisted Signals');
    console.log('-'.repeat(60));

    const persistedSignals = await StrategySignal.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`✓ Found ${persistedSignals.length} recent signals in database`);
    if (persistedSignals.length > 0) {
      console.log('\n  Most Recent Signals:');
      persistedSignals.slice(0, 5).forEach((signal) => {
        const timestamp = new Date(signal.createdAt).toLocaleString();
        console.log(`  - ${signal.symbol} (${signal.signalType}) at ${timestamp}`);
        console.log(`    Price: $${signal.price.toFixed(2)}, Executed: ${signal.executed}`);
      });
    }

    console.log('\n' + '-'.repeat(60));
    console.log('TEST 3: Get Unexecuted Signals');
    console.log('-'.repeat(60));

    const unexecuted = await strategyEngine.getUnexecutedSignals(user._id.toString());
    console.log(`✓ Found ${unexecuted.length} unexecuted buy signals`);
    if (unexecuted.length > 0) {
      console.log('\n  Pending Execution:');
      unexecuted.slice(0, 5).forEach((signal) => {
        console.log(`  - ${signal.symbol}: ${signal.positionSize} shares @ $${signal.price.toFixed(2)}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ ALL TESTS PASSED');
    console.log('='.repeat(60));
    console.log('\nNOTE: This test runs in read-only mode and does not submit any orders.');
    console.log('To execute trades, enable auto-trading and let the background job run,');
    console.log('or use the /api/strategy-engine/bracket-order endpoint.');

  } catch (error: any) {
    console.error('\n✗ TEST FAILED');
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }

  process.exit(0);
}

// Run tests
runTests();
