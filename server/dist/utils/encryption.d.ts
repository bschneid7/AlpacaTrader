/**
 * Encrypts a string using AES-256-GCM encryption
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: salt:iv:authTag:encryptedData
 */
export declare const encrypt: (text: string) => string;
/**
 * Decrypts a string encrypted with the encrypt function
 * @param encryptedText - Encrypted string in format: salt:iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export declare const decrypt: (encryptedText: string) => string;
/**
 * Validates if a string is in the correct encrypted format
 * @param text - String to validate
 * @returns True if valid encrypted format
 */
export declare const isEncrypted: (text: string) => boolean;
//# sourceMappingURL=encryption.d.ts.map