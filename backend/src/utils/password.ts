import bcrypt from "bcrypt";

const PASSWORD_SALT_ROUNDS = 12;

/**
 * Hashes a plain-text password before persistence.
 *
 * The service layer calls this before creating credential accounts so the
 * database never stores recoverable user passwords.
 *
 * @param password Plain-text password received from a validated auth request.
 * @returns Bcrypt password hash suitable for MongoDB storage.
 */
export const hashPassword = async (password: string): Promise<string> => {
    return bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
};

/**
 * Compares a plain-text password with a stored bcrypt hash.
 *
 * Login uses bcrypt comparison instead of manual hashing so salt and cost
 * factors remain encoded in the stored hash and can evolve safely.
 *
 * @param password Plain-text password submitted during login.
 * @param passwordHash Stored bcrypt hash selected from MongoDB.
 * @returns True when the password matches the stored hash.
 */
export const comparePassword = async (password: string, passwordHash: string): Promise<boolean> => {
    return bcrypt.compare(password, passwordHash);
};
