import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import User from '../models/User';
import * as strategyService from '../services/strategyService';
dotenv.config();
/**
 * Test script for strategy configuration functionality
 */
async function testStrategyFunctionality() {
    console.log('=== Strategy Configuration Test Script ===\n');
    try {
        // Connect to database
        console.log('[1/6] Connecting to database...');
        await connectDB();
        console.log('✓ Database connected successfully\n');
        // Find or create test user
        console.log('[2/6] Finding test user...');
        const testUser = await User.findOne({});
        if (!testUser) {
            console.log('No users found. Please run the main seed script first.');
            process.exit(1);
        }
        console.log(`✓ Found test user: ${testUser.email}\n`);
        // Test 1: Get strategy config (should create if doesn't exist)
        console.log('[3/6] Testing: Get strategy configuration...');
        const config = await strategyService.getStrategyConfig(testUser._id.toString());
        console.log('✓ Successfully retrieved strategy config:');
        console.log(`  - Max Position Size: ${config.maxPositionSize}%`);
        console.log(`  - Max Concurrent Positions: ${config.maxConcurrentPositions}`);
        console.log(`  - Stop Loss: ${config.stopLossPercentage}%`);
        console.log(`  - Take Profit: ${config.takeProfitTarget}%`);
        console.log(`  - Monthly Target: ${config.monthlyReturnTarget.min}-${config.monthlyReturnTarget.max}%\n`);
        // Test 2: Update strategy config
        console.log('[4/6] Testing: Update strategy configuration...');
        const updates = {
            maxPositionSize: 20,
            maxConcurrentPositions: 10,
            stopLossPercentage: 7,
            takeProfitTarget: 15,
            minStockPrice: 15,
            sectorPreferences: ['technology', 'healthcare'],
        };
        const updatedConfig = await strategyService.updateStrategyConfig(testUser._id.toString(), updates);
        console.log('✓ Successfully updated strategy config:');
        console.log(`  - Max Position Size: ${updatedConfig.maxPositionSize}% (was ${config.maxPositionSize}%)`);
        console.log(`  - Max Concurrent Positions: ${updatedConfig.maxConcurrentPositions} (was ${config.maxConcurrentPositions})`);
        console.log(`  - Stop Loss: ${updatedConfig.stopLossPercentage}% (was ${config.stopLossPercentage}%)`);
        console.log(`  - Take Profit: ${updatedConfig.takeProfitTarget}% (was ${config.takeProfitTarget}%)`);
        console.log(`  - Min Stock Price: $${updatedConfig.minStockPrice} (was $${config.minStockPrice})`);
        console.log(`  - Sectors: ${updatedConfig.sectorPreferences.join(', ')}\n`);
        // Test 3: Test validation (should fail)
        console.log('[5/6] Testing: Validation (should fail for invalid values)...');
        try {
            await strategyService.updateStrategyConfig(testUser._id.toString(), {
                maxPositionSize: 50, // Invalid: exceeds max of 25
            });
            console.log('❌ Validation test failed - invalid value was accepted\n');
        }
        catch (error) {
            console.log(`✓ Validation working correctly: ${error.message}\n`);
        }
        // Test 4: Reset to defaults
        console.log('[6/6] Testing: Reset to default configuration...');
        const resetConfig = await strategyService.resetStrategyToDefaults(testUser._id.toString());
        console.log('✓ Successfully reset strategy config to defaults:');
        console.log(`  - Max Position Size: ${resetConfig.maxPositionSize}%`);
        console.log(`  - Max Concurrent Positions: ${resetConfig.maxConcurrentPositions}`);
        console.log(`  - Stop Loss: ${resetConfig.stopLossPercentage}%`);
        console.log(`  - Take Profit: ${resetConfig.takeProfitTarget}%`);
        console.log(`  - Monthly Target: ${resetConfig.monthlyReturnTarget.min}-${resetConfig.monthlyReturnTarget.max}%`);
        console.log(`  - Market Caps: ${resetConfig.marketCapPreferences.join(', ')}`);
        console.log(`  - Sectors: ${resetConfig.sectorPreferences.join(', ')}\n`);
        // Test 5: Get strategy performance
        console.log('[BONUS] Testing: Get strategy performance...');
        const performance = await strategyService.getStrategyPerformance(testUser._id.toString());
        console.log('✓ Successfully calculated strategy performance:');
        console.log(`  - Total Trades: ${performance.totalTrades}`);
        console.log(`  - Winning Trades: ${performance.winningTrades}`);
        console.log(`  - Losing Trades: ${performance.losingTrades}`);
        console.log(`  - Win Rate: ${performance.winRate.toFixed(2)}%`);
        console.log(`  - Average Win: $${performance.averageWin}`);
        console.log(`  - Average Loss: $${performance.averageLoss}`);
        console.log(`  - Profit Factor: ${performance.profitFactor}`);
        console.log(`  - Net Profit: $${performance.netProfit}`);
        console.log('\n=== All tests completed successfully! ===');
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Test error:', error);
        console.error(error.stack);
        process.exit(1);
    }
}
// Run the test function
testStrategyFunctionality();
//# sourceMappingURL=testStrategy.js.map