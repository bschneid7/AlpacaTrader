import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Trade from '../models/Trade';
import User from '../models/User';
import AlpacaAccount from '../models/AlpacaAccount';
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alpaca-trader';
const seedTrades = async () => {
    try {
        console.log('Starting trade seeding process...');
        console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully');
        // Find a user with an Alpaca account
        console.log('Looking for users with Alpaca accounts...');
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
            console.log('❌ No user with Alpaca account found. Please connect an Alpaca account first.');
            await mongoose.disconnect();
            return;
        }
        console.log(`✅ Found user: ${userWithAccount.email} with Alpaca account`);
        // Clear existing trades for this user
        const deleteResult = await Trade.deleteMany({ userId: userWithAccount._id });
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing trades`);
        // Sample trade data
        const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD', 'INTC', 'NFLX'];
        const trades = [];
        const now = new Date();
        // Create 30 sample trades (mix of open and closed)
        for (let i = 0; i < 30; i++) {
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const side = Math.random() > 0.5 ? 'buy' : 'sell';
            const quantity = Math.floor(Math.random() * 50) + 10;
            const entryPrice = Math.random() * 200 + 50;
            const status = i < 20 ? 'closed' : 'open'; // First 20 are closed, last 10 are open
            const entryTime = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000); // i+1 days ago
            const trade = {
                userId: userWithAccount._id,
                alpacaAccountId: alpacaAccount._id,
                symbol,
                assetClass: 'us_equity',
                side,
                quantity,
                filledQuantity: quantity,
                entryPrice,
                averagePrice: entryPrice,
                entryTime,
                status,
                orderId: `order_${Math.random().toString(36).substr(2, 9)}`,
                exchange: 'NASDAQ',
                orderType: 'market',
                timeInForce: 'day',
                strategyName: 'Aggressive Growth Strategy',
            };
            if (status === 'closed') {
                // Add exit details for closed trades
                const exitTime = new Date(entryTime.getTime() + Math.random() * 48 * 60 * 60 * 1000); // 0-48 hours later
                const priceChange = (Math.random() - 0.4) * entryPrice * 0.15; // -40% to +60% chance, max 15% move
                const exitPrice = entryPrice + priceChange;
                trade.exitTime = exitTime;
                trade.exitPrice = exitPrice;
                // profitLoss will be calculated by the pre-save hook
            }
            trades.push(trade);
        }
        console.log(`Creating ${trades.length} sample trades...`);
        const createdTrades = await Trade.create(trades);
        console.log(`✅ Created ${createdTrades.length} trades successfully`);
        // Display summary statistics
        const closedTrades = createdTrades.filter(t => t.status === 'closed');
        const totalPL = closedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
        const winningTrades = closedTrades.filter(t => (t.profitLoss || 0) > 0);
        const losingTrades = closedTrades.filter(t => (t.profitLoss || 0) < 0);
        const winRate = closedTrades.length > 0 ? (winningTrades.length / closedTrades.length) * 100 : 0;
        console.log('\n📊 Trade Summary:');
        console.log(`   Total Trades: ${createdTrades.length}`);
        console.log(`   Closed Trades: ${closedTrades.length}`);
        console.log(`   Open Trades: ${createdTrades.length - closedTrades.length}`);
        console.log(`   Winning Trades: ${winningTrades.length}`);
        console.log(`   Losing Trades: ${losingTrades.length}`);
        console.log(`   Win Rate: ${winRate.toFixed(1)}%`);
        console.log(`   Total P&L: $${totalPL.toFixed(2)}`);
        console.log('\n🔍 Sample Recent Trades:');
        const recentTrades = await Trade.find({ userId: userWithAccount._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();
        recentTrades.forEach((trade, index) => {
            const plStr = trade.profitLoss !== undefined
                ? `P&L: ${trade.profitLoss >= 0 ? '+' : ''}$${trade.profitLoss.toFixed(2)}`
                : 'Open';
            console.log(`   ${index + 1}. ${trade.symbol} - ${trade.side.toUpperCase()} ${trade.quantity} @ $${trade.averagePrice.toFixed(2)} - ${plStr} (${trade.status})`);
        });
        console.log('\n✅ Trade seeding completed successfully!');
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
    catch (error) {
        console.error('❌ Error seeding trades:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
        await mongoose.disconnect();
        process.exit(1);
    }
};
seedTrades();
//# sourceMappingURL=seedTrades.js.map