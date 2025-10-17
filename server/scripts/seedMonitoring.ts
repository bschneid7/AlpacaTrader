import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../config/database';
import User from '../models/User';
import WatchlistStock from '../models/WatchlistStock';
import Order from '../models/Order';
import ActivityLog from '../models/ActivityLog';
import Alert from '../models/Alert';

dotenv.config();

const seedMonitoring = async () => {
  try {
    console.log('🌱 Starting monitoring data seeding...');

    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');

    // Get all users
    const users = await User.find();
    if (users.length === 0) {
      console.log('❌ No users found. Please run seed script first.');
      process.exit(1);
    }
    console.log(`✅ Found ${users.length} users`);

    // Clear existing monitoring data
    console.log('🗑️  Clearing existing monitoring data...');
    await WatchlistStock.deleteMany({});
    await Order.deleteMany({});
    await ActivityLog.deleteMany({});
    await Alert.deleteMany({});
    console.log('✅ Cleared existing monitoring data');

    // Seed data for each user
    for (const user of users) {
      console.log(`\n📊 Seeding monitoring data for user: ${user.email}`);

      // Watchlist stocks
      const watchlistStocks = [
        {
          userId: user._id,
          symbol: 'AAPL',
          name: 'Apple Inc.',
          price: 182.30,
          change: 2.18,
          changePercent: 1.21,
          status: 'monitoring',
          indicators: { rsi: 58.5, macd: 1.2, movingAverage: 180.5 },
          lastAnalyzed: new Date(Date.now() - 5 * 60000), // 5 minutes ago
          addedAt: new Date(Date.now() - 2 * 24 * 60 * 60000), // 2 days ago
          isActive: true
        },
        {
          userId: user._id,
          symbol: 'GOOGL',
          name: 'Alphabet Inc.',
          price: 142.80,
          change: -0.72,
          changePercent: -0.50,
          status: 'buy_signal',
          indicators: { rsi: 45.2, macd: 0.8, movingAverage: 145.3 },
          lastAnalyzed: new Date(Date.now() - 2 * 60000), // 2 minutes ago
          addedAt: new Date(Date.now() - 3 * 24 * 60 * 60000), // 3 days ago
          isActive: true
        },
        {
          userId: user._id,
          symbol: 'AMZN',
          name: 'Amazon.com Inc.',
          price: 155.80,
          change: 3.27,
          changePercent: 2.14,
          status: 'monitoring',
          indicators: { rsi: 62.1, macd: 1.5, movingAverage: 153.2 },
          lastAnalyzed: new Date(Date.now() - 8 * 60000), // 8 minutes ago
          addedAt: new Date(Date.now() - 1 * 24 * 60 * 60000), // 1 day ago
          isActive: true
        },
        {
          userId: user._id,
          symbol: 'MSFT',
          name: 'Microsoft Corporation',
          price: 375.60,
          change: 3.01,
          changePercent: 0.81,
          status: 'monitoring',
          indicators: { rsi: 55.8, macd: 0.9, movingAverage: 373.5 },
          lastAnalyzed: new Date(Date.now() - 10 * 60000), // 10 minutes ago
          addedAt: new Date(Date.now() - 5 * 24 * 60 * 60000), // 5 days ago
          isActive: true
        },
        {
          userId: user._id,
          symbol: 'META',
          name: 'Meta Platforms Inc.',
          price: 378.90,
          change: -4.92,
          changePercent: -1.28,
          status: 'analyzing',
          indicators: { rsi: 48.3, macd: -0.5, movingAverage: 382.1 },
          lastAnalyzed: new Date(Date.now() - 1 * 60000), // 1 minute ago
          addedAt: new Date(Date.now() - 4 * 24 * 60 * 60000), // 4 days ago
          isActive: true
        },
        {
          userId: user._id,
          symbol: 'NVDA',
          name: 'NVIDIA Corporation',
          price: 492.10,
          change: 16.74,
          changePercent: 3.52,
          status: 'buy_signal',
          indicators: { rsi: 68.5, macd: 2.1, movingAverage: 485.3 },
          lastAnalyzed: new Date(Date.now() - 3 * 60000), // 3 minutes ago
          addedAt: new Date(Date.now() - 6 * 24 * 60 * 60000), // 6 days ago
          isActive: true
        }
      ];

      await WatchlistStock.insertMany(watchlistStocks);
      console.log(`  ✅ Created ${watchlistStocks.length} watchlist stocks`);

      // Active Orders
      const orders = [
        {
          userId: user._id,
          orderId: `alpaca-order-${user._id.toString().slice(-6)}-001`,
          symbol: 'GOOGL',
          side: 'buy',
          type: 'limit',
          quantity: 15,
          limitPrice: 141.50,
          status: 'pending',
          filledQty: 0,
          submittedAt: new Date(Date.now() - 35 * 60000), // 35 minutes ago
          extendedHours: false,
          timeInForce: 'day',
          notes: 'Buy signal detected, waiting for favorable entry'
        },
        {
          userId: user._id,
          orderId: `alpaca-order-${user._id.toString().slice(-6)}-002`,
          symbol: 'NVDA',
          side: 'buy',
          type: 'limit',
          quantity: 10,
          limitPrice: 490.00,
          status: 'pending',
          filledQty: 0,
          submittedAt: new Date(Date.now() - 30 * 60000), // 30 minutes ago
          extendedHours: false,
          timeInForce: 'day',
          notes: 'Strong buy signal with momentum'
        },
        {
          userId: user._id,
          orderId: `alpaca-order-${user._id.toString().slice(-6)}-003`,
          symbol: 'AAPL',
          side: 'buy',
          type: 'market',
          quantity: 20,
          status: 'accepted',
          filledQty: 0,
          submittedAt: new Date(Date.now() - 2 * 60000), // 2 minutes ago
          extendedHours: false,
          timeInForce: 'day',
          notes: 'Market order for immediate execution'
        }
      ];

      await Order.insertMany(orders);
      console.log(`  ✅ Created ${orders.length} orders`);

      // Activity Log
      const activities = [
        {
          userId: user._id,
          type: 'analysis',
          action: 'Analyzing GOOGL for entry',
          symbol: 'GOOGL',
          details: { rsi: 45.2, macd: 0.8, signal: 'buy' },
          severity: 'info',
          timestamp: new Date(Date.now() - 5 * 60000)
        },
        {
          userId: user._id,
          type: 'trade',
          action: 'Position sizing calculated for NVDA',
          symbol: 'NVDA',
          details: { positionSize: 10, maxAllocation: 0.15 },
          severity: 'info',
          timestamp: new Date(Date.now() - 8 * 60000)
        },
        {
          userId: user._id,
          type: 'risk',
          action: 'Stop-loss triggered for TSLA',
          symbol: 'TSLA',
          details: { entryPrice: 245.30, exitPrice: 238.15, loss: -2.91 },
          severity: 'warning',
          timestamp: new Date(Date.now() - 15 * 60000)
        },
        {
          userId: user._id,
          type: 'trade',
          action: 'New position opened: AMZN',
          symbol: 'AMZN',
          details: { quantity: 20, entryPrice: 155.80 },
          severity: 'success',
          timestamp: new Date(Date.now() - 20 * 60000)
        },
        {
          userId: user._id,
          type: 'system',
          action: 'Monitoring market volatility',
          details: { vix: 14.5, marketCondition: 'normal' },
          severity: 'info',
          timestamp: new Date(Date.now() - 25 * 60000)
        },
        {
          userId: user._id,
          type: 'signal',
          action: 'Buy signal detected for NVDA',
          symbol: 'NVDA',
          details: { confidence: 0.85, indicators: { rsi: 68.5, macd: 2.1 } },
          severity: 'success',
          timestamp: new Date(Date.now() - 30 * 60000)
        },
        {
          userId: user._id,
          type: 'analysis',
          action: 'Technical analysis completed for META',
          symbol: 'META',
          details: { trend: 'bearish', support: 375.00, resistance: 385.00 },
          severity: 'info',
          timestamp: new Date(Date.now() - 35 * 60000)
        },
        {
          userId: user._id,
          type: 'trade',
          action: 'Order submitted for GOOGL',
          symbol: 'GOOGL',
          details: { side: 'buy', quantity: 15, limitPrice: 141.50 },
          severity: 'info',
          timestamp: new Date(Date.now() - 35 * 60000)
        }
      ];

      await ActivityLog.insertMany(activities);
      console.log(`  ✅ Created ${activities.length} activity log entries`);

      // Alerts
      const alerts = [
        {
          userId: user._id,
          type: 'critical',
          title: 'Stop-loss Hit',
          message: 'Stop-loss hit for TSLA position',
          symbol: 'TSLA',
          relatedData: {
            positionId: 'pos-123',
            entryPrice: 245.30,
            exitPrice: 238.15,
            loss: -2.91,
            lossAmount: -143.00
          },
          isRead: false,
          isAcknowledged: false,
          createdAt: new Date(Date.now() - 15 * 60000)
        },
        {
          userId: user._id,
          type: 'warning',
          title: 'Position Limit Warning',
          message: 'Approaching position limit (7/8)',
          relatedData: {
            currentPositions: 7,
            maxPositions: 8,
            percentage: 87.5
          },
          isRead: false,
          isAcknowledged: false,
          createdAt: new Date(Date.now() - 45 * 60000)
        },
        {
          userId: user._id,
          type: 'info',
          title: 'Order Filled',
          message: 'Order filled: AMZN 20 shares @ $155.80',
          symbol: 'AMZN',
          relatedData: {
            orderId: 'ord-456',
            quantity: 20,
            price: 155.80,
            totalValue: 3116.00
          },
          isRead: true,
          isAcknowledged: false,
          createdAt: new Date(Date.now() - 90 * 60000)
        },
        {
          userId: user._id,
          type: 'warning',
          title: 'High Volatility Detected',
          message: 'Unusual volatility detected in META',
          symbol: 'META',
          relatedData: {
            volatility: 0.42,
            threshold: 0.35,
            recommendation: 'reduce_position'
          },
          isRead: false,
          isAcknowledged: false,
          createdAt: new Date(Date.now() - 60 * 60000)
        },
        {
          userId: user._id,
          type: 'info',
          title: 'Buy Signal',
          message: 'Strong buy signal detected for NVDA',
          symbol: 'NVDA',
          relatedData: {
            confidence: 0.85,
            indicators: { rsi: 68.5, macd: 2.1 }
          },
          isRead: true,
          isAcknowledged: true,
          acknowledgedAt: new Date(Date.now() - 25 * 60000),
          createdAt: new Date(Date.now() - 30 * 60000)
        }
      ];

      await Alert.insertMany(alerts);
      console.log(`  ✅ Created ${alerts.length} alerts`);
    }

    console.log('\n✨ Monitoring data seeding completed successfully!');

    // Verify counts
    const watchlistCount = await WatchlistStock.countDocuments();
    const orderCount = await Order.countDocuments();
    const activityCount = await ActivityLog.countDocuments();
    const alertCount = await Alert.countDocuments();

    console.log('\n📈 Summary:');
    console.log(`  - Watchlist Stocks: ${watchlistCount}`);
    console.log(`  - Orders: ${orderCount}`);
    console.log(`  - Activity Logs: ${activityCount}`);
    console.log(`  - Alerts: ${alertCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding monitoring data:', error);
    process.exit(1);
  }
};

// Run the seed function
seedMonitoring();
