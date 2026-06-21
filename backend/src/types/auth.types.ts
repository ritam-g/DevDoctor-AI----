import type { Request } from "express";
import type { UserPlan } from "./user.types";

export type JwtTokenType = "access" | "refresh";

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface JwtUserIdentity {
    id: string;
    email: string;
    githubId?: string;
}

export interface AccessTokenPayload {
    sub: string;
    email: string;
    githubId?: string;
    tokenType: "access";
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string | string[];
}

export interface RefreshTokenPayload {
    sub: string;
    email: string;
    githubId?: string;
    tokenType: "refresh";
    jti: string;
    iat?: number;
    exp: number;
    iss?: string;
    aud?: string | string[];
}

export interface IssuedRefreshToken {
    token: string;
    tokenId: string;
    expiresAt: Date;
}

export interface GithubOAuthProfile {
    githubId: string;
    username: string;
    email: string;
    avatarUrl?: string;
}

export interface AuthenticatedUser {
    id: string;
    githubId?: string;
    username: string;
    email: string;
    avatarUrl?: string;
    plan: UserPlan;
    analysisCredits: number;
}

export interface AuthResponse {
    accessToken: string;
    refreshTokenExpiresAt: Date;
    user: AuthenticatedUser;
}

export interface AuthSession extends AuthResponse {
    refreshToken: string;
}

export interface RefreshTokenMetadata {
    ipAddress?: string;
    userAgent?: string;
}

export interface AuthenticatedAccessContext {
    payload: AccessTokenPayload;
    user: AuthenticatedUser;
}

export interface AuthenticatedRequest extends Request {
    auth: AccessTokenPayload;
    user: AuthenticatedUser;
}

declare global {
    namespace Express {
        interface User extends AuthenticatedUser {}

        interface Request {
            auth?: AccessTokenPayload;
            authSession?: AuthSession;
        }
    }
}
