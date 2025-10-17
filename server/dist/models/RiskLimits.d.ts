import mongoose, { Document } from 'mongoose';
export interface IRiskLimits extends Document {
    userId: mongoose.Types.ObjectId;
    dailyLossLimit: {
        enabled: boolean;
        value: number;
        type: 'percentage' | 'dollar';
    };
    portfolioDrawdownLimit: {
        enabled: boolean;
        value: number;
    };
    positionLossThreshold: {
        enabled: boolean;
        value: number;
    };
    dailyLossThreshold: {
        enabled: boolean;
        value: number;
    };
    drawdownThreshold: {
        enabled: boolean;
        value: number;
    };
    volatilityThreshold: {
        enabled: boolean;
        value: number;
    };
    haltTradingOnDailyLimit: boolean;
    haltTradingOnDrawdown: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const RiskLimits: mongoose.Model<IRiskLimits, {}, {}, {}, mongoose.Document<unknown, {}, IRiskLimits, {}, {}> & IRiskLimits & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default RiskLimits;
//# sourceMappingURL=RiskLimits.d.ts.map