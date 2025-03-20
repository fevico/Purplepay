import { NextFunction, Request, Response } from "express";
import { createRewardForTransaction } from "../services/rewards";
import { logger } from "../utils/logger";
import mongoose from "mongoose";
import transactionModel from "../model/transaction";

/**
 * Middleware to handle rewards for virtual card transactions
 * This should be added after virtual card endpoints that involve transactions
 */
export const handleVirtualCardRewards = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only process if the response was successful
    if (res.statusCode >= 200 && res.statusCode < 300 && res.locals.cardTransaction) {
      const cardTransaction = res.locals.cardTransaction;
      
      // Create a transaction record for the card transaction
      const transaction = new transactionModel({
        userId: req.user.id,
        type: "card_transaction",
        amount: cardTransaction.amount,
        currency: cardTransaction.currency || "NGN",
        status: "completed",
        reference: cardTransaction.reference || `CARD-${Date.now()}`,
        description: cardTransaction.description || "Virtual card transaction",
        metadata: {
          cardId: cardTransaction.cardId,
          merchantName: cardTransaction.merchantName,
          source: "card"
        }
      });
      
      await transaction.save();
      
      // Create reward for the transaction
      await createRewardForTransaction(transaction, "card_usage");
      
      logger.info(`Reward created for card transaction`, {
        transactionId: transaction._id,
        userId: transaction.userId,
        cardId: cardTransaction.cardId,
      });
    }
  } catch (error) {
    // Log error but don't block the response
    logger.error("Error processing virtual card rewards", { error });
  }
  
  // Always continue to the next middleware
  next();
};

/**
 * Middleware to capture card funding as a transaction
 */
export const handleCardFunding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only process if the response was successful
    if (res.statusCode >= 200 && res.statusCode < 300 && res.locals.fundingData) {
      const fundingData = res.locals.fundingData;
      
      // Create a transaction record for the funding
      const transaction = new transactionModel({
        userId: req.user.id,
        type: "funding",
        amount: fundingData.amount,
        currency: fundingData.currency || "NGN",
        status: "completed",
        reference: fundingData.reference || `FUND-${Date.now()}`,
        description: "Virtual card funding",
        metadata: {
          cardId: fundingData.cardId,
          source: "wallet"
        }
      });
      
      await transaction.save();
      
      // No rewards for funding, but we track the transaction
      logger.info(`Transaction created for card funding`, {
        transactionId: transaction._id,
        userId: transaction.userId,
        cardId: fundingData.cardId,
      });
    }
  } catch (error) {
    // Log error but don't block the response
    logger.error("Error processing card funding transaction", { error });
  }
  
  // Always continue to the next middleware
  next();
};

/**
 * Middleware to capture card withdrawal as a transaction
 */
export const handleCardWithdrawal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only process if the response was successful
    if (res.statusCode >= 200 && res.statusCode < 300 && res.locals.withdrawalData) {
      const withdrawalData = res.locals.withdrawalData;
      
      // Create a transaction record for the withdrawal
      const transaction = new transactionModel({
        userId: req.user.id,
        type: "withdrawal",
        amount: withdrawalData.amount,
        currency: withdrawalData.currency || "NGN",
        status: "completed",
        reference: withdrawalData.reference || `WDRW-${Date.now()}`,
        description: "Virtual card withdrawal",
        metadata: {
          cardId: withdrawalData.cardId,
          destination: "wallet"
        }
      });
      
      await transaction.save();
      
      logger.info(`Transaction created for card withdrawal`, {
        transactionId: transaction._id,
        userId: transaction.userId,
        cardId: withdrawalData.cardId,
      });
    }
  } catch (error) {
    // Log error but don't block the response
    logger.error("Error processing card withdrawal transaction", { error });
  }
  
  // Always continue to the next middleware
  next();
};
