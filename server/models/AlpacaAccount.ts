import mongoose, { Document, Schema } from 'mongoose';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption';

export interface IAlpacaAccount extends Document {
  userId: mongoose.Types.ObjectId;
  apiKey: string;
  secretKey: string;
  accountNumber?: string;
  accountType?: string;
  buyingPower?: number;
  isConnected: boolean;
  isPaperTrading: boolean;
  autoTradingEnabled: boolean;
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  getDecryptedApiKey(): string;
  getDecryptedSecretKey(): string;
}

const alpacaAccountSchema = new Schema<IAlpacaAccount>({
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
    set: (value: string) => {
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
    set: (value: string) => {
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
alpacaAccountSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to get decrypted API key
alpacaAccountSchema.methods.getDecryptedApiKey = function(): string {
  try {
    return decrypt(this.apiKey);
  } catch (error) {
    console.error('Failed to decrypt API key:', error);
    throw new Error('Failed to decrypt API key');
  }
};

// Method to get decrypted secret key
alpacaAccountSchema.methods.getDecryptedSecretKey = function(): string {
  try {
    return decrypt(this.secretKey);
  } catch (error) {
    console.error('Failed to decrypt secret key:', error);
    throw new Error('Failed to decrypt secret key');
  }
};

// Don't return encrypted credentials in JSON
alpacaAccountSchema.set('toJSON', {
  transform: (doc: Document, ret: Record<string, unknown>) => {
    delete ret.apiKey;
    delete ret.secretKey;
    return ret;
  },
});

const AlpacaAccount = mongoose.model<IAlpacaAccount>('AlpacaAccount', alpacaAccountSchema);

export default AlpacaAccount;
