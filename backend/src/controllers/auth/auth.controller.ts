import type { CookieOptions, NextFunction, Request, Response } from "express";
import { z } from "zod";
import { env } from "../../config/env";
import { authService } from "../../services/auth/auth.service";
import type { AuthResponse, AuthSession, LoginRequest, RefreshTokenMetadata, RegisterRequest } from "../../types/auth.types";
import { ApiError } from "../../utils/apiError";

const REFRESH_TOKEN_COOKIE_NAME = "devdoctor_refresh_token";

const registerRequestSchema = z.object({
    username: z.string().trim().min(1, "Username is required"),
    email: z.string().trim().email("Valid email is required").transform((email) => email.toLowerCase()),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginRequestSchema = z.object({
    email: z.string().trim().email("Valid email is required").transform((email) => email.toLowerCase()),
    password: z.string().min(1, "Password is required"),
});

const refreshTokenCookieSchema = z.string().min(1, "Refresh token cookie is required");

const getRefreshCookieOptions = (expiresAt?: Date): CookieOptions => {
    return {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: env.NODE_ENV === "production" ? "none" : "lax",
        path: "/api/auth",
        expires: expiresAt,
    };
};

const getRequestMetadata = (req: Request): RefreshTokenMetadata => {
    return {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
    };
};

const formatValidationError = (error: z.ZodError): string => {
    return error.issues.map((issue) => issue.message).join(", ");
};

const parseRegisterRequest = (body: unknown): RegisterRequest => {
    const parsed = registerRequestSchema.safeParse(body);

    if (!parsed.success) {
        throw ApiError.badRequest(formatValidationError(parsed.error));
    }

    return parsed.data;
};

const parseLoginRequest = (body: unknown): LoginRequest => {
    const parsed = loginRequestSchema.safeParse(body);

    if (!parsed.success) {
        throw ApiError.badRequest(formatValidationError(parsed.error));
    }

    return parsed.data;
};

const readCookieValue = (cookieHeader: string | undefined, cookieName: string): string | undefined => {
    if (!cookieHeader) {
        return undefined;
    }

    for (const cookie of cookieHeader.split(";")) {
        const trimmedCookie = cookie.trim();
        const separatorIndex = trimmedCookie.indexOf("=");

        if (separatorIndex === -1) {
            continue;
        }

        const key = trimmedCookie.slice(0, separatorIndex).trim();

        if (key !== cookieName) {
            continue;
        }

        const value = trimmedCookie.slice(separatorIndex + 1);

        try {
            return decodeURIComponent(value);
        } catch {
            return value;
        }
    }

    return undefined;
};

const getValidatedRefreshToken = (req: Request): string => {
    const parsed = refreshTokenCookieSchema.safeParse(readCookieValue(req.headers.cookie, REFRESH_TOKEN_COOKIE_NAME));

    if (!parsed.success) {
        throw ApiError.unauthorized("Refresh token cookie is required");
    }

    return parsed.data;
};

const setRefreshTokenCookie = (res: Response, refreshToken: string, expiresAt: Date): void => {
    res.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, getRefreshCookieOptions(expiresAt));
};

const clearRefreshTokenCookie = (res: Response): void => {
    res.clearCookie(REFRESH_TOKEN_COOKIE_NAME, getRefreshCookieOptions());
};

const toAuthResponse = (session: AuthSession): AuthResponse => {
    return {
        accessToken: session.accessToken,
        refreshTokenExpiresAt: session.refreshTokenExpiresAt,
        user: session.user,
    };
};

const sendAuthSession = (res: Response, statusCode: number, message: string, session: AuthSession): void => {
    setRefreshTokenCookie(res, session.refreshToken, session.refreshTokenExpiresAt);

    res.status(statusCode).json({
        success: true,
        message,
        data: toAuthResponse(session),
    });
};

/* ------------------------------------------------------------------
Credential Registration Flow
----------------------------
1. Validate username, email, and password.
2. Hash the password in the service layer.
3. Create the user and issue JWTs.
4. Store only the refresh-token hash.
5. Set the refresh token as an HttpOnly cookie.
------------------------------------------------------------------- */

/**
 * Registers a new email/password account.
 *
 * Route purpose: create a credential user while preserving the same session
 * response format used by GitHub OAuth. Request source: JSON body containing
 * username, email, and password. Response structure: success flag, access token,
 * refresh-cookie expiry, and safe user profile.
 *
 * @param req Express request containing the registration body.
 * @param res Express response used to set the refresh cookie and JSON body.
 * @param next Central error handler bridge.
 * @returns Nothing; the response is sent by the controller.
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const payload = parseRegisterRequest(req.body);
        const session = await authService.register(payload, getRequestMetadata(req));

        sendAuthSession(res, 201, "Registration successful", session);
    } catch (error) {
        next(error);
    }
};

/* ------------------------------------------------------------------
Credential Login Flow
---------------------
1. Validate email and password.
2. Compare the submitted password with the bcrypt hash.
3. Issue access and refresh tokens.
4. Replace the stored refresh-token hash.
5. Set the refresh token as an HttpOnly cookie.
------------------------------------------------------------------- */

/**
 * Authenticates an existing email/password account.
 *
 * Route purpose: exchange valid credentials for DevDoctor tokens. Request
 * source: JSON body containing email and password. Response structure: success
 * flag, access token, refresh-cookie expiry, and safe user profile.
 *
 * @param req Express request containing the login body.
 * @param res Express response used to set the refresh cookie and JSON body.
 * @param next Central error handler bridge.
 * @returns Nothing; the response is sent by the controller.
 */
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const payload = parseLoginRequest(req.body);
        const session = await authService.login(payload, getRequestMetadata(req));

        sendAuthSession(res, 200, "Login successful", session);
    } catch (error) {
        next(error);
    }
};

