import axios from 'axios';
import AlpacaAccount from '../models/AlpacaAccount';
import Position from '../models/Position';
import TradingPreferences from '../models/TradingPreferences';
import Trade from '../models/Trade';
import mongoose from 'mongoose';
class AlpacaService {
    getAlpacaClient(apiKey, secretKey, isPaper = true) {
        const baseURL = isPaper
            ? 'https://paper-api.alpaca.markets'
            : 'https://api.alpaca.markets';
        return axios.create({
            baseURL,
            headers: {
                'APCA-API-KEY-ID': apiKey,
                'APCA-API-SECRET-KEY': secretKey,
            },
        });
    }
    /**
     * Verify Alpaca API credentials and get account information
     */
    async verifyCredentials(apiKey, secretKey, isPaper = true) {
        try {
            console.log('Verifying Alpaca credentials...');
            const client = this.getAlpacaClient(apiKey, secretKey, isPaper);
            const response = await client.get('/v2/account');
            console.log('Alpaca credentials verified successfully');
            return response.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Alpaca API error:', error.response?.data || error.message);
                if (error.response?.status === 401) {
                    throw new Error('Invalid Alpaca API credentials');
                }
                throw new Error(error.response?.data?.message || 'Failed to verify Alpaca credentials');
            }
            throw new Error('Failed to verify Alpaca credentials');
        }
    }
    /**
     * Connect user's Alpaca account
     */
    async connectAccount(userId, apiKey, secretKey, isPaper = true) {
        try {
            console.log(`Connecting Alpaca account for user: ${userId}`);
            // Verify credentials first
            const accountInfo = await this.verifyCredentials(apiKey, secretKey, isPaper);
            // Check if account already exists for this user
            let alpacaAccount = await AlpacaAccount.findOne({ userId: new mongoose.Types.ObjectId(userId) });
            if (alpacaAccount) {
                console.log('Updating existing Alpaca account');
                // Update existing account
                alpacaAccount.apiKey = apiKey;
                alpacaAccount.secretKey = secretKey;
                alpacaAccount.accountNumber = accountInfo.account_number;
                alpacaAccount.accountType = accountInfo.pattern_day_trader ? 'PDT' :
                    (accountInfo.multiplier === '1' ? 'Cash' : 'Margin');
                alpacaAccount.buyingPower = parseFloat(accountInfo.buying_power);
                alpacaAccount.isConnected = true;
                alpacaAccount.isPaperTrading = isPaper;
                alpacaAccount.lastSyncedAt = new Date();
                await alpacaAccount.save();
            }
            else {
                console.log('Creating new Alpaca account record');
                // Create new account
                alpacaAccount = await AlpacaAccount.create({
                    userId: new mongoose.Types.ObjectId(userId),
                    apiKey,
                    secretKey,
                    accountNumber: accountInfo.account_number,
                    accountType: accountInfo.pattern_day_trader ? 'PDT' :
                        (accountInfo.multiplier === '1' ? 'Cash' : 'Margin'),
                    buyingPower: parseFloat(accountInfo.buying_power),
                    isConnected: true,
                    isPaperTrading: isPaper,
                    autoTradingEnabled: false,
                    lastSyncedAt: new Date(),
                });
            }
            console.log('Alpaca account connected successfully');
            return alpacaAccount;
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error connecting Alpaca account:', error.message);
                throw error;
            }
            throw new Error('Failed to connect Alpaca account');
        }
    }
    /**
     * Get account overview from Alpaca API
     */
    async getAccountOverview(userId) {
        try {
            const alpacaAccount = await AlpacaAccount.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                isConnected: true
            });
            if (!alpacaAccount) {
                // Don't log this as an error - it's an expected state for new users
                throw new Error('Alpaca account not connected');
            }
            const apiKey = alpacaAccount.getDecryptedApiKey();
            const secretKey = alpacaAccount.getDecryptedSecretKey();
            const client = this.getAlpacaClient(apiKey, secretKey, alpacaAccount.isPaperTrading);
            const response = await client.get('/v2/account');
            const accountData = response.data;
            const portfolioValue = parseFloat(accountData.portfolio_value);
            const lastEquity = parseFloat(accountData.last_equity);
            const todayPL = portfolioValue - lastEquity;
            const todayPLPercent = lastEquity > 0 ? (todayPL / lastEquity) * 100 : 0;
            // Update account info in database
            alpacaAccount.buyingPower = parseFloat(accountData.buying_power);
            alpacaAccount.lastSyncedAt = new Date();
            await alpacaAccount.save();
            return {
                portfolioValue,
                todayPL,
                todayPLPercent,
                cashAvailable: parseFloat(accountData.cash),
                buyingPower: parseFloat(accountData.buying_power),
                accountNumber: accountData.account_number,
                accountType: alpacaAccount.accountType || 'Unknown',
            };
        }
        catch (error) {
            if (error instanceof Error) {
                // Only log if it's NOT the expected "account not connected" error
                if (error.message !== 'Alpaca account not connected') {
                    console.error('Error fetching account overview:', error.message);
                }
                throw error;
            }
            throw new Error('Failed to fetch account overview');
        }
    }
    /**
     * Get current positions from Alpaca API and sync with database
     */
    async getPositions(userId) {
        try {
            const alpacaAccount = await AlpacaAccount.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                isConnected: true
            });
            if (!alpacaAccount) {
                // Don't log this as an error - it's an expected state for new users
                throw new Error('Alpaca account not connected');
            }
            const apiKey = alpacaAccount.getDecryptedApiKey();
            const secretKey = alpacaAccount.getDecryptedSecretKey();
            const client = this.getAlpacaClient(apiKey, secretKey, alpacaAccount.isPaperTrading);
            const response = await client.get('/v2/positions');
            const positions = response.data;
            // Get account info to calculate position size percentage
            const accountResponse = await client.get('/v2/account');
            const portfolioValue = parseFloat(accountResponse.data.portfolio_value);
            // Sync positions with database
            await this.syncPositionsToDatabase(userId, alpacaAccount._id.toString(), positions, portfolioValue);
            return positions.map(position => {
                const marketValue = parseFloat(position.market_value);
                const positionSize = portfolioValue > 0 ? (Math.abs(marketValue) / portfolioValue) * 100 : 0;
                return {
                    symbol: position.symbol,
                    quantity: parseFloat(position.qty),
                    entryPrice: parseFloat(position.avg_entry_price),
                    currentPrice: parseFloat(position.current_price),
                    unrealizedPL: parseFloat(position.unrealized_pl),
                    unrealizedPLPercent: parseFloat(position.unrealized_plpc) * 100,
                    positionSize,
                };
            });
        }
        catch (error) {
            if (error instanceof Error) {
                // Only log if it's NOT the expected "account not connected" error
                if (error.message !== 'Alpaca account not connected') {
                    console.error('Error fetching positions:', error.message);
                }
                throw error;
            }
            throw new Error('Failed to fetch positions');
        }
    }
    /**
     * Sync positions from Alpaca to database
     */
    async syncPositionsToDatabase(userId, alpacaAccountId, alpacaPositions, portfolioValue) {
        try {
            const userObjectId = new mongoose.Types.ObjectId(userId);
            const accountObjectId = new mongoose.Types.ObjectId(alpacaAccountId);
            // Get current symbols from Alpaca
            const alpacaSymbols = alpacaPositions.map(p => p.symbol);
            // Mark positions as closed if they no longer exist in Alpaca
            await Position.updateMany({
                userId: userObjectId,
                alpacaAccountId: accountObjectId,
                status: 'open',
                symbol: { $nin: alpacaSymbols }
            }, {
                status: 'closed',
                closedAt: new Date()
            });
            // Update or create positions
            for (const alpacaPosition of alpacaPositions) {
                const positionData = {
                    userId: userObjectId,
                    alpacaAccountId: accountObjectId,
                    symbol: alpacaPosition.symbol,
                    quantity: parseFloat(alpacaPosition.qty),
                    entryPrice: parseFloat(alpacaPosition.avg_entry_price),
                    currentPrice: parseFloat(alpacaPosition.current_price),
                    marketValue: parseFloat(alpacaPosition.market_value),
                    costBasis: parseFloat(alpacaPosition.cost_basis),
                    unrealizedPL: parseFloat(alpacaPosition.unrealized_pl),
                    unrealizedPLPercent: parseFloat(alpacaPosition.unrealized_plpc) * 100,
                    side: alpacaPosition.side,
                    exchange: alpacaPosition.exchange,
                    assetId: alpacaPosition.asset_id,
                    avgEntryPrice: parseFloat(alpacaPosition.avg_entry_price),
                    status: 'open',
                    lastUpdated: new Date()
                };
                await Position.findOneAndUpdate({
                    userId: userObjectId,
                    alpacaAccountId: accountObjectId,
                    symbol: alpacaPosition.symbol,
                    status: 'open'
                }, {
                    ...positionData,
                    openedAt: new Date() // This will only be set on creation
                }, {
                    upsert: true,
                    setDefaultsOnInsert: true,
                    new: true
                });
            }
        }
        catch (error) {
            console.error('Error syncing positions to database:', error);
            // Don't throw - we still want to return the positions even if sync fails
        }
    }
    /**
     * Close a specific position
     */
    async closePosition(userId, symbol) {
        try {
            console.log(`Closing position ${symbol} for user: ${userId}`);
            const alpacaAccount = await AlpacaAccount.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                isConnected: true
            });
            if (!alpacaAccount) {
                throw new Error('Alpaca account not connected');
            }
            const apiKey = alpacaAccount.getDecryptedApiKey();
            const secretKey = alpacaAccount.getDecryptedSecretKey();
            const client = this.getAlpacaClient(apiKey, secretKey, alpacaAccount.isPaperTrading);
            // Close the position using DELETE /v2/positions/{symbol}
            const response = await client.delete(`/v2/positions/${symbol}`);
            console.log(`Position ${symbol} closed successfully via Alpaca API`);
            // Update position in database
            const position = await Position.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                symbol,
                status: 'open'
            });
            if (position) {
                position.status = 'closed';
                position.closedAt = new Date();
                position.closePrice = position.currentPrice;
                position.realizedPL = position.unrealizedPL;
                await position.save();
                console.log(`Position ${symbol} marked as closed in database`);
            }
            return {
                success: true,
                message: `Position ${symbol} closed successfully`,
                orderId: response.data?.id
            };
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                console.error(`Error closing position ${symbol}:`, error.response?.data || error.message);
                if (error.response?.status === 404) {
                    throw new Error(`Position ${symbol} not found`);
                }
                throw new Error(error.response?.data?.message || `Failed to close position ${symbol}`);
            }
            if (error instanceof Error) {
                console.error(`Error closing position ${symbol}:`, error.message);
                throw error;
            }
            throw new Error(`Failed to close position ${symbol}`);
        }
    }
    /**
     * Disconnect Alpaca account
     */
    async disconnectAccount(userId) {
        try {
            console.log(`Disconnecting Alpaca account for user: ${userId}`);
            const result = await AlpacaAccount.findOneAndDelete({
                userId: new mongoose.Types.ObjectId(userId)
            });
            if (!result) {
                // Don't log this as an error - it's an expected state when account is not connected
                throw new Error('Alpaca account not found');
            }
            console.log('Alpaca account disconnected successfully');
        }
        catch (error) {
            if (error instanceof Error) {
                // Only log if it's NOT the expected "account not found" error
                if (error.message !== 'Alpaca account not found') {
                    console.error('Error disconnecting Alpaca account:', error.message);
                }
                throw error;
            }
            throw new Error('Failed to disconnect Alpaca account');
        }
    }
    /**
     * Get Alpaca account by user ID
     */
    async getAccountByUserId(userId) {
        try {
            return await AlpacaAccount.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                isConnected: true
            });
        }
        catch (error) {
            console.error('Error fetching Alpaca account:', error);
            return null;
        }
    }
    /**
     * Toggle auto-trading status
     */
    async toggleAutoTrading(userId, enabled) {
        try {
            console.log(`Toggling auto-trading for user ${userId}: ${enabled}`);
            // Verify Alpaca account is connected
            const alpacaAccount = await AlpacaAccount.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                isConnected: true
            });
            if (!alpacaAccount) {
                console.error(`Alpaca account not found or not connected for user ${userId}`);
                throw new Error('Alpaca account not connected');
            }
            // Determine trading status based on enabled flag
            const tradingStatus = enabled ? 'active' : 'stopped';
            // Find or create trading preferences
            let tradingPrefs = await TradingPreferences.findOne({
                userId: new mongoose.Types.ObjectId(userId)
            });
            if (tradingPrefs) {
                console.log(`Updating existing trading preferences for user ${userId}`);
                tradingPrefs.autoTradingEnabled = enabled;
                tradingPrefs.tradingStatus = tradingStatus;
                tradingPrefs.lastToggleTime = new Date();
                await tradingPrefs.save();
            }
            else {
                console.log(`Creating new trading preferences for user ${userId}`);
                tradingPrefs = await TradingPreferences.create({
                    userId: new mongoose.Types.ObjectId(userId),
                    autoTradingEnabled: enabled,
                    tradingStatus,
                    lastToggleTime: new Date()
                });
            }
            console.log(`Auto-trading ${enabled ? 'enabled' : 'disabled'} successfully for user ${userId}`);
            return {
                enabled: tradingPrefs.autoTradingEnabled,
                status: tradingPrefs.tradingStatus,
                lastToggleTime: tradingPrefs.lastToggleTime
            };
        }
        catch (error) {
            if (error instanceof Error) {
                console.error('Error toggling auto-trading:', error.message, error.stack);
                throw error;
            }
            throw new Error('Failed to toggle auto-trading');
        }
    }
    /**
     * Get auto-trading status
     */
    async getAutoTradingStatus(userId) {
        try {
            // Check if Alpaca account is connected
            const alpacaAccount = await AlpacaAccount.findOne({
                userId: new mongoose.Types.ObjectId(userId),
                isConnected: true
            });
            const isAccountConnected = !!alpacaAccount;
            if (!isAccountConnected) {
                // Don't log - expected state for users without Alpaca account
                return {
                    enabled: false,
                    status: 'stopped',
                    lastToggleTime: null,
                    isAccountConnected: false
                };
            }
            // Get trading preferences
            const tradingPrefs = await TradingPreferences.findOne({
                userId: new mongoose.Types.ObjectId(userId)
            });
            if (!tradingPrefs) {
                // Don't log - expected state for new accounts
                return {
                    enabled: false,
                    status: 'stopped',
                    lastToggleTime: null,
                    isAccountConnected: true
                };
            }
            return {
                enabled: tradingPrefs.autoTradingEnabled,
                status: tradingPrefs.tradingStatus,
                lastToggleTime: tradingPrefs.lastToggleTime,
                isAccountConnected: true
            };
        }
        catch (error) {
            console.error('Error getting auto-trading status:', error);
            return {
                enabled: false,
                status: 'stopped',
                lastToggleTime: null,
                isAccountConnected: false
            };
        }
    }
    /**
     * Get recent trades (last 20 trades)
     */
    async getRecentTrades(userId) {
        try {
            console.log(`Fetching recent trades for user: ${userId}`);
            const trades = await Trade.find({
                userId: new mongoose.Types.ObjectId(userId)
            })
                .sort({ createdAt: -1 })
                .limit(20)
                .lean();
            console.log(`Found ${trades.length} recent trades for user: ${userId}`);
            return trades.map(trade => ({
                id: trade._id.toString(),
                symbol: trade.symbol,
                side: trade.side,
                quantity: trade.filledQuantity,
                price: trade.averagePrice,
                time: trade.entryTime,
                profitLoss: trade.profitLoss,
                status: trade.status
            }));
        }
        catch (error) {
            console.error('Error fetching recent trades:', error);
            throw new Error('Failed to fetch recent trades');
        }
    }
    /**
     * Get trade history with optional filtering
     */
    async getTradeHistory(userId, options = {}) {
        try {
            console.log(`Fetching trade history for user: ${userId}`, options);
            const { startDate, endDate, symbol, status, limit = 50, offset = 0 } = options;
            // Build query
            const query = {
                userId: new mongoose.Types.ObjectId(userId)
            };
            if (startDate || endDate) {
                query.entryTime = {};
                if (startDate) {
                    query.entryTime.$gte = startDate;
                }
                if (endDate) {
                    query.entryTime.$lte = endDate;
                }
            }
            if (symbol) {
                query.symbol = symbol.toUpperCase();
            }
            if (status) {
                query.status = status;
            }
            // Get total count
            const total = await Trade.countDocuments(query);
            // Get trades
            const trades = await Trade.find(query)
                .sort({ entryTime: -1 })
                .skip(offset)
                .limit(limit)
                .lean();
            console.log(`Found ${trades.length} trades (total: ${total}) for user: ${userId}`);
            const hasMore = offset + trades.length < total;
            return {
                trades: trades.map(trade => ({
                    id: trade._id.toString(),
                    symbol: trade.symbol,
                    side: trade.side,
                    quantity: trade.filledQuantity,
                    entryPrice: trade.entryPrice,
                    exitPrice: trade.exitPrice,
                    entryTime: trade.entryTime,
                    exitTime: trade.exitTime,
                    duration: trade.duration,
                    profitLoss: trade.profitLoss,
                    profitLossPercentage: trade.profitLossPercentage,
                    status: trade.status
                })),
                total,
                hasMore
            };
        }
        catch (error) {
            console.error('Error fetching trade history:', error);
            throw new Error('Failed to fetch trade history');
        }
    }
}
export default new AlpacaService();
//# sourceMappingURL=alpacaService.js.map