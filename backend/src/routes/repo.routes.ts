import { Router } from "express";

import { upload } from "../middleware/upload.middleware";

import { authenticateAccessToken } from "../middleware/auth.middleware";

import {

    uploadRepository,

    getMyRepositories

} from "../controllers/repo/repo.controller";

export const repoRouter = Router();

/**
 * Every repository endpoint
 * requires authentication.
 */
repoRouter.use(authenticateAccessToken);

/**
 * Upload Repository
 */
repoRouter.post(

    "/upload",

    upload.single("repository"),

    uploadRepository

);

/**
 * Get all repositories
 * of logged-in user.
 */
repoRouter.get(

    "/me",

    getMyRepositories

);