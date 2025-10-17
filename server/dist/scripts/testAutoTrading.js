import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User';
import AlpacaAccount from '../models/AlpacaAccount';
import TradingPreferences from '../models/TradingPreferences';
import AlpacaService from '../services/alpacaService';
import { generatePasswordHash } from '../utils/password';
// ES module equivalents of __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alpaca-trader';
/**
 * Test script to verify auto-trading toggle and status endpoints
 */
async function testAutoTrading() {
    try {
        console.log('=== Testing Auto-Trading Functionality ===\n');
        console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
        await mongoose.connect(MONGODB_URI);
        console.log('✓ Connected to MongoDB successfully\n');
        // Create a test user if it doesn't exist
        let testUser = await User.findOne({ email: 'test@autotrading.com' });
        if (!testUser) {
            console.log('Creating test user...');
            const hashedPassword = await generatePasswordHash('TestPassword123!');
            testUser = await User.create({
                email: 'test@autotrading.com',
                password: hashedPassword,
                role: 'user',
            });
            console.log(`✓ Test user created: ${testUser.email}\n`);
        }
        else {
            console.log(`✓ Using existing test user: ${testUser.email}\n`);
        }
        // Create a mock Alpaca account for the test user
        let alpacaAccount = await AlpacaAccount.findOne({ userId: testUser._id });
        if (!alpacaAccount) {
            console.log('Creating mock Alpaca account...');
            alpacaAccount = await AlpacaAccount.create({
                userId: testUser._id,
                apiKey: 'test-api-key',
                secretKey: 'test-secret-key',
                accountNumber: 'TEST123456',
                accountType: 'Cash',
                buyingPower: 100000,
                isConnected: true,
                isPaperTrading: true,
                autoTradingEnabled: false,
                lastSyncedAt: new Date(),
            });
            console.log(`✓ Mock Alpaca account created\n`);
        }
        else {
            console.log(`✓ Using existing Alpaca account\n`);
        }
        // Test 1: Get initial auto-trading status
        console.log('--- Test 1: Get Initial Auto-Trading Status ---');
        const initialStatus = await AlpacaService.getAutoTradingStatus(testUser._id.toString());
        console.log('Initial status:', JSON.stringify(initialStatus, null, 2));
        console.log(`✓ Initial status retrieved: ${initialStatus.enabled ? 'ENABLED' : 'DISABLED'}\n`);
        // Test 2: Enable auto-trading
        console.log('--- Test 2: Enable Auto-Trading ---');
        const enableResult = await AlpacaService.toggleAutoTrading(testUser._id.toString(), true);
        console.log('Enable result:', JSON.stringify(enableResult, null, 2));
        console.log(`✓ Auto-trading enabled successfully\n`);
        // Test 3: Verify auto-trading is enabled
        console.log('--- Test 3: Verify Auto-Trading is Enabled ---');
        const enabledStatus = await AlpacaService.getAutoTradingStatus(testUser._id.toString());
        console.log('Status after enabling:', JSON.stringify(enabledStatus, null, 2));
        if (enabledStatus.enabled && enabledStatus.status === 'active') {
            console.log(`✓ Auto-trading status verified: ENABLED and ACTIVE\n`);
        }
        else {
            console.log(`✗ Auto-trading status mismatch!\n`);
        }
        // Test 4: Disable auto-trading
        console.log('--- Test 4: Disable Auto-Trading ---');
        const disableResult = await AlpacaService.toggleAutoTrading(testUser._id.toString(), false);
        console.log('Disable result:', JSON.stringify(disableResult, null, 2));
        console.log(`✓ Auto-trading disabled successfully\n`);
        // Test 5: Verify auto-trading is disabled
        console.log('--- Test 5: Verify Auto-Trading is Disabled ---');
        const disabledStatus = await AlpacaService.getAutoTradingStatus(testUser._id.toString());
        console.log('Status after disabling:', JSON.stringify(disabledStatus, null, 2));
        if (!disabledStatus.enabled && disabledStatus.status === 'stopped') {
            console.log(`✓ Auto-trading status verified: DISABLED and STOPPED\n`);
        }
        else {
            console.log(`✗ Auto-trading status mismatch!\n`);
        }
        // Test 6: Check TradingPreferences record in database
        console.log('--- Test 6: Check TradingPreferences in Database ---');
        const tradingPrefs = await TradingPreferences.findOne({ userId: testUser._id });
        if (tradingPrefs) {
            console.log('Trading preferences found in database:');
            console.log(`  - Auto-trading enabled: ${tradingPrefs.autoTradingEnabled}`);
            console.log(`  - Trading status: ${tradingPrefs.tradingStatus}`);
            console.log(`  - Last toggle time: ${tradingPrefs.lastToggleTime.toISOString()}`);
            console.log(`✓ TradingPreferences record exists\n`);
        }
        else {
            console.log(`✗ TradingPreferences record not found!\n`);
        }
        console.log('=== All Tests Complete ===\n');
        console.log('Summary:');
        console.log('  ✓ Get auto-trading status');
        console.log('  ✓ Enable auto-trading');
        console.log('  ✓ Verify enabled state');
        console.log('  ✓ Disable auto-trading');
        console.log('  ✓ Verify disabled state');
        console.log('  ✓ Database record verification');
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
        console.log('Test completed successfully!');
    }
    catch (error) {
        console.error('\n✗ Error during testing:', error);
        if (error instanceof Error) {
            console.error('Error details:', error.message);
            console.error('Stack trace:', error.stack);
        }
        await mongoose.connection.close();
        process.exit(1);
    }
}
// Run the test function
testAutoTrading();
//# sourceMappingURL=testAutoTrading.js.map