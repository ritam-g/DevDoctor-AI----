import cloudinary from "../../config/cloudinary.ts";
import streamifier from "streamifier";

/**
 * Upload ZIP file buffer to Cloudinary
 */
export const uploadRepositoryZip = (fileBuffer: Buffer, fileName: string): Promise<string> => {

    return new Promise((resolve, reject) => {

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "raw",
                folder: "repositories",
                public_id: fileName.replace(".zip", ""),
            },
            (error, result) => {

                if (error) {
                    reject(error);
                    return;
                }

                resolve(result!.secure_url);
            }
        );

        streamifier
            .createReadStream(fileBuffer)
            .pipe(uploadStream);
    });
};