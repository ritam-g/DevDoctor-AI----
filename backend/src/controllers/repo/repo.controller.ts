import { Request, Response } from "express";
import { RepoService } from "../../services/repo/repo.service";

/**
 * Upload a new repository.
 */
export const uploadRepository = async (

    req: Request,

    res: Response

) => {

    if (!req.file) {

        return res.status(400).json({

            success: false,

            message: "Repository file required"

        });

    }

    const repository =
        await RepoService.createRepository(

            req.file,

            req.user!.id

        );

    res.status(201).json({

        success: true,

        repository

    });

};


/**
 * Returns all repositories
 * uploaded by the authenticated user.
 */
export const getMyRepositories = async (

    req: Request,

    res: Response

) => {

    const repositories =
        await RepoService.getMyRepositories(

            req.user!.id

        );

    res.status(200).json({

        success: true,

        total: repositories.length,

        repositories

    });

};