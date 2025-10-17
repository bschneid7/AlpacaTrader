# Database Seeding Scripts

This directory contains scripts for database operations including seeding, testing, and maintenance.

## Available Scripts

### 1. seed.ts - Comprehensive Database Seeding

**Purpose:** Creates initial admin user and sample trading data for testing and development.

**Run:**
```bash
npm run seed
```

**What it creates:**
- ✅ Admin user with credentials
  - Email: `admin@alpacatrader.com`
  - Password: `Admin123!@#`
  - Role: Admin

- ✅ Sample Alpaca account
  - Paper trading enabled
  - Buying power: $50,000
  - Account type: Margin

- ✅ Sample positions (6 total)
  - 3 open positions (AAPL, TSLA, MSFT)
  - 3 closed positions (NVDA, GOOGL, AMZN)

- ✅ Trading preferences
  - Auto-trading disabled by default
  - Trading status: stopped

**Features:**
- Idempotent: Safe to run multiple times (won't create duplicates)
- Comprehensive logging with visual indicators
- Error handling and rollback on failure
- Creates realistic sample data for testing all app features

**Use cases:**
- Initial development setup
- After database reset
- Testing trading features
- Demonstrating the application

---

### 2. seedTradingPreferences.ts - Trading Preferences Setup

**Purpose:** Creates default trading preferences for existing users who don't have them.

**Run:**
```bash
tsx scripts/seedTradingPreferences.ts
```

**What it does:**
- Scans all users in the database
- Creates trading preferences for users without them
- Sets default values (auto-trading disabled, status: stopped)

---

### 3. testAlpaca.ts - Alpaca Integration Tests

**Purpose:** Comprehensive test suite for Alpaca API integration.

**Run:**
```bash
npm run test:alpaca
```

**Tests:**
- Account connection and authentication
- API credential encryption/decryption
- Account status retrieval
- Security features

---

### 4. testPositions.ts - Position Management Tests

**Purpose:** Tests portfolio position tracking and management.

**Run:**
```bash
npm run test:positions
```

**Tests:**
- Position retrieval from database
- Alpaca API position sync
- Position closure simulation
- Error handling

---

### 5. testAutoTrading.ts - Auto-Trading Tests

**Purpose:** Validates auto-trading toggle functionality.

**Run:**
```bash
tsx scripts/testAutoTrading.ts
```

**Tests:**
- Auto-trading enable/disable
- Trading status updates
- API endpoint functionality
- State management

---

## Quick Start Workflow

1. **First-time setup:**
   ```bash
   npm run seed
   ```

2. **Login to the application:**
   - Navigate to the login page
   - Use credentials: `admin@alpacatrader.com` / `Admin123!@#`

3. **Test the application:**
   - View sample positions on dashboard
   - Test auto-trading toggle
   - Explore analytics with historical data
   - Test risk management features

4. **Run tests (optional):**
   ```bash
   npm run test:alpaca
   npm run test:positions
   ```

---

## Database Connection

All scripts use the MongoDB connection string from `.env`:
```
MONGODB_URI=mongodb://localhost:27017/alpaca-trader
```

Make sure MongoDB is running before executing any scripts.

---

## Troubleshooting

**"Connection refused" error:**
- Ensure MongoDB is running: `sudo systemctl start mongodb`
- Check MongoDB connection string in `.env`

**"Duplicate key error":**
- The seed script is idempotent, but if you see this error, it means data already exists
- This is expected behavior and can be safely ignored

**"Encryption key not found":**
- Ensure `ENCRYPTION_KEY` is set in `.env`
- Key is required for encrypting Alpaca API credentials

---

## Notes

- All scripts include comprehensive error handling
- Logs are color-coded for easy reading
- Scripts are safe to run multiple times
- Sample data uses realistic stock symbols and prices
- All sample Alpaca credentials are fake (for testing only)

---

## Contributing

When adding new scripts:
1. Follow the existing pattern (ES modules, TypeScript)
2. Include comprehensive logging
3. Add error handling
4. Make scripts idempotent when possible
5. Update this README with usage instructions
