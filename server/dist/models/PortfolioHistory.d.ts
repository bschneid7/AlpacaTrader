import mongoose, { Document } from 'mongoose';
export interface IPortfolioHistory extends Document {
    userId: mongoose.Types.ObjectId;
    date: Date;
    portfolioValue: number;
    equity: number;
    cash: number;
    longMarketValue: number;
    shortMarketValue: number;
    buyingPower: number;
    createdAt: Date;
    updatedAt: Date;
}
declare const _default: mongoose.Model<IPortfolioHistory, {}, {}, {}, mongoose.Document<unknown, {}, IPortfolioHistory, {}, {}> & IPortfolioHistory & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=PortfolioHistory.d.ts.map