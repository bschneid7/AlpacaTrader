# Real-Time Portfolio Value & Position Tracking Implementation

## Overview
This implementation adds real-time portfolio value calculations and position tracking that syncs with the Alpaca API to provide live price updates and unrealized P&L calculations.

## Files Created

### 1. `server/services/portfolioService.ts`
Core service providing:
- **calculatePortfolioValue()** - Real-time portfolio metrics with caching (10s TTL)
- **getPositionsWithPL()** - Current positions with live prices and P&L
- **syncPositionsToDatabase()** - Sync Alpaca positions to MongoDB
- **recordPortfolioSnapshot()** - Record daily portfolio history
- **getMonthlyPerformance()** - Calculate monthly returns
- Cache management functions

### 2. `server/jobs/portfolioSyncJob.ts`
Background job that:
- Runs every 30 seconds during active trading
- Syncs positions for all users with auto-trading enabled
- Records portfolio snapshots for historical tracking
- Handles errors gracefully without stopping the sync

### 3. `server/scripts/testPortfolio.ts`
Comprehensive test script covering:
- Portfolio value calculation
- Position retrieval with P&L
- Database synchronization
- Portfolio snapshot recording
- Monthly performance calculation
- Cache functionality testing

## Files Modified

### 1. `server/routes/alpacaRoutes.ts`
Added endpoints:
- `GET /api/alpaca/portfolio` - Get real-time portfolio value
- `POST /api/alpaca/positions/sync` - Manual position sync trigger
- Updated `GET /api/alpaca/positions` - Now returns real-time data with P&L

### 2. `client/src/api/alpaca.ts`
Added/Updated functions:
- `getPortfolio()` - Fetch real-time portfolio value
- `getPositions()` - Fetch positions with real-time P&L
- `syncPositions()` - Trigger manual position sync
- `getCurrentPositions()` - Alias for backward compatibility

### 3. `server/server.ts`
- Added portfolio sync job startup alongside auto-trading job
- Job starts automatically when server boots

## API Endpoints

### GET /api/alpaca/portfolio
**Description**: Get real-time portfolio value with P&L calculations
**Auth**: Required
**Request**: `{}`
**Response**:
```json
{
  "totalValue": 125000.50,
  "equity": 125000.50,
  "cash": 25000.00,
  "buyingPower": 50000.00,
  "dayPL": 1250.00,
  "dayPLPercent": 1.01,
  "unrealizedPL": 5000.00,
  "unrealizedPLPercent": 4.17,
  "lastUpdated": "2025-01-15T10:30:00.000Z"
}
```

### GET /api/alpaca/positions
**Description**: Get current positions with real-time prices and unrealized P&L
**Auth**: Required
**Request**: `{}`
**Response**:
```json
{
  "positions": [
    {
      "symbol": "AAPL",
      "qty": 100,
      "avgEntryPrice": 150.00,
      "currentPrice": 155.50,
      "marketValue": 15550.00,
      "costBasis": 15000.00,
      "unrealizedPL": 550.00,
      "unrealizedPLPercent": 3.67,
      "side": "long",
      "exchange": "NASDAQ",
      "assetClass": "us_equity"
    }
  ]
}
```

### POST /api/alpaca/positions/sync
**Description**: Manually trigger position synchronization to database
**Auth**: Required
**Request**: `{}`
**Response**:
```json
{
  "success": true,
  "message": "Positions synced successfully"
}
```

## Key Features

### 1. Real-Time Price Updates
- Portfolio values cached for 10 seconds to reduce API calls
- Position prices fetched directly from Alpaca
- Automatic cache invalidation

### 2. Unrealized P&L Calculations
- Calculated per position: `(currentPrice - avgEntryPrice) * quantity`
- Portfolio-level unrealized P&L aggregation
- Percentage calculations included

### 3. Background Synchronization
- Automatic sync every 30 seconds for active traders
- Positions synchronized with MongoDB
- Portfolio snapshots recorded for historical analysis

### 4. Database Integration
- Positions table updated with real-time data
- Historical portfolio snapshots in PortfolioHistory
- Automatic closing of positions no longer in Alpaca

### 5. Error Handling
- Graceful failure handling in sync jobs
- Detailed error logging
- User-specific error isolation (one user's failure doesn't stop others)

## Testing

### Run Portfolio Tests
```bash
cd server
npx tsx scripts/testPortfolio.ts
```

Tests cover:
1. Portfolio value calculation
2. Position retrieval with P&L
3. Database synchronization
4. Portfolio snapshot recording
5. Monthly performance calculation
6. Cache functionality

### Prerequisites for Testing
- MongoDB connection
- At least one user with a connected Alpaca account
- Valid Alpaca API credentials (paper or live)

## Performance Considerations

### Caching Strategy
- Portfolio data cached for 10 seconds
- Reduces Alpaca API calls
- Automatic cache invalidation
- Per-user cache isolation

### Database Queries
- Indexed queries on userId and status
- Bulk updates for position sync
- Efficient snapshot upserts

### Background Job
- 30-second interval (configurable)
- Runs only for users with auto-trading enabled
- Asynchronous processing
- Error isolation per user

## Integration with Existing Components

### Dashboard Component
The dashboard already uses `getAccountOverview()` and `getCurrentPositions()`. With this implementation:
- No changes needed to dashboard components
- Real data automatically flows through existing calls
- `getCurrentPositions()` is aliased to the new `getPositions()` for backward compatibility

### Auto-Trading Job
- Portfolio sync job runs independently
- Both jobs started on server boot
- Coordinated lifecycle management

### Risk Management
- Real-time portfolio values can be used for risk calculations
- Unrealized P&L feeds into risk metrics
- Position data always current

## Configuration

### Cache TTL
```typescript
const CACHE_TTL = 10000; // 10 seconds
```

### Sync Interval
```typescript
const SYNC_INTERVAL = 30000; // 30 seconds
```

Both can be adjusted in their respective service files.

## Monitoring & Logs

All functions include comprehensive logging:
- `[PortfolioService]` - Service-level operations
- `[PortfolioSyncJob]` - Background job activities
- Detailed error traces
- User-specific operation tracking

## Future Enhancements

Potential improvements:
1. WebSocket integration for real-time updates
2. Configurable cache TTL per user
3. Position-level alerts on P&L thresholds
4. Historical position tracking
5. Performance analytics dashboard

## Dependencies

No new dependencies added. Uses existing packages:
- `@alpacahq/alpaca-trade-api` - Alpaca API client
- `mongoose` - MongoDB ODM
- Existing models and utilities

## Security Considerations

- API credentials encrypted at rest
- User-specific data isolation
- Authenticated endpoints only
- No sensitive data in logs
- Secure token validation

## Backward Compatibility

- All existing API calls continue to work
- `getCurrentPositions()` aliased for compatibility
- Dashboard components require no changes
- Gradual migration path available
