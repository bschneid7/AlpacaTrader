# EMA/ATR Bracket Order Strategy Implementation

## Overview

This implementation adds a production-ready **Daily Trend + ATR Bracket Strategy** to the AlpacaTrader application. The strategy uses EMA crossovers for entry signals and ATR-based brackets for risk management.

## Strategy Logic

### Entry Signal (Buy)
- **EMA Crossover**: EMA(20) crosses above EMA(50)
- **Trend Confirmation**: Fast EMA must be rising
- **Entry Type**: Market order with bracket (TP/SL)

### Exit Management
- **Stop Loss**: Entry Price - (ATR × 1.5) → Limits downside risk
- **Take Profit**: Entry Price + (ATR × 3.0) → Risk/Reward ≥ 2:1
- **Server-Side Brackets**: Orders persist even if bot goes offline

### Position Sizing
- **Risk-Based**: Targets 0.5% equity risk per trade
- **Formula**: `Quantity = (Equity × RiskPct) / (Entry - StopLoss)`
- **Portfolio Limit**: Maximum 2% total equity at risk

## Files Implemented

### Backend Services
1. **`server/services/strategyEngine.ts`**
   - Core EMA/ATR calculation logic
   - Signal generation
   - Position sizing based on volatility
   - Fetches daily bars from Alpaca API

2. **`server/services/bracketOrderService.ts`**
   - Submits bracket orders to Alpaca
   - Order status monitoring
   - Position synchronization

### Models
3. **`server/models/StrategySignal.ts`**
   - Stores generated buy/sell signals
   - Tracks execution status
   - Auto-expires after 90 days

4. **`server/models/StrategyConfig.ts` (Enhanced)**
   - Added EMA/ATR parameters
   - Trading universe configuration
   - Risk management settings

### API Routes
5. **`server/routes/strategyEngineRoutes.ts`**
   - `POST /api/strategy-engine/analyze` - Run analysis manually
   - `GET /api/strategy-engine/signals/unexecuted` - Get pending signals
   - `GET /api/strategy-engine/signals/recent` - View signal history
   - `POST /api/strategy-engine/bracket-order` - Submit bracket order
   - `GET /api/strategy-engine/order/:orderId` - Check order status
   - `DELETE /api/strategy-engine/order/:orderId` - Cancel order

### Scripts
6. **`server/scripts/testStrategyEngine.ts`**
   - Comprehensive testing script
   - Validates EMA/ATR calculations
   - Tests signal generation

7. **`server/scripts/runDailyStrategy.ts`**
   - Manual daily execution
   - Processes all users with auto-trading enabled
   - Suitable for cron scheduling

### Frontend
8. **`client/src/types/strategy.ts` (Enhanced)**
   - Added EMA/ATR parameter types
   - StrategySignal interface

9. **`client/src/api/strategy.ts` (Enhanced)**
   - Added strategy engine API calls
   - Signal retrieval functions

## Default Configuration

```javascript
{
  emaFastPeriod: 20,           // Fast EMA lookback
  emaSlowPeriod: 50,           // Slow EMA lookback
  atrPeriod: 14,               // ATR calculation period
  atrStopMultiplier: 1.5,      // Stop loss distance (ATR × 1.5)
  atrTakeProfitMultiplier: 3.0,// Take profit distance (ATR × 3.0)
  riskPerTrade: 0.5,           // Risk 0.5% equity per trade
  maxPortfolioRisk: 2.0,       // Max 2% total portfolio risk
  tradingUniverse: [
    'SPY', 'QQQ', 'IWM',       // Index ETFs
    'AAPL', 'MSFT', 'NVDA'     // Mega-cap stocks
  ]
}
```

## Usage

### 1. Manual Analysis
```bash
# Test the strategy engine
cd server
npx ts-node scripts/testStrategyEngine.ts
```

### 2. Manual Execution
```bash
# Run daily strategy for all users
cd server
npx ts-node scripts/runDailyStrategy.ts
```

### 3. Automatic (Background Job)
The strategy automatically runs when:
- Auto-trading is enabled for a user
- User has a valid Alpaca account connected
- `tradingUniverse` is configured in StrategyConfig

The trading engine checks the strategy type and automatically uses EMA/ATR when configured.

### 4. API Usage

**Run Analysis:**
```bash
curl -X POST https://preview-08mpfy5v.ui.pythagora.ai/api/strategy-engine/analyze \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Signals:**
```bash
curl https://preview-08mpfy5v.ui.pythagora.ai/api/strategy-engine/signals/recent \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Testing Steps

1. **Connect Alpaca Account**
   - Go to Settings
   - Enter Paper Trading API credentials
   - Verify connection

