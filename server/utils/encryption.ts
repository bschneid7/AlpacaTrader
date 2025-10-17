import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;

/**
 * Encrypts a string using AES-256-GCM encryption
 * @param text - Plain text to encrypt
 * @returns Encrypted string in format: salt:iv:authTag:encryptedData
 */
export const encrypt = (text: string): string => {
  try {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from encryption key and salt using PBKDF2
    const key = crypto.pbkdf2Sync(
      process.env.ENCRYPTION_KEY,
      salt,
      100000,
      32,
      'sha512'
    );

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return combined string: salt:iv:authTag:encryptedData
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts a string encrypted with the encrypt function
 * @param encryptedText - Encrypted string in format: salt:iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export const decrypt = (encryptedText: string): string => {
  try {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }

    // Split the encrypted text into components
    const parts = encryptedText.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const [saltHex, ivHex, authTagHex, encrypted] = parts;

    // Convert hex strings back to buffers
    const salt = Buffer.from(saltHex, 'hex');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    // Derive the same key using the stored salt
    const key = crypto.pbkdf2Sync(
      process.env.ENCRYPTION_KEY,
      salt,
      100000,
      32,
      'sha512'
    );

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Validates if a string is in the correct encrypted format
 * @param text - String to validate
 * @returns True if valid encrypted format
 */
export const isEncrypted = (text: string): boolean => {
  const parts = text.split(':');
  return parts.length === 4;
};
