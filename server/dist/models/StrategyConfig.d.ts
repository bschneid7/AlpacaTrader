import mongoose, { Document } from 'mongoose';
export interface IStrategyConfig extends Document {
    userId: mongoose.Types.ObjectId;
    maxPositionSize: number;
    maxConcurrentPositions: number;
    stopLossPercentage: number;
    takeProfitTarget: number;
    monthlyReturnTarget: {
        min: number;
        max: number;
    };
    enablePreMarket: boolean;
    enableAfterHours: boolean;
    marketHoursOnly: boolean;
    minStockPrice: number;
    minDailyVolume: number;
    marketCapPreferences: string[];
    sectorPreferences: string[];
    createdAt: Date;
    updatedAt: Date;
}
export declare const DEFAULT_AGGRESSIVE_STRATEGY: {
    maxPositionSize: number;
    maxConcurrentPositions: number;
    stopLossPercentage: number;
    takeProfitTarget: number;
    monthlyReturnTarget: {
        min: number;
        max: number;
    };
    enablePreMarket: boolean;
    enableAfterHours: boolean;
    marketHoursOnly: boolean;
    minStockPrice: number;
    minDailyVolume: number;
    marketCapPreferences: string[];
    sectorPreferences: string[];
};
declare const StrategyConfig: mongoose.Model<IStrategyConfig, {}, {}, {}, mongoose.Document<unknown, {}, IStrategyConfig, {}, {}> & IStrategyConfig & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default StrategyConfig;
//# sourceMappingURL=StrategyConfig.d.ts.map