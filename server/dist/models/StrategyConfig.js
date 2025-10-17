import mongoose, { Schema } from 'mongoose';
const strategyConfigSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    maxPositionSize: {
        type: Number,
        required: true,
        min: 5,
        max: 25,
        default: 15,
    },
    maxConcurrentPositions: {
        type: Number,
        required: true,
        min: 3,
        max: 15,
        default: 8,
    },
    stopLossPercentage: {
        type: Number,
        required: true,
        min: 1,
        max: 10,
        default: 5,
    },
    takeProfitTarget: {
        type: Number,
        required: true,
        min: 5,
        max: 20,
        default: 12,
    },
    monthlyReturnTarget: {
        min: {
            type: Number,
            required: true,
            default: 8,
        },
        max: {
            type: Number,
            required: true,
            default: 10,
        },
    },
    enablePreMarket: {
        type: Boolean,
        default: false,
    },
    enableAfterHours: {
        type: Boolean,
        default: false,
    },
    marketHoursOnly: {
        type: Boolean,
        default: true,
    },
    minStockPrice: {
        type: Number,
        required: true,
        min: 0,
        default: 5,
    },
    minDailyVolume: {
        type: Number,
        required: true,
        min: 0,
        default: 1000000,
    },
    marketCapPreferences: {
        type: [String],
        enum: ['small', 'mid', 'large'],
        default: ['mid', 'large'],
    },
    sectorPreferences: {
        type: [String],
        enum: [
            'technology',
            'healthcare',
            'finance',
            'consumer',
            'industrial',
            'energy',
            'utilities',
            'materials',
            'real_estate',
            'communication',
        ],
        default: ['technology', 'healthcare', 'finance'],
    },
}, {
    timestamps: true,
});
// Default aggressive strategy configuration
export const DEFAULT_AGGRESSIVE_STRATEGY = {
    maxPositionSize: 15,
    maxConcurrentPositions: 8,
    stopLossPercentage: 5,
    takeProfitTarget: 12,
    monthlyReturnTarget: {
        min: 8,
        max: 10,
    },
    enablePreMarket: false,
    enableAfterHours: false,
    marketHoursOnly: true,
    minStockPrice: 5,
    minDailyVolume: 1000000,
    marketCapPreferences: ['mid', 'large'],
    sectorPreferences: ['technology', 'healthcare', 'finance'],
};
const StrategyConfig = mongoose.model('StrategyConfig', strategyConfigSchema);
export default StrategyConfig;
//# sourceMappingURL=StrategyConfig.js.map