import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';
import AlpacaAccount from '../models/AlpacaAccount';
import PortfolioService from '../services/portfolioService';

dotenv.config();

async function runTests() {
  console.log('=== Portfolio Service Test Script ===\n');

  try {
    // Connect to database
    console.log('Connecting to database...');
    await mongoose.connect(process.env.DATABASE_URL as string);
    console.log('Database connected successfully\n');

    // Find a user with Alpaca account
    console.log('Finding user with Alpaca account...');
    const alpacaAccount = await AlpacaAccount.findOne({ status: 'connected' });

    if (!alpacaAccount) {
      console.log('No connected Alpaca account found. Please connect an account first.');
      return;
    }

    const user = await User.findById(alpacaAccount.userId);
    if (!user) {
      console.log('User not found for Alpaca account');
      return;
    }

    console.log(`Found user: ${user.email} (${user._id})\n`);

    // Test 1: Calculate Portfolio Value
    console.log('=== Test 1: Calculate Portfolio Value ===');
    try {
      const portfolio = await PortfolioService.calculatePortfolioValue(user._id.toString());
      console.log('✓ Portfolio value calculated successfully');
      console.log('Portfolio Details:');
      console.log(`  Total Value: $${portfolio.totalValue.toFixed(2)}`);
      console.log(`  Equity: $${portfolio.equity.toFixed(2)}`);
      console.log(`  Cash: $${portfolio.cash.toFixed(2)}`);
      console.log(`  Buying Power: $${portfolio.buyingPower.toFixed(2)}`);
      console.log(`  Day P&L: $${portfolio.dayPL.toFixed(2)} (${portfolio.dayPLPercent.toFixed(2)}%)`);
      console.log(`  Unrealized P&L: $${portfolio.unrealizedPL.toFixed(2)} (${portfolio.unrealizedPLPercent.toFixed(2)}%)`);
      console.log(`  Last Updated: ${portfolio.lastUpdated.toISOString()}`);
    } catch (error) {
      if (error instanceof Error) {
        console.log('✗ Test failed:', error.message);
      }
    }
    console.log();

    // Test 2: Get Positions with P&L
    console.log('=== Test 2: Get Positions with P&L ===');
    try {
      const positions = await PortfolioService.getPositionsWithPL(user._id.toString());
      console.log(`✓ Found ${positions.length} positions`);

      if (positions.length > 0) {
        console.log('\nPosition Details:');
        positions.forEach((pos, index) => {
          console.log(`\n  Position ${index + 1}: ${pos.symbol}`);
          console.log(`    Quantity: ${pos.qty}`);
          console.log(`    Entry Price: $${pos.avgEntryPrice.toFixed(2)}`);
          console.log(`    Current Price: $${pos.currentPrice.toFixed(2)}`);
          console.log(`    Market Value: $${pos.marketValue.toFixed(2)}`);
          console.log(`    Cost Basis: $${pos.costBasis.toFixed(2)}`);
          console.log(`    Unrealized P&L: $${pos.unrealizedPL.toFixed(2)} (${pos.unrealizedPLPercent.toFixed(2)}%)`);
          console.log(`    Side: ${pos.side}`);
          console.log(`    Exchange: ${pos.exchange}`);
        });
      } else {
        console.log('  No positions found');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log('✗ Test failed:', error.message);
      }
    }
    console.log();

    // Test 3: Sync Positions to Database
    console.log('=== Test 3: Sync Positions to Database ===');
    try {
      await PortfolioService.syncPositionsToDatabase(user._id.toString());
      console.log('✓ Positions synced successfully');
    } catch (error) {
      if (error instanceof Error) {
        console.log('✗ Test failed:', error.message);
      }
    }
    console.log();

    // Test 4: Record Portfolio Snapshot
    console.log('=== Test 4: Record Portfolio Snapshot ===');
    try {
      await PortfolioService.recordPortfolioSnapshot(user._id.toString());
      console.log('✓ Portfolio snapshot recorded successfully');
    } catch (error) {
      if (error instanceof Error) {
        console.log('✗ Test failed:', error.message);
      }
    }
    console.log();

    // Test 5: Get Monthly Performance
    console.log('=== Test 5: Get Monthly Performance ===');
    try {
      const monthlyPerf = await PortfolioService.getMonthlyPerformance(user._id.toString());
      console.log(`✓ Found ${monthlyPerf.length} months of performance data`);

      if (monthlyPerf.length > 0) {
        console.log('\nMonthly Performance:');
        monthlyPerf.forEach((month) => {
          console.log(`  ${month.month}: $${month.return.toFixed(2)} (${month.returnPercent.toFixed(2)}%)`);
        });
      } else {
        console.log('  No monthly performance data found');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log('✗ Test failed:', error.message);
      }
    }
    console.log();

    // Test 6: Test Caching
    console.log('=== Test 6: Test Caching ===');
    try {
      console.log('First call (should hit API)...');
      const start1 = Date.now();
      await PortfolioService.calculatePortfolioValue(user._id.toString());
      const time1 = Date.now() - start1;
      console.log(`  Time: ${time1}ms`);

      console.log('Second call (should use cache)...');
      const start2 = Date.now();
      await PortfolioService.calculatePortfolioValue(user._id.toString());
      const time2 = Date.now() - start2;
      console.log(`  Time: ${time2}ms`);

      if (time2 < time1 / 2) {
        console.log('✓ Caching working correctly (second call faster)');
      } else {
        console.log('⚠ Caching may not be working optimally');
      }

      // Clear cache
      PortfolioService.clearPortfolioCache(user._id.toString());
      console.log('✓ Cache cleared successfully');
    } catch (error) {
      if (error instanceof Error) {
        console.log('✗ Test failed:', error.message);
      }
    }
    console.log();

    console.log('=== All Tests Complete ===');
  } catch (error) {
    if (error instanceof Error) {
      console.error('Test script error:', error.message);
      console.error(error.stack);
    }
  } finally {
    await mongoose.disconnect();
    console.log('\nDatabase disconnected');
  }
}

runTests();
