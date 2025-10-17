/**
 * Hashes the password using bcrypt algorithm
 * @param password - The password to hash
 * @returns Password hash
 */
declare const generatePasswordHash: (password: string) => Promise<string>;
/**
 * Validates the password against the hash
 * @param password - The password to verify
 * @param hash - Password hash to verify against
 * @returns True if the password matches the hash, false otherwise
 */
declare const validatePassword: (password: string, hash: string) => Promise<boolean>;
/**
 * Checks that the hash has a valid format
 * @param hash - Hash to check format for
 * @returns True if passed string seems like valid hash, false otherwise
 */
declare const isPasswordHash: (hash: string) => boolean;
export { generatePasswordHash, validatePassword, isPasswordHash, };
//# sourceMappingURL=password.d.ts.map