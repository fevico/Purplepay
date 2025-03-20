import mongoose from "mongoose";
import { Reward, RewardsBalance, RewardsRedemption } from "../model/rewards";
import { ITransaction } from "../model/transaction";
import { generateReference } from "../utils/helper";
import { logger } from "../utils/logger";

/**
 * Calculates reward amount based on transaction type and amount
 */
export const calculateRewardAmount = (
  transactionType: string,
  transactionAmount: number
): number => {
  // Define reward rates for different transaction types
  const rewardRates = {
    transfer: 0.005, // 0.5%
    bill_payment: 0.01, // 1%
    card_usage: 0.01, // 1%
    savings: 0.0025, // 0.25%
    referral: 500, // Fixed amount
  };

  // For referrals, return fixed amount
  if (transactionType === "referral") {
    return rewardRates.referral;
  }

  // For other transaction types, calculate percentage
  const rate = rewardRates[transactionType] || 0;
  return Math.round(transactionAmount * rate * 100) / 100; // Round to 2 decimal places
};

/**
 * Determines user's reward tier based on lifetime earnings
 */
export const determineRewardTier = (lifetimeEarned: number): {
  tier: "bronze" | "silver" | "gold" | "platinum";
  nextTierProgress: number;
} => {
  // Define tier thresholds
  const tiers = {
    bronze: 0,
    silver: 5000, // ₦5,000
    gold: 20000, // ₦20,000
    platinum: 50000, // ₦50,000
  };

  if (lifetimeEarned >= tiers.platinum) {
    return { tier: "platinum", nextTierProgress: 100 };
  } else if (lifetimeEarned >= tiers.gold) {
    const progress = ((lifetimeEarned - tiers.gold) / (tiers.platinum - tiers.gold)) * 100;
    return { tier: "gold", nextTierProgress: Math.min(Math.round(progress), 99) };
  } else if (lifetimeEarned >= tiers.silver) {
    const progress = ((lifetimeEarned - tiers.silver) / (tiers.gold - tiers.silver)) * 100;
    return { tier: "silver", nextTierProgress: Math.min(Math.round(progress), 99) };
  } else {
    const progress = (lifetimeEarned / tiers.silver) * 100;
    return { tier: "bronze", nextTierProgress: Math.min(Math.round(progress), 99) };
  }
};

/**
 * Creates a reward for a transaction
 */
export const createRewardForTransaction = async (
  transaction: ITransaction,
  rewardType: "transfer" | "bill_payment" | "card_usage" | "savings" | "referral"
): Promise<void> => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Calculate reward amount
      const rewardAmount = calculateRewardAmount(rewardType, transaction.amount);

      if (rewardAmount <= 0) {
        await session.abortTransaction();
        session.endSession();
        return;
      }

      // Create reward record
      const reward = new Reward({
        userId: transaction.userId,
        transactionId: transaction._id,
        type: rewardType,
        amount: rewardAmount,
        status: "credited",
      });

      await reward.save({ session });

      // Update user's rewards balance
      const rewardsBalance = await RewardsBalance.findOneAndUpdate(
        { userId: transaction.userId },
        {
          $inc: {
            availableBalance: rewardAmount,
            lifetimeEarned: rewardAmount,
          },
        },
        { 
          new: true, 
          upsert: true,
          session 
        }
      );

      // Update user's tier based on lifetime earnings
      const { tier, nextTierProgress } = determineRewardTier(rewardsBalance.lifetimeEarned);
      
      await RewardsBalance.updateOne(
        { userId: transaction.userId },
        {
          tier,
          nextTierProgress,
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      logger.info(`Reward created for transaction ${transaction._id}`, {
        userId: transaction.userId,
        transactionId: transaction._id,
        rewardAmount,
        rewardType,
      });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    logger.error("Error creating reward for transaction", {
      error,
      transactionId: transaction._id,
      userId: transaction.userId,
    });
  }
};

/**
 * Redeems rewards to user's wallet or other methods
 */
export const redeemRewards = async (
  userId: mongoose.Types.ObjectId,
  amount: number,
  method: "wallet_credit" | "bank_transfer" | "airtime" | "bill_payment" | "card_funding"
): Promise<{ success: boolean; message: string; redemption?: any }> => {
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Check if user has sufficient rewards balance
      const rewardsBalance = await RewardsBalance.findOne({ userId });
      
      if (!rewardsBalance) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, message: "No rewards balance found for user" };
      }

      if (rewardsBalance.availableBalance < amount) {
        await session.abortTransaction();
        session.endSession();
        return { success: false, message: "Insufficient rewards balance" };
      }

      // Create redemption record
      const redemption = new RewardsRedemption({
        userId,
        amount,
        method,
        reference: generateReference("RDM"),
      });

      await redemption.save({ session });

      // Update rewards balance
      await RewardsBalance.updateOne(
        { userId },
        {
          $inc: {
            availableBalance: -amount,
            lifetimeRedeemed: amount,
          },
        },
        { session }
      );

      // Process redemption based on method
      // Note: Actual implementation would call appropriate services
      // for each redemption method (wallet service, bank transfer service, etc.)

      await session.commitTransaction();
      session.endSession();

      logger.info(`Rewards redeemed successfully`, {
        userId,
        amount,
        method,
        redemptionId: redemption._id,
      });

      return {
        success: true,
        message: "Rewards redeemed successfully",
        redemption,
      };
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    logger.error("Error redeeming rewards", {
      error,
      userId,
      amount,
      method,
    });
    return { success: false, message: "Error redeeming rewards" };
  }
};

/**
 * Gets user's rewards balance and history
 */
export const getUserRewardsInfo = async (
  userId: mongoose.Types.ObjectId
): Promise<{
  balance: any;
  recentRewards: any[];
  recentRedemptions: any[];
}> => {
  try {
    // Get user's rewards balance
    const balance = await RewardsBalance.findOne({ userId });
    
    if (!balance) {
      // Create default balance if none exists
      const newBalance = new RewardsBalance({ userId });
      await newBalance.save();
      
      return {
        balance: newBalance,
        recentRewards: [],
        recentRedemptions: [],
      };
    }

    // Get recent rewards
    const recentRewards = await Reward.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent redemptions
    const recentRedemptions = await RewardsRedemption.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      balance,
      recentRewards,
      recentRedemptions,
    };
  } catch (error) {
    logger.error("Error getting user rewards info", {
      error,
      userId,
    });
    throw error;
  }
};
