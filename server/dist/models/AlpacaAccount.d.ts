import mongoose, { Document } from 'mongoose';
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
declare const AlpacaAccount: mongoose.Model<IAlpacaAccount, {}, {}, {}, mongoose.Document<unknown, {}, IAlpacaAccount, {}, {}> & IAlpacaAccount & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default AlpacaAccount;
//# sourceMappingURL=AlpacaAccount.d.ts.map