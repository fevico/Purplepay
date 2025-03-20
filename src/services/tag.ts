import mongoose from "mongoose";
import User from "../model/user";
import { logger } from "../utils/logger";
import * as QRCode from "qrcode";

/**
 * Generates a unique tag suggestion based on user's name
 */
export const generateTagSuggestion = async (name: string): Promise<string[]> => {
  try {
    // Clean the name and convert to lowercase
    const cleanName = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    // Generate variations
    const suggestions = [
      cleanName,
      `${cleanName}${Math.floor(Math.random() * 1000)}`,
      `${cleanName}${Math.floor(Math.random() * 100)}`,
      `${cleanName}_${Math.floor(Math.random() * 100)}`,
    ];

    // Check which suggestions are available
    const availableSuggestions = await Promise.all(
      suggestions.map(async (suggestion) => {
        const exists = await User.findOne({ tag: suggestion });
        return exists ? null : suggestion;
      })
    );

    // Filter out null values (tags that already exist)
    return availableSuggestions.filter(Boolean) as string[];
  } catch (error) {
    logger.error("Error generating tag suggestions", { error, name });
    return [];
  }
};

/**
 * Checks if a tag is available
 */
export const checkTagAvailability = async (tag: string): Promise<boolean> => {
  try {
    // Clean the tag
    const cleanTag = tag.trim().toLowerCase();
    
    // Check if tag is valid
    if (!/^[a-z0-9_]{3,20}$/.test(cleanTag)) {
      return false;
    }
    
    // Check if tag exists
    const exists = await User.findOne({ tag: cleanTag });
    return !exists;
  } catch (error) {
    logger.error("Error checking tag availability", { error, tag });
    return false;
  }
};

/**
 * Updates a user's tag
 */
export const updateUserTag = async (
  userId: mongoose.Types.ObjectId,
  tag: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Clean the tag
    const cleanTag = tag.trim().toLowerCase();
    
    // Check if tag is valid
    if (!/^[a-z0-9_]{3,20}$/.test(cleanTag)) {
      return { 
        success: false, 
        message: "Invalid tag format. Use 3-20 alphanumeric characters or underscores." 
      };
    }
    
    // Check if tag is available
    const isAvailable = await checkTagAvailability(cleanTag);
    if (!isAvailable) {
      return { success: false, message: "Tag is already taken" };
    }
    
    // Update user's tag
    await User.updateOne(
      { _id: userId },
      { tag: cleanTag }
    );
    
    return { success: true, message: "Tag updated successfully" };
  } catch (error) {
    logger.error("Error updating user tag", { error, userId, tag });
    return { success: false, message: "Error updating tag" };
  }
};

/**
 * Updates a user's tag privacy settings
 */
export const updateTagPrivacy = async (
  userId: mongoose.Types.ObjectId,
  privacy: "public" | "friends" | "private"
): Promise<{ success: boolean; message: string }> => {
  try {
    await User.updateOne(
      { _id: userId },
      { tagPrivacy: privacy }
    );
    
    return { success: true, message: "Privacy settings updated successfully" };
  } catch (error) {
    logger.error("Error updating tag privacy", { error, userId, privacy });
    return { success: false, message: "Error updating privacy settings" };
  }
};

/**
 * Finds a user by tag
 */
export const findUserByTag = async (
  tag: string,
  requestingUserId?: mongoose.Types.ObjectId
): Promise<{ found: boolean; user?: any; message?: string }> => {
  try {
    // Clean the tag
    const cleanTag = tag.trim().toLowerCase();
    
    // Find user by tag
    const user = await User.findOne({ tag: cleanTag })
      .select("_id name tag tagPrivacy profilePicture");
    
    if (!user) {
      return { found: false, message: "User not found" };
    }
    
    // Check privacy settings
    if (user.tagPrivacy === "private") {
      return { found: false, message: "User has private profile" };
    }
    
    if (user.tagPrivacy === "friends") {
      // In a real implementation, we would check if the requesting user
      // is friends with the target user. For now, we'll just check if
      // the requesting user is the same as the target user.
      if (!requestingUserId || !(requestingUserId instanceof mongoose.Types.ObjectId) || !requestingUserId.equals(user._id)) {
        return { found: false, message: "User only allows friends to find them" };
      }
    }
    
    return { found: true, user };
  } catch (error) {
    logger.error("Error finding user by tag", { error, tag });
    return { found: false, message: "Error finding user" };
  }
};

/**
 * Generates a QR code for a user's tag
 */
export const generateTagQRCode = async (
  tag: string
): Promise<{ success: boolean; qrCode?: string; message?: string }> => {
  try {
    // Clean the tag
    const cleanTag = tag.trim().toLowerCase();
    
    // Check if tag exists
    const user = await User.findOne({ tag: cleanTag });
    if (!user) {
      return { success: false, message: "Tag not found" };
    }
    
    // Generate QR code
    const qrCodeData = `purplepay:tag:${cleanTag}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);
    
    return { success: true, qrCode };
  } catch (error) {
    logger.error("Error generating QR code", { error, tag });
    return { success: false, message: "Error generating QR code" };
  }
};
