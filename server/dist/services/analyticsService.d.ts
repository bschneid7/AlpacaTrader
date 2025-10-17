declare class AnalyticsService {
    /**
     * Get portfolio history for a given timeframe
     */
    getPortfolioHistory(userId: string, timeframe?: string): Promise<Array<{
        date: string;
        value: number;
    }>>;
    /**
     * Calculate monthly returns from trade data and portfolio history
     */
    getMonthlyReturns(userId: string): Promise<Array<{
        month: string;
        return: number;
    }>>;
    /**
     * Calculate comprehensive performance metrics
     */
    getPerformanceMetrics(userId: string): Promise<{
        totalReturn: number;
        totalReturnPercent: number;
        bestTrade: {
            symbol: string;
            pl: number;
            plPercent: number;
        };
        worstTrade: {
            symbol: string;
            pl: number;
            plPercent: number;
        };
        avgWin: number;
        avgLoss: number;
        sharpeRatio: number;
        maxDrawdown: number;
    }>;
    /**
     * Get trade history with formatted data
     */
    getTradeHistory(userId: string): Promise<Array<{
        date: string;
        symbol: string;
        entryPrice: number;
        exitPrice: number;
        quantity: number;
        duration: string;
        pl: number;
        plPercent: number;
    }>>;
    /**
     * Calculate Sharpe Ratio
     * Sharpe Ratio = (Average Return - Risk-Free Rate) / Standard Deviation of Returns
     */
    private calculateSharpeRatio;
    /**
     * Calculate Maximum Drawdown
     * Maximum Drawdown = (Trough Value - Peak Value) / Peak Value
     */
    private calculateMaxDrawdown;
    /**
     * Record daily portfolio snapshot
     * This should be called daily (or can be called manually)
     */
    recordPortfolioSnapshot(userId: string, portfolioData: {
        portfolioValue: number;
        equity: number;
        cash: number;
        longMarketValue?: number;
        shortMarketValue?: number;
        buyingPower?: number;
    }): Promise<void>;
}
declare const _default: AnalyticsService;
export default _default;
//# sourceMappingURL=analyticsService.d.ts.map