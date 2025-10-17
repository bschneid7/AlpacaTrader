import dotenv from 'dotenv';
import { connectDB } from '../config/database';
import User from '../models/User';
import PortfolioHistory from '../models/PortfolioHistory';
dotenv.config();
async function seedPortfolioHistory() {
    try {
        console.log('🌱 Starting portfolio history seeding...\n');
        // Connect to database
        await connectDB();
        console.log('✓ Connected to database\n');
        // Find all users
        const users = await User.find();
        console.log(`Found ${users.length} users in database\n`);
        if (users.length === 0) {
            console.log('⚠ No users found. Please run seed.ts first to create users.');
            process.exit(0);
        }
        // Seed portfolio history for each user
        for (const user of users) {
            console.log(`📊 Seeding portfolio history for user: ${user.email}`);
            // Check if user already has portfolio history
            const existingCount = await PortfolioHistory.countDocuments({ userId: user._id });
            if (existingCount > 0) {
                console.log(`  ⚠ User already has ${existingCount} portfolio history records. Skipping...\n`);
                continue;
            }
            // Generate 90 days of portfolio history
            const portfolioRecords = [];
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 90);
            let currentValue = 100000; // Starting portfolio value
            let previousValue = currentValue;
            for (let i = 0; i <= 90; i++) {
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);
                date.setHours(0, 0, 0, 0); // Normalize to start of day
                // Simulate portfolio growth with some volatility
                // Target ~8% monthly growth (0.27% daily) with volatility
                const dailyReturn = (Math.random() - 0.45) * 0.015; // -0.0075 to +0.0075
                const targetGrowth = 0.0027; // 0.27% per day (~8% per month)
                currentValue = previousValue * (1 + targetGrowth + dailyReturn);
                // Add some noise to make it realistic
                const noise = (Math.random() - 0.5) * 200;
                currentValue += noise;
                // Ensure value doesn't go negative
                currentValue = Math.max(currentValue, 50000);
                const equity = currentValue * (0.95 + Math.random() * 0.05); // Equity is 95-100% of portfolio
                const cash = currentValue - equity;
                const longMarketValue = equity * (0.7 + Math.random() * 0.3); // 70-100% of equity in long positions
                const buyingPower = cash * 2; // Assuming margin account with 2x leverage
                portfolioRecords.push({
                    userId: user._id,
                    date,
                    portfolioValue: Math.round(currentValue * 100) / 100,
                    equity: Math.round(equity * 100) / 100,
                    cash: Math.round(cash * 100) / 100,
                    longMarketValue: Math.round(longMarketValue * 100) / 100,
                    shortMarketValue: 0,
                    buyingPower: Math.round(buyingPower * 100) / 100,
                });
                previousValue = currentValue;
            }
            // Insert portfolio history records
            await PortfolioHistory.insertMany(portfolioRecords);
            console.log(`  ✓ Created ${portfolioRecords.length} portfolio history records`);
            console.log(`  📈 Starting value: $${portfolioRecords[0].portfolioValue.toLocaleString()}`);
            console.log(`  📈 Ending value: $${portfolioRecords[portfolioRecords.length - 1].portfolioValue.toLocaleString()}`);
            const totalReturn = ((currentValue - 100000) / 100000) * 100;
            console.log(`  💰 Total return: ${totalReturn.toFixed(2)}%\n`);
        }
        console.log('✅ Portfolio history seeding completed successfully!');
        process.exit(0);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('❌ Error seeding portfolio history:', error.message);
            console.error(error.stack);
        }
        else {
            console.error('❌ Unknown error seeding portfolio history:', error);
        }
        process.exit(1);
    }
}
// Run the seed function
seedPortfolioHistory();
//# sourceMappingURL=seedPortfolioHistory.js.map