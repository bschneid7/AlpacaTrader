# AlpacaTrader

A full-stack stock trading application that connects to your Alpaca brokerage account to automate trading with an aggressive growth strategy targeting 8-10% monthly returns.

## Features

- 🔐 **Secure Authentication** - JWT-based user authentication
- 📊 **Real-time Portfolio Tracking** - Live portfolio value and position updates
- 🤖 **Automated Trading** - Toggle auto-trading on/off with configurable strategies
- 📈 **Performance Analytics** - Comprehensive trading metrics and performance charts
- ⚠️ **Risk Management** - Configurable risk limits and emergency controls
- 🔔 **Monitoring & Alerts** - Real-time alerts and activity logging
- ⚙️ **Strategy Configuration** - Customizable trading parameters and risk tolerance

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- shadcn/ui component library
- React Router for navigation
- Recharts for data visualization

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- Alpaca Trading API integration

## Project Structure

```
AlpacaTrader/
├── client/               # React frontend
│   ├── src/
│   │   ├── api/         # API client functions
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── types/       # TypeScript types
│   │   └── contexts/    # React contexts
│   └── dist/            # Production build
├── server/              # Express backend
│   ├── config/          # Configuration files
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   ├── jobs/            # Background jobs
│   └── dist/            # Compiled TypeScript
├── shared/              # Shared types and configs
└── docs/                # Documentation
```

## Development Setup

### Prerequisites
- Node.js 18.x or higher
- MongoDB 5.x or higher
- Alpaca brokerage account with API keys

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd AlpacaTrader
```

2. **Install dependencies**
```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
cd shared && npm install && cd ..
```

3. **Configure environment variables**
```bash
cd server
cp .env.example .env
nano .env
```

Update the following in `.env`:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secure random string for JWT signing
- `ENCRYPTION_KEY` - Secure random string for encrypting API keys

4. **Build shared module**
```bash
cd shared
npm run build
cd ..
```

5. **Start development servers**
```bash
npm run start
```

This will start:
- Frontend dev server on http://localhost:5173
- Backend server on http://localhost:3000

## Production Deployment

### Quick Deploy to DigitalOcean

See [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for step-by-step deployment instructions.

### Automated Deployment

Use the included deployment script:
```bash
./deploy.sh
```

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment guide.

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token

### Alpaca Trading Endpoints
- `POST /api/alpaca/connect` - Connect Alpaca account
- `GET /api/alpaca/account` - Get account information
- `GET /api/alpaca/portfolio` - Get portfolio data
- `GET /api/alpaca/positions` - Get current positions
- `POST /api/alpaca/auto-trading/toggle` - Toggle auto-trading
- `GET /api/alpaca/trades` - Get trade history

### Analytics Endpoints
- `GET /api/analytics/portfolio-history` - Get portfolio value history
- `GET /api/analytics/monthly-returns` - Get monthly return data
- `GET /api/analytics/performance-metrics` - Get performance metrics
- `GET /api/analytics/trade-history` - Get detailed trade history

### Strategy Endpoints
- `GET /api/strategy/config` - Get strategy configuration
- `PUT /api/strategy/config` - Update strategy configuration
- `POST /api/strategy/reset` - Reset to default strategy

### Risk Management Endpoints
- `GET /api/risk/metrics` - Get risk metrics
- `GET /api/risk/limits` - Get risk limits
- `PUT /api/risk/limits` - Update risk limits
- `POST /api/risk/emergency-stop` - Emergency stop all trading

### Monitoring Endpoints
- `GET /api/monitoring/watchlist` - Get watchlist stocks
- `GET /api/monitoring/orders` - Get active orders
- `GET /api/monitoring/activity` - Get activity log
- `GET /api/monitoring/alerts` - Get alerts

### Settings Endpoints
- `GET /api/settings` - Get user settings
- `PUT /api/settings/notifications` - Update notification preferences

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Run server tests only
cd server && npm test

# Run client tests only
cd client && npm test
```

### Test Scripts
Various test scripts are available in `server/scripts/`:
- `testAlpaca.ts` - Test Alpaca API integration
- `testPortfolio.ts` - Test portfolio service
- `testStrategy.ts` - Test strategy engine
- `testRisk.ts` - Test risk management

Run a test script:
```bash
cd server
npm run test:alpaca
```

## Database Seeding

Seed the database with sample data:
```bash
cd server
npm run seed
```

This creates:
- Admin user (admin@alpacatrader.com / Admin123!)
- Sample trading data
- Default configurations

## Environment Variables

### Server (.env)
```env
PORT=3000
NODE_ENV=development|production
MONGODB_URI=mongodb://localhost:27017/alpacatrader
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
ENCRYPTION_KEY=your-encryption-key
CORS_ORIGIN=http://localhost:5173
ALPACA_API_URL=https://paper-api.alpaca.markets
ALPACA_DATA_URL=https://data.alpaca.markets
```

## Security Considerations

- 🔒 All API keys are encrypted at rest using AES-256-GCM
- 🔑 JWT tokens with short expiration and refresh mechanism
- 🛡️ Password hashing with bcrypt
- 🚫 Rate limiting on API endpoints
- 🔐 CORS configuration for production
- 🔒 HTTPS required in production

## Important Disclaimers

⚠️ **WARNING**: This application executes live trades with real money when connected to a live Alpaca account.

- Trading stocks involves substantial risk of loss
- Past performance does not guarantee future results
- 8-10% monthly returns are a target, not a guarantee
- Losses are possible and can be significant
- You are responsible for all trading decisions and outcomes

## Trading Modes

### Paper Trading (Recommended for Testing)
- Uses Alpaca paper trading account
- No real money involved
- Perfect for testing strategies
- Set `isPaper: true` when connecting account

### Live Trading (Real Money)
- Uses real Alpaca brokerage account
- Executes trades with real money
- Requires funded brokerage account
- Set `isPaper: false` when connecting account

## Monitoring & Logs

### View Application Logs
```bash
# Development
npm run start  # logs appear in console

# Production (PM2)
pm2 logs alpacatrader-server
```

### View System Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/alpacatrader-access.log
sudo tail -f /var/log/nginx/alpacatrader-error.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongodb.log
```

## Troubleshooting

### Application won't start
- Check MongoDB is running: `sudo systemctl status mongodb`
- Check .env file exists and has correct values
- Check port 3000 is not in use: `sudo netstat -tlnp | grep 3000`
- Review logs: `pm2 logs` or console output

### Cannot connect to Alpaca
- Verify API keys are correct
- Check if using correct API URL (paper vs live)
- Ensure API keys have trading permissions
- Check Alpaca account status

### Database connection issues
- Verify MongoDB is running
- Check MONGODB_URI in .env
- Ensure database permissions are correct
- Check MongoDB logs for errors

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

This project is for educational and personal use only. Use at your own risk.

## Support

For deployment issues, see:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Comprehensive deployment guide
- [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) - Quick deployment steps

For strategy configuration, see:
- [EMA_ATR_STRATEGY_README.md](./EMA_ATR_STRATEGY_README.md)

For portfolio implementation details, see:
- [PORTFOLIO_IMPLEMENTATION.md](./PORTFOLIO_IMPLEMENTATION.md)

## Acknowledgments

- Alpaca Markets for trading API
- shadcn/ui for beautiful UI components
- MongoDB for database
- Express.js for backend framework
- React for frontend framework

---

**Built with ❤️ for algorithmic traders**

⚠️ Remember: Always test with paper trading first!
