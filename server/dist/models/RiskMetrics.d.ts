import mongoose, { Document } from 'mongoose';
export interface ISectorConcentration {
    sector: string;
    value: number;
    percentage: number;
}
export interface IPositionConcentration {
    symbol: string;
    value: number;
    percentage: number;
}
export interface IRiskMetrics extends Document {
    userId: mongoose.Types.ObjectId;
    currentRiskExposure: number;
    portfolioValue: number;
    cashAvailable: number;
    dailyPnL: number;
    dailyPnLPercentage: number;
    peakPortfolioValue: number;
    currentDrawdown: number;
    maxDrawdown: number;
    sectorConcentration: ISectorConcentration[];
    positionConcentration: IPositionConcentration[];
    correlationMatrix: Record<string, Record<string, number>>;
    volatilityIndex: number;
    calculatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const RiskMetrics: mongoose.Model<IRiskMetrics, {}, {}, {}, mongoose.Document<unknown, {}, IRiskMetrics, {}, {}> & IRiskMetrics & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default RiskMetrics;
//# sourceMappingURL=RiskMetrics.d.ts.map