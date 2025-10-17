import mongoose, { Schema } from 'mongoose';
const TradingPreferencesSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    autoTradingEnabled: {
        type: Boolean,
        default: false,
    },
    lastToggleTime: {
        type: Date,
        default: Date.now,
    },
    tradingStatus: {
        type: String,
        enum: ['active', 'paused', 'stopped'],
        default: 'stopped',
    },
}, {
    timestamps: true,
});
// Note: Index on userId is already created by unique: true, no need to add it again
const TradingPreferences = mongoose.model('TradingPreferences', TradingPreferencesSchema);
export default TradingPreferences;
//# sourceMappingURL=TradingPreferences.js.map