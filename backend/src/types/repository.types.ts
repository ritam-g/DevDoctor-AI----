import { Types } from "mongoose";
export type RepositoryStatus =
    | "uploaded"
    | "processing"
    | "completed"
    | "failed";

export interface IRepository {
    userId: Types.ObjectId;

    repositoryName: string;

    originalFileName: string;

    cloudinaryUrl: string;

    status: RepositoryStatus;

    createdAt: Date;
    updatedAt: Date;
}