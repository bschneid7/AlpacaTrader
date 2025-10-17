import mongoose, { Schema } from 'mongoose';
const riskMetricsSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    currentRiskExposure: { type: Number, required: true, default: 0 },
    portfolioValue: { type: Number, required: true, default: 0 },
    cashAvailable: { type: Number, required: true, default: 0 },
    dailyPnL: { type: Number, required: true, default: 0 },
    dailyPnLPercentage: { type: Number, required: true, default: 0 },
    peakPortfolioValue: { type: Number, required: true, default: 0 },
    currentDrawdown: { type: Number, required: true, default: 0 },
    maxDrawdown: { type: Number, required: true, default: 0 },
    sectorConcentration: [{
            sector: { type: String, required: true },
            value: { type: Number, required: true },
            percentage: { type: Number, required: true }
        }],
    positionConcentration: [{
            symbol: { type: String, required: true },
            value: { type: Number, required: true },
            percentage: { type: Number, required: true }
        }],
    correlationMatrix: { type: Schema.Types.Mixed, default: {} },
    volatilityIndex: { type: Number, default: 0 },
    calculatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});
// Index for efficient querying
riskMetricsSchema.index({ userId: 1, calculatedAt: -1 });
const RiskMetrics = mongoose.model('RiskMetrics', riskMetricsSchema);
export default RiskMetrics;
//# sourceMappingURL=RiskMetrics.js.map