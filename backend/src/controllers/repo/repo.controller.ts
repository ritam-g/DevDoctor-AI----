
import { Request, Response } from "express";
import { createRepository } from "../../services/repo/repo.service.ts";

export const uploadRepository = async (
    req: Request,
    res: Response
) => {

    if (!req.file) {
        return res.status(400).json({
            message: "Repository file required"
        });
    }

    const repository =
        await createRepository(
            req.file,
            req.user!.id
        );

    res.status(201).json({
        success: true,
        repository
    });
};