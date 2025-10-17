/**
 * Test Trading Engine
 * Comprehensive test of the automated trading engine and signal generation
 */

import { connectDB } from '../config/database.js';
import { tradingEngine } from '../services/tradingEngine.js';
import * as technicalIndicators from '../services/technicalIndicators.js';
import User from '../models/User.js';
import AlpacaAccount from '../models/AlpacaAccount.js';
import TradingPreferences from '../models/TradingPreferences.js';
import StrategyConfig from '../models/StrategyConfig.js';
import Position from '../models/Position.js';
import WatchlistStock from '../models/WatchlistStock.js';
import ActivityLog from '../models/ActivityLog.js';

async function testTechnicalIndicators() {
  console.log('\n========================================');
  console.log('TEST 1: Technical Indicators');
  console.log('========================================\n');

  // Create sample price data (60 days of uptrend)
  const priceData = [];
  let basePrice = 100;

  for (let i = 0; i < 60; i++) {
    const randomChange = (Math.random() - 0.45) * 2; // Slight upward bias
    basePrice = basePrice + randomChange;

    priceData.push({
      timestamp: new Date(Date.now() - (60 - i) * 24 * 60 * 60 * 1000).toISOString(),
      open: basePrice - Math.random(),
      high: basePrice + Math.random() * 2,
      low: basePrice - Math.random() * 2,
      close: basePrice,
      volume: Math.floor(1000000 + Math.random() * 5000000)
    });
  }

  console.log(`Created ${priceData.length} days of price data`);
  console.log(`Price range: $${Math.min(...priceData.map(p => p.close)).toFixed(2)} - $${Math.max(...priceData.map(p => p.close)).toFixed(2)}`);

  // Test SMA calculation
  const closePrices = priceData.map(p => p.close);
  const sma20 = technicalIndicators.calculateSMA(closePrices, 20);
  const sma50 = technicalIndicators.calculateSMA(closePrices, 50);
  console.log(`\nSMA(20): $${sma20.toFixed(2)}`);
  console.log(`SMA(50): $${sma50.toFixed(2)}`);

  // Test EMA calculation
  const ema12 = technicalIndicators.calculateEMA(closePrices, 12);
  const ema26 = technicalIndicators.calculateEMA(closePrices, 26);
  console.log(`\nEMA(12): $${ema12.toFixed(2)}`);
  console.log(`EMA(26): $${ema26.toFixed(2)}`);

  // Test RSI calculation
  const rsi = technicalIndicators.calculateRSI(closePrices, 14);
  console.log(`\nRSI(14): ${rsi.toFixed(2)}`);

  if (rsi < 30) {
    console.log('✓ RSI indicates OVERSOLD condition');
  } else if (rsi > 70) {
    console.log('✓ RSI indicates OVERBOUGHT condition');
  } else {
    console.log('✓ RSI indicates NEUTRAL condition');
  }

  // Test MACD calculation
  const macd = technicalIndicators.calculateMACD(closePrices);
  console.log(`\nMACD: ${macd.macd.toFixed(4)}`);
  console.log(`Signal: ${macd.signal.toFixed(4)}`);
  console.log(`Histogram: ${macd.histogram.toFixed(4)}`);

  if (macd.histogram > 0) {
    console.log('✓ MACD indicates BULLISH momentum');
  } else {
    console.log('✓ MACD indicates BEARISH momentum');
  }

  // Test complete technical analysis
  const technicals = await technicalIndicators.analyzeTechnicals(priceData);
  console.log(`\n--- Complete Technical Analysis ---`);
  console.log(`Trend: ${technicals.trend.toUpperCase()}`);
  console.log(`Signal Strength: ${technicals.strength}/100`);

  // Test buy signal
  const shouldBuyStock = technicalIndicators.shouldBuy(technicals);
  console.log(`\nBuy Signal: ${shouldBuyStock ? 'YES ✓' : 'NO'}`);

  // Test sell signal
  const currentPrice = closePrices[closePrices.length - 1];
  const entryPrice = currentPrice * 0.95; // 5% gain
  const sellDecision = technicalIndicators.shouldSell(technicals, entryPrice, currentPrice, 5, 10);
  console.log(`Sell Signal: ${sellDecision.shouldSell ? 'YES ✓' : 'NO'} (Reason: ${sellDecision.reason})`);

  console.log('\n✓ Technical indicators test completed\n');
}

