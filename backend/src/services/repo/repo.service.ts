import { RepositoryDAO } from "../../dao/RepositoryDAO";
import { uploadRepositoryZip } from "./cloudinaryUpload";

/**
 * Repository Service
 *
 * This layer contains all business logic related to repositories.
 *
 * Responsibilities:
 * -----------------
 * • Upload repository
 * • Fetch repositories
 * • Delete repositories
 * • Future AI processing
 *
 * NOTE:
 * Never access MongoDB directly from controllers.
 * Controllers should always call this service.
 */
export class RepoService {

    /**
     * Upload repository to Cloudinary
     * and create MongoDB record.
     */
    static async createRepository(
        file: Express.Multer.File,
        userId: string
    ) {

        const cloudinaryUrl =
            await uploadRepositoryZip(
                file.buffer,
                file.originalname
            );

        return RepositoryDAO.createRepository({

            userId,

            repositoryName:
                file.originalname.replace(".zip", ""),

            originalFileName:
                file.originalname,

            cloudinaryUrl,

            status: "uploaded"

        });

    }

    /**
     * Returns all repositories
     * uploaded by the logged-in user.
     */
    static async getMyRepositories(
        userId: string
    ) {

        return RepositoryDAO.findByUserId(userId);

    }

}