/* ------------------------------------------------------------------
GitHub OAuth Flow
-----------------
1. Passport validates GitHub's callback.
2. Auth service creates or links the local user.
3. Auth service issues tokens and stores the refresh hash.
4. Controller sets the HttpOnly refresh cookie.
------------------------------------------------------------------- */

/**
 * Completes GitHub OAuth authentication.
 *
 * Route purpose: return tokens after Passport and the auth service complete
 * GitHub account linking. Request source: req.authSession populated by the
 * GitHub strategy. Response structure: success flag, access token,
 * refresh-cookie expiry, and safe user profile.
 *
 * @param req Express request containing the Passport-created auth session.
 * @param res Express response used to set the refresh cookie and JSON body.
 * @param next Central error handler bridge.
 * @returns Nothing; the response is sent by the controller.
 */
export const githubOAuthCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.authSession) {
            throw ApiError.internal("GitHub authentication session was not created");
        }

        sendAuthSession(res, 200, "GitHub authentication successful", req.authSession);
    } catch (error) {
        next(error);
    }
};

/* ------------------------------------------------------------------
Refresh Token Rotation Flow
---------------------------
1. Read the refresh token from the HttpOnly cookie.
2. Validate the cookie value before service execution.
3. Verify the stored token hash in MongoDB.
4. Generate a new access token and refresh token.
5. Replace the old refresh hash and set the new cookie.
------------------------------------------------------------------- */

/**
 * Rotates the refresh token and issues a new access token.
 *
 * Route purpose: continue an existing session without replaying login or OAuth.
 * Request source: refresh token from the Cookie header. Response structure:
 * success flag, new access token, new refresh-cookie expiry, and safe user
 * profile.
 *
 * @param req Express request containing the refresh cookie.
 * @param res Express response used to rotate the cookie and return JSON.
 * @param next Central error handler bridge.
 * @returns Nothing; the response is sent by the controller.
 */
export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const refreshToken = getValidatedRefreshToken(req);
        const session = await authService.refreshSession(refreshToken, getRequestMetadata(req));

        sendAuthSession(res, 200, "Access token refreshed", session);
    } catch (error) {
        next(error);
    }
};

/* ------------------------------------------------------------------
Logout Flow
-----------
1. Read the refresh token from the HttpOnly cookie when present.
2. Delete the matching stored refresh-token hash.
3. Clear the refresh-token cookie.
4. Return an idempotent success response.
------------------------------------------------------------------- */

/**
 * Logs out the current refresh-token session.
 *
 * Route purpose: invalidate the server-side refresh-token hash and clear the
 * cookie. Request source: refresh token from the Cookie header when available.
 * Response structure: success flag and logout confirmation message.
 *
 * @param req Express request that may contain a refresh cookie.
 * @param res Express response used to clear the cookie and return JSON.
 * @param next Central error handler bridge.
 * @returns Nothing; the response is sent by the controller.
 */
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const refreshToken = readCookieValue(req.headers.cookie, REFRESH_TOKEN_COOKIE_NAME);

        if (refreshToken) {
            await authService.logout(refreshToken);
        }

        clearRefreshTokenCookie(res);

        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Returns the currently authenticated user.
 *
 * Route purpose: let clients hydrate account state after they already have a
 * valid access token. Request source: req.user attached by auth middleware.
 * Response structure: success flag and safe user profile.
 *
 * @param req Express request containing the middleware-authenticated user.
 * @param res Express response used to return the profile payload.
 * @param next Central error handler bridge.
 * @returns Nothing; the response is sent by the controller.
 */
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.user) {
            throw ApiError.unauthorized("Authenticated user is required");
        }

        res.status(200).json({
            success: true,
            data: {
                user: req.user,
            },
        });
    } catch (error) {
        next(error);
    }
};
