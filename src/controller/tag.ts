import { RequestHandler } from "express";
import mongoose from "mongoose";
import { 
    checkTagAvailability, 
    findUserByTag, 
    generateTagSuggestion, 
    updateTagPrivacy, 
    updateUserTag 
} from "../services/tag";
import { logger } from "../utils/logger";

/**
 * Create a new tag
 * @route POST /api/tag
 */
export const createTag: RequestHandler = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { tag } = req.body;

    if (!tag) {
        return res.status(400).json({ message: "Tag is required" });
    }

    try {
        // Check if tag is available
        const isAvailable = await checkTagAvailability(tag);
        if (!isAvailable) {
            return res.status(400).json({ message: "Tag is already taken" });
        }

        // Update user's tag
        const result = await updateUserTag(userId, tag);
        return res.status(200).json(result);
    } catch (error) {
        logger.error("Error creating tag:", error);
        return res.status(500).json({ message: "Failed to create tag" });
    }
};

/**
 * Get all tags
 * @route GET /api/tag
 */
export const getAllTags: RequestHandler = async (req, res) => {
    // This would typically query a tag collection or aggregate user tags
    // For now, we'll return a placeholder
    return res.status(200).json({ message: "Get all tags endpoint" });
};

/**
 * Get tag by ID
 * @route GET /api/tag/:id
 */
export const getTagById: RequestHandler = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await findUserByTag(id);
        if (!user) {
            return res.status(404).json({ message: "Tag not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        logger.error("Error getting tag by ID:", error);
        return res.status(500).json({ message: "Failed to get tag" });
    }
};

/**
 * Update tag
 * @route PUT /api/tag/:id
 */
export const updateTag: RequestHandler = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { tag } = req.body;

    if (!tag) {
        return res.status(400).json({ message: "Tag is required" });
    }

    try {
        // Check if tag is available
        const isAvailable = await checkTagAvailability(tag);
        if (!isAvailable) {
            return res.status(400).json({ message: "Tag is already taken" });
        }

        // Update user's tag
        const result = await updateUserTag(userId, tag);
        return res.status(200).json(result);
    } catch (error) {
        logger.error("Error updating tag:", error);
        return res.status(500).json({ message: "Failed to update tag" });
    }
};

/**
 * Delete tag
 * @route DELETE /api/tag/:id
 */
export const deleteTag: RequestHandler = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    try {
        // Update user's tag to empty string to remove it
        const result = await updateUserTag(userId, "");
        return res.status(200).json({ message: "Tag deleted successfully" });
    } catch (error) {
        logger.error("Error deleting tag:", error);
        return res.status(500).json({ message: "Failed to delete tag" });
    }
};
