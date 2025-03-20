import { Router } from "express";
import { 
  checkTagAvailability, 
  findUserByTag, 
  generateTagQRCode, 
  generateTagSuggestion, 
  updateTagPrivacy, 
  updateUserTag 
} from "../services/tag";
import { isAuth } from "../middleware/auth";
import mongoose from "mongoose";
import { logger } from "../utils/logger";

const tagRouter = Router();

/**
 * @route GET /api/tag/suggestions
 * @desc Get tag suggestions based on user's name
 * @access Private
 */
tagRouter.get("/suggestions", isAuth, async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }
    
    const suggestions = await generateTagSuggestion(name);
    
    return res.status(200).json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    logger.error("Error generating tag suggestions", { error });
    return res.status(500).json({
      success: false,
      message: "Error generating tag suggestions",
    });
  }
});

/**
 * @route GET /api/tag/check
 * @desc Check if a tag is available
 * @access Private
 */
tagRouter.get("/check", isAuth, async (req, res) => {
  try {
    const { tag } = req.query;
    
    if (!tag || typeof tag !== "string") {
      return res.status(400).json({
        success: false,
        message: "Tag is required",
      });
    }
    
    const isAvailable = await checkTagAvailability(tag);
    
    return res.status(200).json({
      success: true,
      data: { isAvailable },
    });
  } catch (error) {
    logger.error("Error checking tag availability", { error });
    return res.status(500).json({
      success: false,
      message: "Error checking tag availability",
    });
  }
});

/**
 * @route POST /api/tag/update
 * @desc Update user's tag
 * @access Private
 */
tagRouter.post("/update", isAuth, async (req, res) => {
  try {
    const { tag } = req.body;
    
    if (!tag) {
      return res.status(400).json({
        success: false,
        message: "Tag is required",
      });
    }
    
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const result = await updateUserTag(userId, tag);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
    
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error("Error updating user tag", { error, userId: req.user.id });
    return res.status(500).json({
      success: false,
      message: "Error updating tag",
    });
  }
});

/**
 * @route POST /api/tag/privacy
 * @desc Update user's tag privacy settings
 * @access Private
 */
tagRouter.post("/privacy", isAuth, async (req, res) => {
  try {
    const { privacy } = req.body;
    
    if (!privacy || !["public", "friends", "private"].includes(privacy)) {
      return res.status(400).json({
        success: false,
        message: "Valid privacy setting is required",
      });
    }
    
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const result = await updateTagPrivacy(userId, privacy);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }
    
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.error("Error updating tag privacy", { error, userId: req.user.id });
    return res.status(500).json({
      success: false,
      message: "Error updating privacy settings",
    });
  }
});

/**
 * @route GET /api/tag/find/:tag
 * @desc Find a user by tag
 * @access Private
 */
tagRouter.get("/find/:tag", isAuth, async (req, res) => {
  try {
    const { tag } = req.params;
    
    if (!tag) {
      return res.status(400).json({
        success: false,
        message: "Tag is required",
      });
    }
    
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const result = await findUserByTag(tag, userId);
    
    if (!result.found) {
      return res.status(404).json({
        success: false,
        message: result.message || "User not found",
      });
    }
    
    return res.status(200).json({
      success: true,
      data: result.user,
    });
  } catch (error) {
    logger.error("Error finding user by tag", { error });
    return res.status(500).json({
      success: false,
      message: "Error finding user",
    });
  }
});

/**
 * @route GET /api/tag/qr/:tag
 * @desc Generate QR code for a tag
 * @access Private
 */
tagRouter.get("/qr/:tag", isAuth, async (req, res) => {
  try {
    const { tag } = req.params;
    
    if (!tag) {
      return res.status(400).json({
        success: false,
        message: "Tag is required",
      });
    }
    
    const result = await generateTagQRCode(tag);
    
    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || "Error generating QR code",
      });
    }
    
    return res.status(200).json({
      success: true,
      data: { qrCode: result.qrCode },
    });
  } catch (error) {
    logger.error("Error generating QR code", { error });
    return res.status(500).json({
      success: false,
      message: "Error generating QR code",
    });
  }
});

export default tagRouter;
