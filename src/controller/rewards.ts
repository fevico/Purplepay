import { RequestHandler } from "express";
import mongoose from "mongoose";
import { 
    calculateRewardAmount, 
    createRewardForTransaction, 
    redeemRewards as redeemRewardsService, 
    getUserRewardsInfo 
} from "../services/rewards";

/**
 * Get user rewards information
 * @route GET /rewards
 */
export const getUserRewards: RequestHandler = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    try {
        const rewardsInfo = await getUserRewardsInfo(userId);
        return res.status(200).json(rewardsInfo);
    } catch (error) {
        console.error("Error getting user rewards:", error);
        return res.status(500).json({ message: "Failed to get rewards information" });
    }
};

/**
 * Redeem rewards
 * @route POST /rewards/redeem
 */
export const redeemRewards: RequestHandler = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const { amount, method } = req.body;

    // Validate input
    if (!amount || !method) {
        return res.status(400).json({ message: "Amount and redemption method are required" });
    }

    // Validate amount is a positive number
    if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number" });
    }

    // Validate method is one of the allowed values
    const allowedMethods = ["wallet_credit", "bank_transfer", "airtime", "bill_payment", "card_funding"];
    if (!allowedMethods.includes(method)) {
        return res.status(400).json({ 
            message: "Invalid redemption method", 
            allowedMethods 
        });
    }

    try {
        const result = await redeemRewardsService(userId, amount, method);
        
        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }
        
        return res.status(200).json({ 
            message: "Rewards redeemed successfully", 
            redemption: result.redemption 
        });
    } catch (error) {
        console.error("Error redeeming rewards:", error);
        return res.status(500).json({ message: "Failed to redeem rewards" });
    }
};
