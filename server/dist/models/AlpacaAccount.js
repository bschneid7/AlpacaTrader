import mongoose, { Schema } from 'mongoose';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';
const alpacaAccountSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true,
    },
    apiKey: {
        type: String,
        required: true,
        set: (value) => {
            // Only encrypt if not already encrypted
            if (value && !isEncrypted(value)) {
                return encrypt(value);
            }
            return value;
        },
    },
    secretKey: {
        type: String,
        required: true,
        set: (value) => {
            // Only encrypt if not already encrypted
            if (value && !isEncrypted(value)) {
                return encrypt(value);
            }
            return value;
        },
    },
    accountNumber: {
        type: String,
        default: null,
    },
    accountType: {
        type: String,
        enum: ['Cash', 'Margin', 'PDT', null],
        default: null,
    },
    buyingPower: {
        type: Number,
        default: 0,
    },
    isConnected: {
        type: Boolean,
        default: true,
    },
    isPaperTrading: {
        type: Boolean,
        default: true,
    },
    autoTradingEnabled: {
        type: Boolean,
        default: false,
    },
    lastSyncedAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        immutable: true,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    versionKey: false,
});
// Update the updatedAt field before saving
alpacaAccountSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Method to get decrypted API key
alpacaAccountSchema.methods.getDecryptedApiKey = function () {
    try {
        return decrypt(this.apiKey);
    }
    catch (error) {
        console.error('Failed to decrypt API key:', error);
        throw new Error('Failed to decrypt API key');
    }
};
// Method to get decrypted secret key
alpacaAccountSchema.methods.getDecryptedSecretKey = function () {
    try {
        return decrypt(this.secretKey);
    }
    catch (error) {
        console.error('Failed to decrypt secret key:', error);
        throw new Error('Failed to decrypt secret key');
    }
};
// Don't return encrypted credentials in JSON
alpacaAccountSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.apiKey;
        delete ret.secretKey;
        return ret;
    },
});
const AlpacaAccount = mongoose.model('AlpacaAccount', alpacaAccountSchema);
export default AlpacaAccount;
//# sourceMappingURL=AlpacaAccount.js.map