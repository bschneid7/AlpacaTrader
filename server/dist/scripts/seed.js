import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User';
import AlpacaAccount from '../models/AlpacaAccount';
import Position from '../models/Position';
import TradingPreferences from '../models/TradingPreferences';
import { generatePasswordHash } from '../utils/password';
import { ROLES } from 'shared';
// ES module equivalents of __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alpaca-trader';
// Admin user credentials
const ADMIN_EMAIL = 'admin@alpacatrader.com';
const ADMIN_PASSWORD = 'Admin123!@#';
// Sample Alpaca credentials (these are fake for testing)
const SAMPLE_ALPACA_API_KEY = 'PK_TEST_SAMPLE_KEY_12345';
const SAMPLE_ALPACA_SECRET_KEY = 'SK_TEST_SAMPLE_SECRET_67890';
/**
 * Comprehensive database seeding script
 * Creates:
 * - Admin user
 * - Sample Alpaca account
 * - Sample positions (open and closed)
 * - Trading preferences
 */
async function seed() {
    try {
        console.log('╔═══════════════════════════════════════════════════════╗');
        console.log('║     AlpacaTrader Database Seeding Script             ║');
        console.log('╚═══════════════════════════════════════════════════════╝\n');
        console.log(`📡 Connecting to MongoDB: ${MONGODB_URI}`);
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully\n');
        // ==========================================
        // Step 1: Create Admin User
        // ==========================================
        console.log('👤 Creating Admin User...');
        let adminUser = await User.findOne({ email: ADMIN_EMAIL });
        if (adminUser) {
            console.log(`⚠️  Admin user already exists: ${ADMIN_EMAIL}`);
        }
        else {
            const hashedPassword = await generatePasswordHash(ADMIN_PASSWORD);
            adminUser = await User.create({
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: ROLES.ADMIN,
                isActive: true,
                lastLoginAt: new Date(),
            });
            console.log(`✅ Admin user created successfully: ${ADMIN_EMAIL}`);
            console.log(`   Password: ${ADMIN_PASSWORD}`);
        }
        console.log('');
        // ==========================================
        // Step 2: Create Sample Alpaca Account
        // ==========================================
        console.log('🔑 Creating Sample Alpaca Account...');
        let alpacaAccount = await AlpacaAccount.findOne({ userId: adminUser._id });
        if (alpacaAccount) {
            console.log('⚠️  Alpaca account already exists for admin user');
        }
        else {
            alpacaAccount = await AlpacaAccount.create({
                userId: adminUser._id,
                apiKey: SAMPLE_ALPACA_API_KEY,
                secretKey: SAMPLE_ALPACA_SECRET_KEY,
                accountNumber: 'ACC123456789',
                accountType: 'Margin',
                buyingPower: 50000.00,
                isConnected: true,
                isPaperTrading: true,
                autoTradingEnabled: false,
                lastSyncedAt: new Date(),
            });
            console.log('✅ Sample Alpaca account created successfully');
            console.log(`   Account Number: ACC123456789`);
            console.log(`   Account Type: Margin`);
            console.log(`   Buying Power: $50,000.00`);
        }
        console.log('');
        // ==========================================
        // Step 3: Create Sample Positions
        // ==========================================
        console.log('📊 Creating Sample Positions...');
        const existingPositions = await Position.find({ userId: adminUser._id });
        if (existingPositions.length > 0) {
            console.log(`⚠️  Found ${existingPositions.length} existing positions for admin user`);
        }
        else {
            // Sample open positions
            const openPositions = [
                {
                    userId: adminUser._id,
                    alpacaAccountId: alpacaAccount._id,
                    symbol: 'AAPL',
                    quantity: 50,
                    entryPrice: 175.50,
                    currentPrice: 182.30,
                    marketValue: 9115.00,
                    costBasis: 8775.00,
                    unrealizedPL: 340.00,
                    unrealizedPLPercent: 3.87,
                    side: 'long',
                    exchange: 'NASDAQ',
                    assetId: 'asset-aapl-123',
                    avgEntryPrice: 175.50,
                    status: 'open',
                    openedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
                },
                {
                    userId: adminUser._id,
                    alpacaAccountId: alpacaAccount._id,
                    symbol: 'TSLA',
                    quantity: 25,
                    entryPrice: 245.80,
                    currentPrice: 238.50,
                    marketValue: 5962.50,
                    costBasis: 6145.00,
                    unrealizedPL: -182.50,
                    unrealizedPLPercent: -2.97,
                    side: 'long',
                    exchange: 'NASDAQ',
                    assetId: 'asset-tsla-456',
                    avgEntryPrice: 245.80,
                    status: 'open',
                    openedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                },
                {
                    userId: adminUser._id,
                    alpacaAccountId: alpacaAccount._id,
                    symbol: 'MSFT',
                    quantity: 30,
                    entryPrice: 380.25,
                    currentPrice: 395.10,
                    marketValue: 11853.00,
                    costBasis: 11407.50,
                    unrealizedPL: 445.50,
                    unrealizedPLPercent: 3.91,
                    side: 'long',
                    exchange: 'NASDAQ',
                    assetId: 'asset-msft-789',
                    avgEntryPrice: 380.25,
                    status: 'open',
                    openedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                },
            ];
            // Sample closed positions (historical trades)
            const closedPositions = [
                {
                    userId: adminUser._id,
                    alpacaAccountId: alpacaAccount._id,
                    symbol: 'NVDA',
                    quantity: 20,
                    entryPrice: 450.00,
                    currentPrice: 475.50,
                    marketValue: 9510.00,
                    costBasis: 9000.00,
                    unrealizedPL: 0,
                    unrealizedPLPercent: 0,
                    side: 'long',
                    exchange: 'NASDAQ',
                    assetId: 'asset-nvda-101',
                    avgEntryPrice: 450.00,
                    status: 'closed',
                    openedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
                    closedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
                    closePrice: 475.50,
                    realizedPL: 510.00,
                },
                {
                    userId: adminUser._id,
                    alpacaAccountId: alpacaAccount._id,
                    symbol: 'GOOGL',
                    quantity: 15,
                    entryPrice: 140.20,
                    currentPrice: 138.75,
                    marketValue: 2081.25,
                    costBasis: 2103.00,
                    unrealizedPL: 0,
                    unrealizedPLPercent: 0,
                    side: 'long',
                    exchange: 'NASDAQ',
                    assetId: 'asset-googl-202',
                    avgEntryPrice: 140.20,
                    status: 'closed',
                    openedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
                    closedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), // 16 days ago
                    closePrice: 138.75,
                    realizedPL: -21.75,
                },
                {
                    userId: adminUser._id,
                    alpacaAccountId: alpacaAccount._id,
                    symbol: 'AMZN',
                    quantity: 40,
                    entryPrice: 155.30,
                    currentPrice: 162.80,
                    marketValue: 6512.00,
                    costBasis: 6212.00,
                    unrealizedPL: 0,
                    unrealizedPLPercent: 0,
                    side: 'long',
                    exchange: 'NASDAQ',
                    assetId: 'asset-amzn-303',
                    avgEntryPrice: 155.30,
                    status: 'closed',
                    openedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
                    closedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
                    closePrice: 162.80,
                    realizedPL: 300.00,
                },
            ];
            // Insert all positions
            const allPositions = [...openPositions, ...closedPositions];
            await Position.insertMany(allPositions);
            console.log(`✅ Created ${openPositions.length} open positions`);
            console.log(`   - AAPL: 50 shares @ $175.50 (Current: $182.30, P&L: +$340.00)`);
            console.log(`   - TSLA: 25 shares @ $245.80 (Current: $238.50, P&L: -$182.50)`);
            console.log(`   - MSFT: 30 shares @ $380.25 (Current: $395.10, P&L: +$445.50)`);
            console.log(`✅ Created ${closedPositions.length} closed positions (historical trades)`);
            console.log(`   - NVDA: Closed with P&L: +$510.00`);
            console.log(`   - GOOGL: Closed with P&L: -$21.75`);
            console.log(`   - AMZN: Closed with P&L: +$300.00`);
        }
        console.log('');
        // ==========================================
        // Step 4: Create Trading Preferences
        // ==========================================
        console.log('⚙️  Creating Trading Preferences...');
        let tradingPreferences = await TradingPreferences.findOne({ userId: adminUser._id });
        if (tradingPreferences) {
            console.log('⚠️  Trading preferences already exist for admin user');
        }
        else {
            tradingPreferences = await TradingPreferences.create({
                userId: adminUser._id,
                autoTradingEnabled: false,
                tradingStatus: 'stopped',
                lastToggleTime: new Date(),
            });
            console.log('✅ Trading preferences created successfully');
            console.log(`   Auto Trading: Disabled`);
            console.log(`   Trading Status: Stopped`);
        }
        console.log('');
        // ==========================================
        // Summary
        // ==========================================
        console.log('╔═══════════════════════════════════════════════════════╗');
        console.log('║              Seeding Completed Successfully           ║');
        console.log('╚═══════════════════════════════════════════════════════╝\n');
        console.log('📋 Summary:');
        console.log('   ✅ Admin user ready');
        console.log('   ✅ Alpaca account configured');
        console.log('   ✅ Sample positions created (3 open, 3 closed)');
        console.log('   ✅ Trading preferences initialized\n');
        console.log('🔐 Login Credentials:');
        console.log(`   Email: ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}\n`);
        console.log('💡 You can now:');
        console.log('   1. Login to the application with the admin credentials');
        console.log('   2. View sample positions on the dashboard');
        console.log('   3. Test trading functionality with paper trading enabled');
        console.log('   4. Explore analytics with historical trade data\n');
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        console.log('');
    }
    catch (error) {
        console.error('❌ Error seeding database:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    }
}
// Run the seed function
seed();
//# sourceMappingURL=seed.js.map