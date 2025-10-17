import { IStrategyConfig } from '../models/StrategyConfig';
/**
 * Get user's strategy configuration
 */
export declare const getStrategyConfig: (userId: string) => Promise<IStrategyConfig>;
/**
 * Update user's strategy configuration
 */
export declare const updateStrategyConfig: (userId: string, updates: Partial<IStrategyConfig>) => Promise<IStrategyConfig>;
/**
 * Reset user's strategy configuration to default aggressive strategy
 */
export declare const resetStrategyToDefaults: (userId: string) => Promise<IStrategyConfig>;
/**
 * Get strategy performance metrics
 */
export declare const getStrategyPerformance: (userId: string) => Promise<{
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    averageWin: number;
    averageLoss: number;
    profitFactor: number;
    totalProfit: number;
    totalLoss: number;
    netProfit: number;
    averageTradeDuration: number;
    largestWin: number;
    largestLoss: number;
}>;
//# sourceMappingURL=strategyService.d.ts.map