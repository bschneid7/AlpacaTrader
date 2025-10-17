import mongoose, { Schema } from 'mongoose';
const TradeSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    alpacaAccountId: {
        type: Schema.Types.ObjectId,
        ref: 'AlpacaAccount',
        required: true,
    },
    orderId: {
        type: String,
        sparse: true,
    },
    clientOrderId: {
        type: String,
        sparse: true,
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        index: true,
    },
    assetClass: {
        type: String,
        default: 'us_equity',
    },
    side: {
        type: String,
        enum: ['buy', 'sell'],
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 0,
    },
    filledQuantity: {
        type: Number,
        required: true,
        min: 0,
    },
    entryPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    exitPrice: {
        type: Number,
        min: 0,
    },
    averagePrice: {
        type: Number,
        required: true,
        min: 0,
    },
    profitLoss: {
        type: Number,
    },
    profitLossPercentage: {
        type: Number,
    },
    entryTime: {
        type: Date,
        required: true,
        index: true,
    },
    exitTime: {
        type: Date,
    },
    duration: {
        type: Number,
        min: 0,
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'partially_filled', 'cancelled'],
        default: 'open',
        index: true,
    },
    commission: {
        type: Number,
        default: 0,
    },
    exchange: {
        type: String,
    },
    orderType: {
        type: String,
    },
    timeInForce: {
        type: String,
    },
    strategyName: {
        type: String,
    },
    notes: {
        type: String,
    },
}, {
    timestamps: true,
});
// Indexes for common queries
TradeSchema.index({ userId: 1, createdAt: -1 });
TradeSchema.index({ userId: 1, status: 1, createdAt: -1 });
TradeSchema.index({ userId: 1, symbol: 1, createdAt: -1 });
// Calculate profit/loss before saving
TradeSchema.pre('save', function (next) {
    if (this.status === 'closed' && this.exitPrice && this.entryPrice) {
        const entryTotal = this.entryPrice * this.filledQuantity;
        const exitTotal = this.exitPrice * this.filledQuantity;
        if (this.side === 'buy') {
            // For long positions: profit = exit - entry
            this.profitLoss = exitTotal - entryTotal - (this.commission || 0);
        }
        else {
            // For short positions: profit = entry - exit
            this.profitLoss = entryTotal - exitTotal - (this.commission || 0);
        }
        this.profitLossPercentage = (this.profitLoss / entryTotal) * 100;
        // Calculate duration if both times exist
        if (this.exitTime && this.entryTime) {
            this.duration = Math.floor((this.exitTime.getTime() - this.entryTime.getTime()) / (1000 * 60));
        }
    }
    next();
});
export default mongoose.model('Trade', TradeSchema);
//# sourceMappingURL=Trade.js.map