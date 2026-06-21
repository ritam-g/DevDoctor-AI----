import { Types } from "mongoose";
import { Repository } from "../models/Repository.model";
import type { RepositoryDocument, CreateRepositoryRecord, UpdateRepositoryRecord, RepositoryStatus } from "../types/repository.types";

/**
 * RepositoryDAO - Data Access Object for Repository model operations
 * Handles all database interactions related to repositories
 */
export class RepositoryDAO {
    /**
     * Create a new repository record
     */
    static async createRepository(data: CreateRepositoryRecord): Promise<RepositoryDocument> {
        return Repository.create(data);
    }

    /**
     * Find repository by ID
     */
    static async findById(repositoryId: string): Promise<RepositoryDocument | null> {
        if (!Types.ObjectId.isValid(repositoryId)) {
            return null;
        }
        return Repository.findById(repositoryId);
    }

    /**
     * Find repository by ID and user ID (ownership check)
     */
    static async findByIdAndUserId(
        repositoryId: string,
        userId: string
    ): Promise<RepositoryDocument | null> {
        if (!Types.ObjectId.isValid(repositoryId) || !Types.ObjectId.isValid(userId)) {
            return null;
        }
        return Repository.findOne({
            _id: repositoryId,
            userId,
        });
    }

    /**
     * Find all repositories by user ID
     */
    static async findByUserId(userId: string): Promise<RepositoryDocument[]> {
        if (!Types.ObjectId.isValid(userId)) {
            return [];
        }
        return Repository.find({ userId }).sort({ createdAt: -1 });
    }

    /**
     * Find repositories by user ID with pagination
     */
    static async findByUserIdPaginated(
        userId: string,
        skip: number = 0,
        limit: number = 10
    ): Promise<RepositoryDocument[]> {
        if (!Types.ObjectId.isValid(userId)) {
            return [];
        }
        return Repository.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
    }

    /**
     * Count total repositories for a user
     */
    static async countByUserId(userId: string): Promise<number> {
        if (!Types.ObjectId.isValid(userId)) {
            return 0;
        }
        return Repository.countDocuments({ userId });
    }

    /**
     * Find repositories by status
     */
    static async findByStatus(status: RepositoryStatus): Promise<RepositoryDocument[]> {
        return Repository.find({ status });
    }

    /**
     * Find repositories by user ID and status
     */
    static async findByUserIdAndStatus(
        userId: string,
        status: RepositoryStatus
    ): Promise<RepositoryDocument[]> {
        if (!Types.ObjectId.isValid(userId)) {
            return [];
        }
        return Repository.find({ userId, status }).sort({ createdAt: -1 });
    }

    /**
     * Update repository by ID
     */
    static async updateRepository(
        repositoryId: string,
        updates: UpdateRepositoryRecord
    ): Promise<RepositoryDocument | null> {
        if (!Types.ObjectId.isValid(repositoryId)) {
            return null;
        }
        return Repository.findByIdAndUpdate(repositoryId, updates, { new: true });
    }

    /**
     * Update repository status
     */
    static async updateRepositoryStatus(
        repositoryId: string,
        status: RepositoryStatus
    ): Promise<RepositoryDocument | null> {
        if (!Types.ObjectId.isValid(repositoryId)) {
            return null;
        }
        return Repository.findByIdAndUpdate(repositoryId, { status }, { new: true });
    }

    /**
     * Delete repository by ID
     */
    static async deleteById(repositoryId: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(repositoryId)) {
            return false;
        }
        const result = await Repository.deleteOne({ _id: repositoryId });
        return result.deletedCount > 0;
    }

    /**
     * Delete repository by ID and user ID (ownership check)
     */
    static async deleteByIdAndUserId(repositoryId: string, userId: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(repositoryId) || !Types.ObjectId.isValid(userId)) {
            return false;
        }
        const result = await Repository.deleteOne({
            _id: repositoryId,
            userId,
        });
        return result.deletedCount > 0;
    }

    /**
     * Check if repository exists
     */
    static async exists(repositoryId: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(repositoryId)) {
            return false;
        }
        const exists = await Repository.exists({ _id: repositoryId });
        return !!exists;
    }

    /**
     * Check if user owns the repository
     */
    static async ownsRepository(repositoryId: string, userId: string): Promise<boolean> {
        if (!Types.ObjectId.isValid(repositoryId) || !Types.ObjectId.isValid(userId)) {
            return false;
        }
        const exists = await Repository.exists({
            _id: repositoryId,
            userId,
        });
        return !!exists;
    }
}