2. **Configure Strategy**
   - Go to Strategy page
   - Set trading universe (symbols to trade)
   - Adjust EMA/ATR parameters if needed
   - Save configuration

3. **Run Test**
   ```bash
   cd server
   npx ts-node scripts/testStrategyEngine.ts
   ```

4. **Review Signals**
   - Check terminal output for buy signals
   - Signals are saved to database (StrategySignal collection)

5. **Enable Auto-Trading**
   - Toggle auto-trading ON from Dashboard
   - Background job will execute strategy automatically

## Risk Controls & Safety

### Built-in Safeguards
- ✅ **Paper trading by default** (use `isPaper: true`)
- ✅ **Bracket orders on every trade** (TP/SL enforced)
- ✅ **Per-trade risk limit** (default: 0.5% equity)
- ✅ **Portfolio risk limit** (default: 2.0% total)
- ✅ **Liquid symbols only** (index ETFs + mega-caps)
- ✅ **Daily bars** (end-of-day, reduces noise)
- ✅ **Activity logging** (all actions tracked)

### PDT Compliance
- Strategy operates on daily bars (not intraday)
- Reduces trade frequency
- Helps avoid Pattern Day Trader restrictions

### Market Data
- **IEX Feed**: Free tier, suitable for daily bars
- **Alternative**: Upgrade to SIP for full market data

## Monitoring

### Activity Logs
All strategy actions are logged:
- Signal generation
- Order submissions
- Order fills/failures
- Risk limit breaches

View logs in the Monitoring page.

### Alerts
Automatic alerts for:
- Orders submitted
- Orders filled
- Stop losses hit
- Take profits hit
- Errors and failures

## Customization

### Adjust Parameters
Edit `StrategyConfig` for a user:
```javascript
{
  emaFastPeriod: 10,          // More responsive (faster signals)
  emaSlowPeriod: 30,          // Shorter trend confirmation
  atrStopMultiplier: 2.0,     // Wider stops (less whipsaw)
  atrTakeProfitMultiplier: 4.0, // Larger targets
  riskPerTrade: 1.0,          // Risk 1% per trade (more aggressive)
  tradingUniverse: ['SPY', 'QQQ'] // Focus on ETFs only
}
```

### Add More Symbols
```javascript
tradingUniverse: [
  'SPY', 'QQQ', 'IWM',     // ETFs
  'AAPL', 'MSFT', 'GOOGL', // Tech
  'JPM', 'BAC',            // Finance
  'JNJ', 'PFE'             // Healthcare
]
```

## Performance Expectations

### Strategy Characteristics
- **Win Rate**: 40-60% (trend following typical)
- **Risk/Reward**: ~2:1 (TP is 2× SL distance)
- **Trade Frequency**: Variable (depends on market conditions)
- **Volatility**: Adapts to market (ATR-based sizing)

### Not Guaranteed
- 8-10% monthly returns are a **target**, not a guarantee
- Losing months are possible
- Market conditions affect performance
- Past performance ≠ future results

## Troubleshooting

### No Signals Generated
- Check if symbols have sufficient price history (>60 bars)
- Verify EMA crossover has occurred recently
- Review console logs for specific symbol errors

### Orders Not Submitted
- Verify Alpaca API credentials are valid
- Check if risk limits are reached
- Ensure sufficient buying power
- Review activity logs for error messages

### Strategy Not Running
- Confirm auto-trading is enabled
- Check that `tradingUniverse` is set in StrategyConfig
- Verify Alpaca account is connected
- Review background job logs

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/strategy-engine/analyze` | POST | Run strategy analysis |
| `/api/strategy-engine/signals/unexecuted` | GET | Get pending signals |
| `/api/strategy-engine/signals/recent` | GET | View signal history |
| `/api/strategy-engine/bracket-order` | POST | Submit bracket order |
| `/api/strategy-engine/order/:orderId` | GET | Check order status |
| `/api/strategy-engine/order/:orderId` | DELETE | Cancel order |

## Database Collections

- **StrategySignal**: Generated buy/sell signals
- **StrategyConfig**: User strategy configuration
- **Order**: Submitted orders (includes bracket legs)
- **Position**: Open positions
- **ActivityLog**: All strategy actions
- **Alert**: User notifications

## Next Steps

1. **Backtest**: Validate strategy on historical data
2. **Paper Trade**: Run for 2-4 weeks in paper mode
3. **Monitor**: Review signal quality and execution
4. **Tune**: Adjust parameters based on results
5. **Go Live**: Switch to live trading when confident

## Disclaimer

This strategy is for educational and informational purposes only. It is not investment advice. Trading involves substantial risk of loss. You are responsible for all trading decisions and outcomes.
