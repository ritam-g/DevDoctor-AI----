import { Schema, model } from "mongoose";
import { IUser } from "../types/user.types";

const userSchema = new Schema<IUser>(
    {
        githubId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
            // Optional GitHub account id used to link OAuth users without forcing password auth.
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            // Canonical account identifier shared by both credential and OAuth login flows.
        },

        password: {
            type: String,
            select: false,
            // Bcrypt hash for credential users; absent for GitHub-only accounts.
        },

        username: {
            type: String,
            required: true,
            trim: true,
            // Human-readable display name shown across DevDoctor account surfaces.
        },

        avatarUrl: {
            type: String,
            trim: true,
            // Optional profile image, usually sourced from GitHub OAuth.
        },

        refreshTokenHash: {
            type: String,
            select: false,
            index: true,
            // Hash of the only active refresh token, enabling rotation and logout invalidation.
        },

        plan: {
            type: String,
            enum: ["free", "pro", "enterprise"],
            default: "free",
            // Product entitlement tier used by quota and feature-gating checks.
        },

        analysisCredits: {
            type: Number,
            default: 5,
            min: 0,
            // Remaining AI analysis quota for the user's current plan.
        },
    },
    {
        timestamps: true,
    }
);

export const User = model<IUser>("User", userSchema);
