import AlpacaService from '../services/alpacaService';
import AlpacaAccount from '../models/AlpacaAccount';
import Position from '../models/Position';
import User from '../models/User';
import { connectDB } from '../config/database';
const testPositionsEndpoints = async () => {
    try {
        console.log('\n========================================');
        console.log('Testing Portfolio Positions Endpoints');
        console.log('========================================\n');
        // Initialize database connection
        console.log('Connecting to database...');
        await connectDB();
        console.log('✅ Database connected\n');
        // 1. Find a test user
        console.log('1. Finding test user...');
        const user = await User.findOne();
        if (!user) {
            console.error('❌ No user found. Please create a user first.');
            process.exit(1);
        }
        console.log(`✅ Found user: ${user.email} (ID: ${user._id})`);
        // 2. Check if Alpaca account is connected
        console.log('\n2. Checking Alpaca account connection...');
        const alpacaAccount = await AlpacaAccount.findOne({ userId: user._id });
        if (!alpacaAccount || !alpacaAccount.isConnected) {
            console.error('❌ No connected Alpaca account found.');
            console.log('   Please connect an Alpaca account first using the connect endpoint.');
            process.exit(1);
        }
        console.log(`✅ Alpaca account connected:`);
        console.log(`   Account Number: ${alpacaAccount.accountNumber}`);
        console.log(`   Account Type: ${alpacaAccount.accountType}`);
        console.log(`   Paper Trading: ${alpacaAccount.isPaperTrading}`);
        // 3. Test getPositions
        console.log('\n3. Testing getPositions endpoint...');
        try {
            const positions = await AlpacaService.getPositions(user._id.toString());
            console.log(`✅ Successfully fetched ${positions.length} positions from Alpaca API`);
            if (positions.length > 0) {
                console.log('\nPositions:');
                positions.forEach((position, index) => {
                    console.log(`\n   Position ${index + 1}:`);
                    console.log(`   - Symbol: ${position.symbol}`);
                    console.log(`   - Quantity: ${position.quantity}`);
                    console.log(`   - Entry Price: $${position.entryPrice.toFixed(2)}`);
                    console.log(`   - Current Price: $${position.currentPrice.toFixed(2)}`);
                    console.log(`   - Unrealized P/L: $${position.unrealizedPL.toFixed(2)} (${position.unrealizedPLPercent.toFixed(2)}%)`);
                    console.log(`   - Position Size: ${position.positionSize.toFixed(2)}%`);
                });
            }
            else {
                console.log('   No open positions found.');
            }
            // 4. Check database sync
            console.log('\n4. Checking database sync...');
            const dbPositions = await Position.find({
                userId: user._id,
                status: 'open'
            });
            console.log(`✅ Found ${dbPositions.length} open positions in database`);
            if (dbPositions.length > 0) {
                console.log('\nDatabase Positions:');
                dbPositions.forEach((position, index) => {
                    console.log(`\n   DB Position ${index + 1}:`);
                    console.log(`   - Symbol: ${position.symbol}`);
                    console.log(`   - Quantity: ${position.quantity}`);
                    console.log(`   - Status: ${position.status}`);
                    console.log(`   - Last Updated: ${position.lastUpdated}`);
                });
            }
            // 5. Test closePosition (only if positions exist)
            if (positions.length > 0) {
                console.log('\n5. Testing closePosition endpoint...');
                console.log('⚠️  Skipping actual position close to avoid modifying live data.');
                console.log('   To test closing a position, uncomment the code below:');
                console.log(`   // const result = await AlpacaService.closePosition(user._id.toString(), '${positions[0].symbol}');`);
                console.log(`   // console.log('Position closed:', result);`);
                // Uncomment to test actual position closing:
                // const testSymbol = positions[0].symbol;
                // console.log(`   Attempting to close position: ${testSymbol}`);
                // const result = await AlpacaService.closePosition(user._id.toString(), testSymbol);
                // console.log(`✅ Position closed successfully:`);
                // console.log(`   - Message: ${result.message}`);
                // console.log(`   - Order ID: ${result.orderId}`);
                // // Verify database update
                // const closedPosition = await Position.findOne({
                //   userId: user._id,
                //   symbol: testSymbol,
                //   status: 'closed'
                // });
                // if (closedPosition) {
                //   console.log(`✅ Position marked as closed in database`);
                //   console.log(`   - Closed At: ${closedPosition.closedAt}`);
                //   console.log(`   - Realized P/L: $${closedPosition.realizedPL?.toFixed(2)}`);
                // }
            }
            else {
                console.log('\n5. Skipping closePosition test (no positions to close)');
            }
        }
        catch (error) {
            console.error('❌ Error testing positions:', error);
            throw error;
        }
        console.log('\n========================================');
        console.log('✅ Position Endpoints Test Completed');
        console.log('========================================\n');
        process.exit(0);
    }
    catch (error) {
        console.error('\n❌ Test failed with error:', error);
        process.exit(1);
    }
};
// Run the test
testPositionsEndpoints();
//# sourceMappingURL=testPositions.js.map