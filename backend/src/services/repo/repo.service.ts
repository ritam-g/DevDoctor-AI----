// src/services/repo/repo.service.ts

import { Repository } from "../../models/Repository.model.ts";
import { uploadRepositoryZip } from "./cloudinaryUpload.ts";

export const createRepository = async (
    file: Express.Multer.File,
    userId: string
) => {

    const cloudinaryUrl =
        await uploadRepositoryZip(
            file.buffer,
            file.originalname
        );

    const repository =
        await Repository.create({
            userId,
            repositoryName: file.originalname.replace(".zip", ""),
            originalFileName: file.originalname,
            cloudinaryUrl,
            status: "uploaded",
        });

    return repository;
};