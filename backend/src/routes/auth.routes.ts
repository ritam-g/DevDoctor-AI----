import { Router, type NextFunction, type Request, type Response } from "express";
import passport from "passport";
import { getMe, githubOAuthCallback, login, logout, refreshAccessToken, register } from "../controllers/auth/auth.controller";
import { authenticateAccessToken } from "../middleware/auth.middleware";
import { ApiError } from "../utils/apiError";

export const authRouter = Router();

/* ------------------------------------------------------------------
GitHub OAuth Routes
-------------------
1. Redirect the user to GitHub with identity and email scopes.
2. Let Passport validate GitHub's callback.
3. Return the shared DevDoctor auth response from the controller.
------------------------------------------------------------------- */

authRouter.get(
    "/github",
    passport.authenticate("github", {
        scope: ["read:user", "user:email"],
        session: false,
    })
);

authRouter.get("/github/callback", (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate("github", { session: false }, (error: unknown, user: Express.User | false | null) => {
        if (error) {
            next(error);
            return;
        }

        if (!user) {
            next(ApiError.unauthorized("GitHub authentication failed"));
            return;
        }

        req.user = user;
        void githubOAuthCallback(req, res, next);
    })(req, res, next);
});

/* ------------------------------------------------------------------
Credential Auth Routes
----------------------
Register and login return an access token in the response body and set the
refresh token in an HttpOnly cookie for rotation.
------------------------------------------------------------------- */

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/refresh", refreshAccessToken);
authRouter.post("/logout", logout);
authRouter.get("/me", authenticateAccessToken, getMe);
