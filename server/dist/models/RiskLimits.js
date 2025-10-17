import mongoose, { Schema } from 'mongoose';
const riskLimitsSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    dailyLossLimit: {
        enabled: { type: Boolean, default: true },
        value: { type: Number, default: 5 },
        type: { type: String, enum: ['percentage', 'dollar'], default: 'percentage' }
    },
    portfolioDrawdownLimit: {
        enabled: { type: Boolean, default: true },
        value: { type: Number, default: 15 }
    },
    positionLossThreshold: {
        enabled: { type: Boolean, default: true },
        value: { type: Number, default: 10 }
    },
    dailyLossThreshold: {
        enabled: { type: Boolean, default: true },
        value: { type: Number, default: 3 }
    },
    drawdownThreshold: {
        enabled: { type: Boolean, default: true },
        value: { type: Number, default: 10 }
    },
    volatilityThreshold: {
        enabled: { type: Boolean, default: true },
        value: { type: Number, default: 50 }
    },
    haltTradingOnDailyLimit: { type: Boolean, default: true },
    haltTradingOnDrawdown: { type: Boolean, default: true }
}, {
    timestamps: true
});
// Ensure userId is unique
riskLimitsSchema.index({ userId: 1 }, { unique: true });
const RiskLimits = mongoose.model('RiskLimits', riskLimitsSchema);
export default RiskLimits;
//# sourceMappingURL=RiskLimits.js.map