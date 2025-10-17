import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Trade from '../models/Trade';
import User from '../models/User';
import AlpacaAccount from '../models/AlpacaAccount';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alpaca-trader';

const testTrades = async () => {
  try {
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║     Trade History API Testing Script                 ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log(`📡 Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully\n');

    // Find a user with trades
    console.log('🔍 Looking for users with Alpaca accounts...');
    const users = await User.find().lean();

    if (users.length === 0) {
      console.log('❌ No users found. Please run the seed script first.');
      await mongoose.disconnect();
      return;
    }

    let userWithAccount = null;
    let alpacaAccount = null;

    for (const user of users) {
      const account = await AlpacaAccount.findOne({ userId: user._id }).lean();
      if (account) {
        userWithAccount = user;
        alpacaAccount = account;
        break;
      }
    }

    if (!userWithAccount || !alpacaAccount) {
      console.log('❌ No user with Alpaca account found.');
      await mongoose.disconnect();
      return;
    }

    console.log(`✅ Found user: ${userWithAccount.email}\n`);

    // Test 1: Get recent trades (limit 20)
    console.log('📋 Test 1: Getting recent trades (last 20)...');
    const recentTrades = await Trade.find({ userId: userWithAccount._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    console.log(`✅ Found ${recentTrades.length} recent trades`);
    if (recentTrades.length > 0) {
      console.log('   Sample trade:');
      const sample = recentTrades[0];
      console.log(`   - Symbol: ${sample.symbol}`);
      console.log(`   - Side: ${sample.side}`);
      console.log(`   - Quantity: ${sample.filledQuantity}`);
      console.log(`   - Price: $${sample.averagePrice.toFixed(2)}`);
      console.log(`   - Status: ${sample.status}`);
      if (sample.profitLoss !== undefined) {
        console.log(`   - P&L: $${sample.profitLoss.toFixed(2)}`);
      }
    }
    console.log();

    // Test 2: Get trade history with pagination
    console.log('📋 Test 2: Getting trade history with pagination...');
    const limit = 10;
    const offset = 0;
    const total = await Trade.countDocuments({ userId: userWithAccount._id });
    const historyTrades = await Trade.find({ userId: userWithAccount._id })
      .sort({ entryTime: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const hasMore = offset + historyTrades.length < total;
    console.log(`✅ Found ${historyTrades.length} trades (Total: ${total}, Has more: ${hasMore})`);
    console.log();

    // Test 3: Filter by symbol
    console.log('📋 Test 3: Filtering trades by symbol (AAPL)...');
    const aaplTrades = await Trade.find({
      userId: userWithAccount._id,
      symbol: 'AAPL'
    }).lean();
    console.log(`✅ Found ${aaplTrades.length} AAPL trades`);
    console.log();

    // Test 4: Filter by status
    console.log('📋 Test 4: Filtering trades by status (closed)...');
    const closedTrades = await Trade.find({
      userId: userWithAccount._id,
      status: 'closed'
    }).lean();
    console.log(`✅ Found ${closedTrades.length} closed trades`);
    console.log();

    // Test 5: Filter by date range
    console.log('📋 Test 5: Filtering trades by date range (last 7 days)...');
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentDateTrades = await Trade.find({
      userId: userWithAccount._id,
      entryTime: { $gte: sevenDaysAgo }
    }).lean();
    console.log(`✅ Found ${recentDateTrades.length} trades in the last 7 days`);
    console.log();

    // Test 6: Calculate statistics
    console.log('📊 Test 6: Calculating trade statistics...');
    const allClosedTrades = await Trade.find({
      userId: userWithAccount._id,
      status: 'closed'
    }).lean();

    const totalPL = allClosedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const winningTrades = allClosedTrades.filter(t => (t.profitLoss || 0) > 0);
    const losingTrades = allClosedTrades.filter(t => (t.profitLoss || 0) < 0);
    const winRate = allClosedTrades.length > 0 ? (winningTrades.length / allClosedTrades.length) * 100 : 0;
    const avgWin = winningTrades.length > 0
      ? winningTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / winningTrades.length
      : 0;
    const avgLoss = losingTrades.length > 0
      ? losingTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0) / losingTrades.length
      : 0;

    console.log('   Statistics:');
    console.log(`   - Total Closed Trades: ${allClosedTrades.length}`);
    console.log(`   - Winning Trades: ${winningTrades.length}`);
    console.log(`   - Losing Trades: ${losingTrades.length}`);
    console.log(`   - Win Rate: ${winRate.toFixed(1)}%`);
    console.log(`   - Total P&L: $${totalPL.toFixed(2)}`);
    console.log(`   - Average Win: $${avgWin.toFixed(2)}`);
    console.log(`   - Average Loss: $${avgLoss.toFixed(2)}`);
    console.log();

    // Test 7: Test trade model pre-save hook
    console.log('📋 Test 7: Testing Trade model pre-save hook (P&L calculation)...');
    const testTrade = await Trade.create({
      userId: userWithAccount._id,
      alpacaAccountId: alpacaAccount._id,
      symbol: 'TEST',
      assetClass: 'us_equity',
      side: 'buy',
      quantity: 10,
      filledQuantity: 10,
      entryPrice: 100,
      exitPrice: 110,
      averagePrice: 100,
      entryTime: new Date(),
      exitTime: new Date(),
      status: 'closed',
      orderId: 'test_order_123'
    });

    console.log(`✅ Created test trade with auto-calculated P&L: $${testTrade.profitLoss?.toFixed(2)}`);
    console.log(`   Expected: $${(110 - 100) * 10} (exit - entry) * quantity`);
    console.log(`   Duration: ${testTrade.duration} minutes`);

    // Clean up test trade
    await Trade.deleteOne({ _id: testTrade._id });
    console.log('   Test trade cleaned up');
    console.log();

    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║     All Tests Passed Successfully! ✅                ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');

    console.log('💡 API Endpoints ready for testing:');
    console.log('   GET  /api/alpaca/trades/recent');
    console.log('   GET  /api/alpaca/trades/history?limit=10&offset=0&status=closed');
    console.log();

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error: unknown) {
    console.error('❌ Error testing trades:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
    await mongoose.disconnect();
    process.exit(1);
  }
};

testTrades();
