import { ApiError } from "../utils/apiError.ts";
import multer from "multer";


const storage = multer.memoryStorage();


/**
 * Only allow zip files.
 */
const fileFilter: multer.Options["fileFilter"] = (
    req,
    file,
    cb
) => {

    const allowedMimeTypes = [
        "application/zip",
        "application/x-zip-compressed",
        "multipart/x-zip"
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
        return;
    }

    cb(
        ApiError.badRequest("Only zip files are allowed"),
    );
};


export const upload = multer({
    storage,

    limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB
    },

    fileFilter,
});