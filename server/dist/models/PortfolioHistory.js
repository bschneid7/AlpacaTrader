import mongoose, { Schema } from 'mongoose';
const PortfolioHistorySchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    date: {
        type: Date,
        required: true,
        index: true,
    },
    portfolioValue: {
        type: Number,
        required: true,
        min: 0,
    },
    equity: {
        type: Number,
        required: true,
        min: 0,
    },
    cash: {
        type: Number,
        required: true,
    },
    longMarketValue: {
        type: Number,
        default: 0,
    },
    shortMarketValue: {
        type: Number,
        default: 0,
    },
    buyingPower: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
// Compound index to ensure one record per user per day
PortfolioHistorySchema.index({ userId: 1, date: 1 }, { unique: true });
// Index for time-based queries
PortfolioHistorySchema.index({ userId: 1, date: -1 });
export default mongoose.model('PortfolioHistory', PortfolioHistorySchema);
//# sourceMappingURL=PortfolioHistory.js.map