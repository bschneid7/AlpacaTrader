import mongoose, { Document } from 'mongoose';
export interface IPosition extends Document {
    userId: mongoose.Types.ObjectId;
    symbol: string;
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    marketValue: number;
    costBasis: number;
    unrealizedPL: number;
    unrealizedPLPercent: number;
    side: 'long' | 'short';
    exchange: string;
    assetId: string;
    avgEntryPrice: number;
    status: 'open' | 'closed';
    openedAt: Date;
    closedAt?: Date;
    closePrice?: number;
    realizedPL?: number;
    alpacaAccountId: mongoose.Types.ObjectId;
    lastUpdated: Date;
}
declare const _default: mongoose.Model<IPosition, {}, {}, {}, mongoose.Document<unknown, {}, IPosition, {}, {}> & IPosition & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Position.d.ts.map