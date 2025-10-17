import mongoose, { Document } from 'mongoose';
export interface ITradingPreferences extends Document {
    userId: mongoose.Types.ObjectId;
    autoTradingEnabled: boolean;
    lastToggleTime: Date;
    tradingStatus: 'active' | 'paused' | 'stopped';
    createdAt: Date;
    updatedAt: Date;
}
declare const TradingPreferences: mongoose.Model<ITradingPreferences, {}, {}, {}, mongoose.Document<unknown, {}, ITradingPreferences, {}, {}> & ITradingPreferences & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default TradingPreferences;
//# sourceMappingURL=TradingPreferences.d.ts.map