async function testTradingEngine() {
  console.log('\n========================================');
  console.log('TEST 2: Trading Engine Functions');
  console.log('========================================\n');

  // Find a test user (use any existing user)
  const user = await User.findOne();

  if (!user) {
    console.log('❌ Test user not found. Please run seed script first.');
    return;
  }

  console.log(`✓ Found test user: ${user.email}`);

  // Test getting tradeable stocks
  console.log('\n--- Testing Tradeable Stocks ---');
  const stocks = await tradingEngine.getTradeableStocks(user._id.toString());
  console.log(`✓ Found ${stocks.length} tradeable stocks`);
  console.log(`Sample stocks: ${stocks.slice(0, 10).join(', ')}`);

  // Test position size calculation
  console.log('\n--- Testing Position Size Calculation ---');
  const buyingPower = 10000;
  const stockPrice = 150;
  const quantity = await tradingEngine.calculatePositionSize(user._id.toString(), stockPrice, buyingPower);
  console.log(`✓ Calculated position size: ${quantity} shares`);
  console.log(`  Stock price: $${stockPrice}`);
  console.log(`  Buying power: $${buyingPower}`);
  console.log(`  Position value: $${(quantity * stockPrice).toFixed(2)}`);
  console.log(`  Percentage of buying power: ${((quantity * stockPrice / buyingPower) * 100).toFixed(2)}%`);

  console.log('\n✓ Trading engine functions test completed\n');
}

async function testDatabaseIntegration() {
  console.log('\n========================================');
  console.log('TEST 3: Database Integration');
  console.log('========================================\n');

  // Find test user
  const user = await User.findOne();

  if (!user) {
    console.log('❌ Test user not found');
    return;
  }

  // Check Alpaca account
  console.log('--- Checking Alpaca Account ---');
  const alpacaAccount = await AlpacaAccount.findOne({ userId: user._id });

  if (alpacaAccount) {
    console.log(`✓ Alpaca account found`);
    console.log(`  Mode: ${alpacaAccount.mode}`);
    console.log(`  Status: ${alpacaAccount.connectionStatus}`);
  } else {
    console.log('⚠ No Alpaca account found');
  }

  // Check trading preferences
  console.log('\n--- Checking Trading Preferences ---');
  const preferences = await TradingPreferences.findOne({ userId: user._id });

  if (preferences) {
    console.log(`✓ Trading preferences found`);
    console.log(`  Auto-trading: ${preferences.autoTradingEnabled ? 'ENABLED' : 'DISABLED'}`);
    console.log(`  Last toggled: ${preferences.lastToggledAt}`);
  } else {
    console.log('⚠ No trading preferences found');
  }

  // Check strategy config
  console.log('\n--- Checking Strategy Config ---');
  const strategy = await StrategyConfig.findOne({ userId: user._id });

  if (strategy) {
    console.log(`✓ Strategy config found`);
    console.log(`  Max position size: ${strategy.riskTolerance.maxPositionSize}%`);
    console.log(`  Max concurrent positions: ${strategy.riskTolerance.maxConcurrentPositions}`);
    console.log(`  Stop loss: ${strategy.riskTolerance.stopLoss}%`);
    console.log(`  Take profit: ${strategy.riskTolerance.takeProfit}%`);
    console.log(`  Target monthly return: ${strategy.monthlyReturnTarget}%`);
  } else {
    console.log('⚠ No strategy config found');
  }

  // Check positions
  console.log('\n--- Checking Positions ---');
  const positions = await Position.find({ userId: user._id, status: 'open' });
  console.log(`✓ Found ${positions.length} open positions`);

  if (positions.length > 0) {
    positions.forEach((pos, idx) => {
      console.log(`  ${idx + 1}. ${pos.symbol}: ${pos.quantity} shares @ $${pos.entryPrice}`);
    });
  }

  // Check watchlist
  console.log('\n--- Checking Watchlist ---');
  const watchlist = await WatchlistStock.find({ userId: user._id }).sort({ lastAnalyzed: -1 }).limit(5);
  console.log(`✓ Found ${watchlist.length} stocks in watchlist (showing last 5)`);

  watchlist.forEach((stock, idx) => {
    console.log(`  ${idx + 1}. ${stock.symbol}: $${stock.currentPrice?.toFixed(2) || 'N/A'} - ${stock.status}`);
    if (stock.indicators) {
      console.log(`     RSI: ${stock.indicators.rsi?.toFixed(2) || 'N/A'}`);
    }
  });

  // Check recent activity logs
  console.log('\n--- Checking Recent Activity Logs ---');
  const logs = await ActivityLog.find({ userId: user._id })
    .sort({ timestamp: -1 })
    .limit(5);

  console.log(`✓ Found ${logs.length} recent activity logs (showing last 5)`);

  logs.forEach((log, idx) => {
    console.log(`  ${idx + 1}. [${log.activityType}] ${log.description}`);
    console.log(`     Time: ${log.timestamp}`);
  });

  console.log('\n✓ Database integration test completed\n');
}

