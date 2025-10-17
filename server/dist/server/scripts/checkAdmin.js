import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from '../models/User';
import { validatePassword } from '../utils/password';
// ES module equivalents
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/alpaca-trader';
async function checkAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');
        const admin = await User.findOne({ email: 'admin@alpacatrader.com' });
        if (!admin) {
            console.log('❌ Admin user not found!');
            process.exit(1);
        }
        console.log('📋 Admin User Details:');
        console.log('   Email:', admin.email);
        console.log('   Role:', admin.role);
        console.log('   Active:', admin.isActive);
        console.log('   Created:', admin.createdAt);
        console.log('   Password hash (first 10 chars):', admin.password.substring(0, 10));
        console.log('\n🔐 Testing Password Validation:');
        const testPassword = 'Admin123!@#';
        console.log(`   Testing password: "${testPassword}"`);
        const isValid = await validatePassword(testPassword, admin.password);
        if (isValid) {
            console.log('   ✅ Password validation: PASSED');
            console.log('\n✅ Admin login should work with these credentials:');
            console.log('   Email: admin@alpacatrader.com');
            console.log('   Password: Admin123!@#');
        }
        else {
            console.log('   ❌ Password validation: FAILED');
            console.log('   The password hash may be corrupted or incorrect');
        }
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
    catch (error) {
        console.error('❌ Error:', error);
        if (error instanceof Error) {
            console.error('Details:', error.message);
            console.error('Stack:', error.stack);
        }
        process.exit(1);
    }
}
checkAdmin();
//# sourceMappingURL=checkAdmin.js.map