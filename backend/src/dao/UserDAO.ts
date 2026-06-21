import { Types } from "mongoose";
import { User } from "../models/User.model";
import type { UserDocument } from "../types/user.types";
import type { GithubOAuthProfile } from "../types/auth.types";

/**
 * UserDAO - Data Access Object for User model operations
 * Handles all database interactions related to users
 */
export class UserDAO {
    /**
     * Create a new user with email/password credentials
     */
    static async createUser(userData: {
        username: string;
        email: string;
        password: string;
        plan?: "free" | "pro" | "enterprise";
        analysisCredits?: number;
    }): Promise<UserDocument> {
        return User.create(userData);
    }

    /**
     * Create a new user via GitHub OAuth
     */
    static async createGitHubUser(userData: {
        githubId: string;
        username: string;
        email: string;
        avatarUrl?: string;
        plan?: "free" | "pro" | "enterprise";
        analysisCredits?: number;
    }): Promise<UserDocument> {
        return User.create(userData);
    }

    /**
     * Check if user exists by email
     */
    static async userExistsByEmail(email: string): Promise<boolean> {
        const exists = await User.exists({ email });
        return !!exists;
    }

    /**
     * Find user by email (without password)
     */
    static async findByEmail(email: string): Promise<UserDocument | null> {
        return User.findOne({ email });
    }

    /**
     * Find user by email with password field selected
     */
    static async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
        return User.findOne({ email }).select("+password +refreshTokenHash");
    }

    /**
     * Find user by GitHub ID
     */
    static async findByGitHubId(githubId: string): Promise<UserDocument | null> {
        return User.findOne({ githubId }).select("+refreshTokenHash");
    }

    /**
     * Find user by ID
     */
    static async findById(userId: string): Promise<UserDocument | null> {
        if (!Types.ObjectId.isValid(userId)) {
            return null;
        }
        return User.findById(userId);
    }

    /**
     * Find user by ID with refresh token hash selected
     */
    static async findByIdWithRefreshToken(userId: string): Promise<UserDocument | null> {
        if (!Types.ObjectId.isValid(userId)) {
            return null;
        }
        return User.findById(userId).select("+refreshTokenHash");
    }

    /**
     * Update user by ID
     */
    static async updateUser(
        userId: string,
        updates: {
            username?: string;
            email?: string;
            avatarUrl?: string;
            githubId?: string;
            analysisCredits?: number;
            plan?: "free" | "pro" | "enterprise";
            refreshTokenHash?: string;
        }
    ): Promise<UserDocument | null> {
        if (!Types.ObjectId.isValid(userId)) {
            return null;
        }
        return User.findByIdAndUpdate(userId, updates, { new: true });
    }

    /**
     * Save user (used for model instance saves)
     */
    static async saveUser(user: UserDocument): Promise<UserDocument> {
        return user.save();
    }

    /**
     * Update refresh token hash for a user
     */
    static async updateRefreshTokenHash(
        userId: string,
        currentHash: string,
        newHash: string
    ): Promise<{ modifiedCount: number }> {
        const result = await User.updateOne(
            {
                _id: userId,
                refreshTokenHash: currentHash,
            },
            {
                $set: {
                    refreshTokenHash: newHash,
                },
            }
        );
        return { modifiedCount: result.modifiedCount };
    }

    /**
     * Clear refresh token hash (logout operation)
     */
    static async clearRefreshTokenHash(refreshTokenHash: string): Promise<void> {
        await User.updateOne(
            { refreshTokenHash },
            {
                $unset: {
                    refreshTokenHash: "",
                },
            }
        );
    }

    /**
     * Clear refresh token by user ID
     */
    static async clearRefreshTokenHashByUserId(userId: string): Promise<void> {
        await User.updateOne(
            { _id: userId },
            {
                $unset: {
                    refreshTokenHash: "",
                },
            }
        );
    }
}
