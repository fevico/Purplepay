import { NextFunction, Request, Response } from "express";
import { createRewardForTransaction } from "../services/rewards";
import { logger } from "../utils/logger";
import mongoose from "mongoose";

/**
 * Middleware to handle rewards for completed transactions
 * This should be added after transaction creation/update endpoints
 */
export const handleTransactionRewards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only process if the transaction was successful and in the response
    if (res.locals.transaction && res.locals.transaction.status === "completed") {
      const transaction = res.locals.transaction;
      
      // Determine reward type based on transaction type
      let rewardType: "transfer" | "bill_payment" | "card_usage" | "savings" | "referral" | null = null;
      
      switch (transaction.type) {
        case "transfer":
          rewardType = "transfer";
          break;
        case "bill_payment":
          rewardType = "bill_payment";
          break;
        case "funding":
          // Only certain funding types might qualify for rewards
          if (transaction.metadata && transaction.metadata.source === "savings") {
            rewardType = "savings";
          }
          break;
        case "other":
          // Check metadata for card usage
          if (transaction.metadata && transaction.metadata.source === "card") {
            rewardType = "card_usage";
          }
          break;
        default:
          // No rewards for this transaction type
          break;
      }
      
      // If we have a valid reward type, create the reward
      if (rewardType) {
        await createRewardForTransaction(transaction, rewardType);
        logger.info(`Reward created for transaction ${transaction._id}`, {
          transactionId: transaction._id,
          userId: transaction.userId,
          rewardType,
        });
      }
    }
  } catch (error) {
    // Log error but don't block the response
    logger.error("Error processing transaction rewards", { error });
  }
  
  // Always continue to the next middleware
  next();
};
