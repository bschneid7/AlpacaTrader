import axios, { AxiosInstance } from 'axios';
import AlpacaAccount, { IAlpacaAccount } from '../models/AlpacaAccount';
import Position from '../models/Position';
import TradingPreferences from '../models/TradingPreferences';
import mongoose from 'mongoose';

interface AlpacaAccountInfo {
  id: string;
  account_number: string;
  status: string;
  crypto_status?: string;
  currency: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  created_at: string;
  shorting_enabled: boolean;
  multiplier: string;
  long_market_value: string;
  short_market_value: string;
  equity: string;
  last_equity: string;
  initial_margin: string;
  maintenance_margin: string;
  last_maintenance_margin: string;
  daytrade_count: number;
  balance_asof: string;
}

interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  avg_entry_price: string;
  qty: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

class AlpacaService {
  private getAlpacaClient(apiKey: string, secretKey: string, isPaper: boolean = true): AxiosInstance {
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
  async verifyCredentials(apiKey: string, secretKey: string, isPaper: boolean = true): Promise<AlpacaAccountInfo> {
    try {
      console.log('Verifying Alpaca credentials...');
      const client = this.getAlpacaClient(apiKey, secretKey, isPaper);
      const response = await client.get<AlpacaAccountInfo>('/v2/account');
      console.log('Alpaca credentials verified successfully');
      return response.data;
    } catch (error: unknown) {
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
  async connectAccount(
    userId: string,
    apiKey: string,
    secretKey: string,
    isPaper: boolean = true
  ): Promise<IAlpacaAccount> {
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
      } else {
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
    } catch (error: unknown) {
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
  async getAccountOverview(userId: string): Promise<{
    portfolioValue: number;
    todayPL: number;
    todayPLPercent: number;
    cashAvailable: number;
    buyingPower: number;
    accountNumber: string;
    accountType: string;
  }> {
    try {
      console.log(`Fetching account overview for user: ${userId}`);

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

      const response = await client.get<AlpacaAccountInfo>('/v2/account');
      const accountData = response.data;

      const portfolioValue = parseFloat(accountData.portfolio_value);
      const lastEquity = parseFloat(accountData.last_equity);
      const todayPL = portfolioValue - lastEquity;
      const todayPLPercent = lastEquity > 0 ? (todayPL / lastEquity) * 100 : 0;

      // Update account info in database
      alpacaAccount.buyingPower = parseFloat(accountData.buying_power);
      alpacaAccount.lastSyncedAt = new Date();
      await alpacaAccount.save();

      console.log('Account overview fetched successfully');

      return {
        portfolioValue,
        todayPL,
        todayPLPercent,
        cashAvailable: parseFloat(accountData.cash),
        buyingPower: parseFloat(accountData.buying_power),
        accountNumber: accountData.account_number,
        accountType: alpacaAccount.accountType || 'Unknown',
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching account overview:', error.message);
        throw error;
      }
      throw new Error('Failed to fetch account overview');
    }
  }

  /**
   * Get current positions from Alpaca API and sync with database
   */
  async getPositions(userId: string): Promise<Array<{
    symbol: string;
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
    positionSize: number;
  }>> {
    try {
      console.log(`Fetching positions for user: ${userId}`);

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

      const response = await client.get<AlpacaPosition[]>('/v2/positions');
      const positions = response.data;

      // Get account info to calculate position size percentage
      const accountResponse = await client.get<AlpacaAccountInfo>('/v2/account');
      const portfolioValue = parseFloat(accountResponse.data.portfolio_value);

      console.log(`Found ${positions.length} positions from Alpaca API`);

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
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching positions:', error.message);
        throw error;
      }
      throw new Error('Failed to fetch positions');
    }
  }

  /**
   * Sync positions from Alpaca to database
   */
  private async syncPositionsToDatabase(
    userId: string,
    alpacaAccountId: string,
    alpacaPositions: AlpacaPosition[],
    portfolioValue: number
  ): Promise<void> {
    try {
      console.log(`Syncing ${alpacaPositions.length} positions to database`);

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const accountObjectId = new mongoose.Types.ObjectId(alpacaAccountId);

      // Get current symbols from Alpaca
      const alpacaSymbols = alpacaPositions.map(p => p.symbol);

      // Mark positions as closed if they no longer exist in Alpaca
      await Position.updateMany(
        {
          userId: userObjectId,
          alpacaAccountId: accountObjectId,
          status: 'open',
          symbol: { $nin: alpacaSymbols }
        },
        {
          status: 'closed',
          closedAt: new Date()
        }
      );

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
          side: alpacaPosition.side as 'long' | 'short',
          exchange: alpacaPosition.exchange,
          assetId: alpacaPosition.asset_id,
          avgEntryPrice: parseFloat(alpacaPosition.avg_entry_price),
          status: 'open' as const,
          lastUpdated: new Date()
        };

        await Position.findOneAndUpdate(
          {
            userId: userObjectId,
            alpacaAccountId: accountObjectId,
            symbol: alpacaPosition.symbol,
            status: 'open'
          },
          {
            ...positionData,
            openedAt: new Date() // This will only be set on creation
          },
          {
            upsert: true,
            setDefaultsOnInsert: true,
            new: true
          }
        );
      }

      console.log('Positions synced to database successfully');
    } catch (error: unknown) {
      console.error('Error syncing positions to database:', error);
      // Don't throw - we still want to return the positions even if sync fails
    }
  }

  /**
   * Close a specific position
   */
  async closePosition(userId: string, symbol: string): Promise<{
    success: boolean;
    message: string;
    orderId?: string;
  }> {
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
    } catch (error: unknown) {
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
  async disconnectAccount(userId: string): Promise<void> {
    try {
      console.log(`Disconnecting Alpaca account for user: ${userId}`);

      const result = await AlpacaAccount.findOneAndDelete({
        userId: new mongoose.Types.ObjectId(userId)
      });

      if (!result) {
        throw new Error('Alpaca account not found');
      }

      console.log('Alpaca account disconnected successfully');
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error disconnecting Alpaca account:', error.message);
        throw error;
      }
      throw new Error('Failed to disconnect Alpaca account');
    }
  }

  /**
   * Get Alpaca account by user ID
   */
  async getAccountByUserId(userId: string): Promise<IAlpacaAccount | null> {
    try {
      return await AlpacaAccount.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        isConnected: true
      });
    } catch (error: unknown) {
      console.error('Error fetching Alpaca account:', error);
      return null;
    }
  }

  /**
   * Toggle auto-trading status
   */
  async toggleAutoTrading(userId: string, enabled: boolean): Promise<{
    enabled: boolean;
    status: 'active' | 'paused' | 'stopped';
    lastToggleTime: Date;
  }> {
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
      } else {
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
    } catch (error: unknown) {
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
  async getAutoTradingStatus(userId: string): Promise<{
    enabled: boolean;
    status: 'active' | 'paused' | 'stopped';
    lastToggleTime: Date | null;
    isAccountConnected: boolean;
  }> {
    try {
      console.log(`Fetching auto-trading status for user ${userId}`);

      // Check if Alpaca account is connected
      const alpacaAccount = await AlpacaAccount.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        isConnected: true
      });

      const isAccountConnected = !!alpacaAccount;

      if (!isAccountConnected) {
        console.log(`Alpaca account not connected for user ${userId}`);
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
        console.log(`No trading preferences found for user ${userId}, returning defaults`);
        return {
          enabled: false,
          status: 'stopped',
          lastToggleTime: null,
          isAccountConnected: true
        };
      }

      console.log(`Auto-trading status retrieved successfully for user ${userId}`);

      return {
        enabled: tradingPrefs.autoTradingEnabled,
        status: tradingPrefs.tradingStatus,
        lastToggleTime: tradingPrefs.lastToggleTime,
        isAccountConnected: true
      };
    } catch (error: unknown) {
      console.error('Error getting auto-trading status:', error);
      return {
        enabled: false,
        status: 'stopped',
        lastToggleTime: null,
        isAccountConnected: false
      };
    }
  }
}

export default new AlpacaService();
