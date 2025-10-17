import { IAlpacaAccount } from '../models/AlpacaAccount';
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
declare class AlpacaService {
    private getAlpacaClient;
    /**
     * Verify Alpaca API credentials and get account information
     */
    verifyCredentials(apiKey: string, secretKey: string, isPaper?: boolean): Promise<AlpacaAccountInfo>;
    /**
     * Connect user's Alpaca account
     */
    connectAccount(userId: string, apiKey: string, secretKey: string, isPaper?: boolean): Promise<IAlpacaAccount>;
    /**
     * Get account overview from Alpaca API
     */
    getAccountOverview(userId: string): Promise<{
        portfolioValue: number;
        todayPL: number;
        todayPLPercent: number;
        cashAvailable: number;
        buyingPower: number;
        accountNumber: string;
        accountType: string;
    }>;
    /**
     * Get current positions from Alpaca API and sync with database
     */
    getPositions(userId: string): Promise<Array<{
        symbol: string;
        quantity: number;
        entryPrice: number;
        currentPrice: number;
        unrealizedPL: number;
        unrealizedPLPercent: number;
        positionSize: number;
    }>>;
    /**
     * Sync positions from Alpaca to database
     */
    private syncPositionsToDatabase;
    /**
     * Close a specific position
     */
    closePosition(userId: string, symbol: string): Promise<{
        success: boolean;
        message: string;
        orderId?: string;
    }>;
    /**
     * Disconnect Alpaca account
     */
    disconnectAccount(userId: string): Promise<void>;
    /**
     * Get Alpaca account by user ID
     */
    getAccountByUserId(userId: string): Promise<IAlpacaAccount | null>;
    /**
     * Toggle auto-trading status
     */
    toggleAutoTrading(userId: string, enabled: boolean): Promise<{
        enabled: boolean;
        status: 'active' | 'paused' | 'stopped';
        lastToggleTime: Date;
    }>;
    /**
     * Get auto-trading status
     */
    getAutoTradingStatus(userId: string): Promise<{
        enabled: boolean;
        status: 'active' | 'paused' | 'stopped';
        lastToggleTime: Date | null;
        isAccountConnected: boolean;
    }>;
    /**
     * Get recent trades (last 20 trades)
     */
    getRecentTrades(userId: string): Promise<Array<{
        id: string;
        symbol: string;
        side: string;
        quantity: number;
        price: number;
        time: Date;
        profitLoss?: number;
        status: string;
    }>>;
    /**
     * Get trade history with optional filtering
     */
    getTradeHistory(userId: string, options?: {
        startDate?: Date;
        endDate?: Date;
        symbol?: string;
        status?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        trades: Array<{
            id: string;
            symbol: string;
            side: string;
            quantity: number;
            entryPrice: number;
            exitPrice?: number;
            entryTime: Date;
            exitTime?: Date;
            duration?: number;
            profitLoss?: number;
            profitLossPercentage?: number;
            status: string;
        }>;
        total: number;
        hasMore: boolean;
    }>;
}
declare const _default: AlpacaService;
export default _default;
//# sourceMappingURL=alpacaService.d.ts.map