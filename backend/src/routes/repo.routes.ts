import { Router } from "express";
import { upload } from "../middleware/upload.middleware.ts";
import { uploadRepository } from "../controllers/repo/repo.controller.ts";
import { authenticateAccessToken } from "../middleware/auth.middleware.ts";

export const repoRouter = Router();

repoRouter.use(authenticateAccessToken)

repoRouter.post("/upload", upload.single("repository"), uploadRepository);

