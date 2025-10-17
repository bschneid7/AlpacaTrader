import mongoose, { Document } from 'mongoose';
export interface ITrade extends Document {
    userId: mongoose.Types.ObjectId;
    alpacaAccountId: mongoose.Types.ObjectId;
    orderId?: string;
    clientOrderId?: string;
    symbol: string;
    assetClass: string;
    side: 'buy' | 'sell';
    quantity: number;
    filledQuantity: number;
    entryPrice: number;
    exitPrice?: number;
    averagePrice: number;
    profitLoss?: number;
    profitLossPercentage?: number;
    entryTime: Date;
    exitTime?: Date;
    duration?: number;
    status: 'open' | 'closed' | 'partially_filled' | 'cancelled';
    commission?: number;
    exchange?: string;
    orderType?: string;
    timeInForce?: string;
    strategyName?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<ITrade, {}, {}, {}, mongoose.Document<unknown, {}, ITrade, {}, {}> & ITrade & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Trade.d.ts.map