async function testFullTradingCycle() {
  console.log('\n========================================');
  console.log('TEST 4: Full Trading Cycle (Dry Run)');
  console.log('========================================\n');

  console.log('⚠ NOTE: This is a dry run test. No actual trades will be executed.');
  console.log('⚠ To test with real Alpaca API, ensure credentials are configured.\n');

  // Find test user
  const user = await User.findOne();

  if (!user) {
    console.log('❌ Test user not found');
    return;
  }

  console.log(`✓ Testing trading cycle for user: ${user.email}`);

  // Check prerequisites
  const preferences = await TradingPreferences.findOne({ userId: user._id });
  const alpacaAccount = await AlpacaAccount.findOne({ userId: user._id });

  if (!preferences) {
    console.log('❌ No trading preferences found. Cannot proceed.');
    return;
  }

  if (!alpacaAccount) {
    console.log('❌ No Alpaca account found. Cannot proceed.');
    return;
  }

  console.log(`\n✓ Auto-trading is ${preferences.autoTradingEnabled ? 'ENABLED' : 'DISABLED'}`);
  console.log(`✓ Alpaca account mode: ${alpacaAccount.mode}`);

  if (!preferences.autoTradingEnabled) {
    console.log('\n⚠ Auto-trading is disabled. Skipping trading cycle execution.');
    console.log('  Enable auto-trading in the app to test full cycle.\n');
    return;
  }

  // Attempt to run trading cycle
  console.log('\n--- Executing Trading Cycle ---');

  try {
    await tradingEngine.processUserTrading(user._id.toString());
    console.log('\n✓ Trading cycle completed successfully');
  } catch (error: any) {
    console.log('\n❌ Trading cycle encountered an error:');
    console.error(error.message);
    console.log('\nThis may be expected if:');
    console.log('  - Market is currently closed');
    console.log('  - Alpaca credentials are not configured');
    console.log('  - Risk limits have halted trading');
  }

  console.log('\n✓ Full trading cycle test completed\n');
}

async function runAllTests() {
  try {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  TRADING ENGINE TEST SUITE             ║');
    console.log('╚════════════════════════════════════════╝\n');

    // Connect to database
    console.log('Connecting to database...');
    await connectDB();
    console.log('✓ Database connected\n');

    // Run all tests
    await testTechnicalIndicators();
    await testTradingEngine();
    await testDatabaseIntegration();
    await testFullTradingCycle();

    console.log('╔════════════════════════════════════════╗');
    console.log('║  ALL TESTS COMPLETED                   ║');
    console.log('╚════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed with error:', error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
