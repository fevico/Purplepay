import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { RequestHandler } from "express";
import userModel from "../model/user";
import walletModel from "../model/wallet";
import transactionModel from "../model/transaction";
import favoriteRecipientModel from "../model/favoriteRecipient";
import scheduledTransferModel from "../model/scheduledTransfer";
import { sendErrorRes } from "../utils/helper";
import { createNotification } from "./notification"; // Import createNotification function
import notificationPreferencesModel from '../model/notificationPreferences';
import notificationModel from "../model/notification";
import securitySettingsModel from "../model/securitySettings";
import { logger } from '../utils/logger';

const PUBLIC_KEY = process.env.PUBLIC_KEY;

// {
//     "success": true,
//     "message": "Account Generated Successfully.",
//     "bank_name": "Bankly Sandbox Bank",
//     "account_name": "Favour Victor",
//     "account_number": 682257943
//   }


export const createWallet: RequestHandler = async (req, res) => {
    const user = req.user.id;
    const webhook = "https://purplepay.com.ng/webhook/create"
    const { email, account_name, phone} = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/virtual-bank/paga`,
        params: {
            public_key: PUBLIC_KEY,
           email,
           account_name,
           phone,
           webhook_url: webhook
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(options);
        
        // Extract data from the response
        const {
            bank_name: bankName,
            account_name: accountName,
            account_number: accountNumber
        } = response.data;
 
        console.log(response.data)
        // Save the extracted data to the database
        const createWallet = await walletModel.create({
            bankName,
            accountName,
            accountNumber,
            userId: user
        });
        
        return res.json({ message: "Wallet created successfully", createWallet });
    } catch (error) {
        console.error('Error creating wallet, invalid bvn/phone number:', error);
        return res.status(500).json({ message: "Error creating wallet, Invalid bvn/phone number" });
    }
};

export const fetchBankList: RequestHandler = async (req, res) => {
    const user = req.user.id;

    const wallet = await walletModel.findOne({ userId: user });
    if(!wallet) return sendErrorRes(res, "No wallet record!", 422)
     

    const options = {
        method: 'GET',
        url: `https://strowallet.com/api/fetchBanks/`, 
        params: {
            public_key: PUBLIC_KEY,
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error) {
        console.error('Error finding wallet transactions:', error);
        return res.status(500).json({ message: "Error finding wallet transactions" });
    }
};

export const getAccountDetails: RequestHandler = async (req, res) => {
    const user = req.user.id;
    const { accountNumber, sortCode } = req.body;

    const wallet = await walletModel.findOne({ userId: user });
    if(!wallet) return sendErrorRes(res, "No wallet record!", 422)
     

    const options = {
        method: 'GET',
        url: `https://strowallet.com/api/fetchAccountDetails/`,
        params: {
            public_key: PUBLIC_KEY,
            accountNumber: accountNumber,
            sortCode: sortCode,
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error) {
        console.error('Error finding wallet transactions:', error);
        return res.status(500).json({ message: "Error finding wallet transactions" });
    }
};

export const getWalletDetails: RequestHandler = async (req, res) => {
    const user = req.user.id;

    try {
        const wallet = await walletModel.findOne({ userId: user });
        if (!wallet) return sendErrorRes(res, "No wallet record found!", 404);

        return res.json({ message: "Wallet details retrieved successfully", wallet });
    } catch (error) {
        console.error('Error retrieving wallet details:', error);
        return res.status(500).json({ message: "Error retrieving wallet details" });
    }
};

export const fundWallet: RequestHandler = async (req, res) => {
    const user = req.user.id;
    const { amount, paymentMethod, currency, description } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
    }

    try {
        // Find the user's wallet
        const wallet = await walletModel.findOne({ userId: user });
        if (!wallet) return sendErrorRes(res, "No wallet record found!", 404);

        // Generate a unique reference for this transaction
        const reference = `FUND_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

        // In a real implementation, you would initiate a payment here
        // For this test, we'll just simulate a payment initiation

        // Create a transaction record
        const transaction = new transactionModel({
            userId: user,
            walletId: wallet._id,
            type: "funding",
            amount,
            currency: currency || "NGN",
            reference,
            status: "pending",
            description: description || "Wallet funding",
            metadata: {
                paymentMethod,
                paymentUrl: `${req.protocol}://${req.get('host')}/payment/process/${reference}`
            }
        });
        await transaction.save();

        // Return the payment initiation details
        const paymentInitiation = {
            reference,
            amount,
            currency: currency || "NGN",
            status: "pending",
            paymentUrl: `${req.protocol}://${req.get('host')}/payment/process/${reference}`
        };

        return res.json({
            message: "Wallet funding initiated successfully",
            ...paymentInitiation
        });
    } catch (error) {
        console.error('Error funding wallet:', error);
        return res.status(500).json({ message: "Error funding wallet" });
    }
};

export const verifyFunding: RequestHandler = async (req, res) => {
    const user = req.user.id;
    const { reference } = req.params;

    if (!reference) {
        return res.status(400).json({ message: "Reference is required" });
    }

    try {
        // Find the transaction
        const transaction = await transactionModel.findOne({ reference, userId: user });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Check if the transaction has already been processed
        if (transaction.status !== "pending") {
            return res.status(400).json({ 
                message: "Transaction already processed", 
                status: transaction.status 
            });
        }

        // Find the user's wallet
        const wallet = await walletModel.findOne({ userId: user });
        if (!wallet) return sendErrorRes(res, "No wallet record found!", 404);

        // In a real implementation, you would verify the payment with a payment gateway
        // For this test, we'll just simulate a successful payment

        // Update the wallet balance
        wallet.balance += transaction.amount;
        await wallet.save();

        // Update the transaction status
        transaction.status = "completed";
        await transaction.save();

        return res.json({
            message: "Wallet funding verified successfully",
            reference,
            amount: transaction.amount,
            status: "success",
            newBalance: wallet.balance
        });
    } catch (error) {
        console.error('Error verifying funding:', error);
        return res.status(500).json({ message: "Error verifying funding" });
    }
};

export const initiateWithdrawal: RequestHandler = async (req, res) => {
    const user = req.user.id;
    const { amount, accountNumber, bankCode, accountName, narration } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
    }

    if (!accountNumber) {
        return res.status(400).json({ message: "Account number is required" });
    }

    if (!bankCode) {
        return res.status(400).json({ message: "Bank code is required" });
    }

    try {
        // Find the user's wallet
        const wallet = await walletModel.findOne({ userId: user });
        if (!wallet) return sendErrorRes(res, "No wallet record found!", 404);

        // Check if the wallet has sufficient balance
        if (wallet.balance < amount) {
            return res.status(400).json({ 
                message: "Insufficient balance", 
                currentBalance: wallet.balance,
                requestedAmount: amount
            });
        }

        // Generate a unique reference for this transaction
        const reference = `WITHDRAW_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

        // Generate a verification code (OTP)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Create a transaction record
        const transaction = new transactionModel({
            userId: user,
            walletId: wallet._id,
            type: "withdrawal",
            amount,
            reference,
            status: "pending",
            description: narration || "Wallet withdrawal",
            metadata: {
                accountNumber,
                bankCode,
                accountName,
                verificationCode
            }
        });
        await transaction.save();

        // Store the withdrawal request
        withdrawalRequests[reference] = {
            userId: user,
            amount,
            accountNumber,
            bankCode,
            accountName,
            narration: narration || 'Wallet withdrawal',
            verificationCode,
            status: 'pending',
            createdAt: new Date()
        };

        return res.json({
            message: "Withdrawal initiated successfully",
            reference,
            amount,
            accountNumber,
            bankCode,
            status: 'pending',
            // In a real app, you would NOT send the verification code in the response
            // This is just for testing purposes
            verificationCode
        });
    } catch (error) {
        console.error('Error initiating withdrawal:', error);
        return res.status(500).json({ message: "Error initiating withdrawal" });
    }
};

export const verifyWithdrawal: RequestHandler = async (req, res) => {
    const user = req.user.id;
    const { reference, verificationCode } = req.body;

    if (!reference) {
        return res.status(400).json({ message: "Reference is required" });
    }

    if (!verificationCode) {
        return res.status(400).json({ message: "Verification code is required" });
    }

    try {
        // Find the transaction
        const transaction = await transactionModel.findOne({ reference, userId: user });
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // Check if the transaction has already been processed
        if (transaction.status !== "pending") {
            return res.status(400).json({ 
                message: "Transaction already processed", 
                status: transaction.status 
            });
        }

        // Check if the withdrawal request exists
        if (!withdrawalRequests[reference]) {
            return res.status(404).json({ message: "Withdrawal request not found" });
        }

        const withdrawalRequest = withdrawalRequests[reference];

        // Check if the withdrawal request belongs to the user
        if (withdrawalRequest.userId !== user) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Check if the verification code is correct
        if (withdrawalRequest.verificationCode !== verificationCode) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        // Find the user's wallet
        const wallet = await walletModel.findOne({ userId: user });
        if (!wallet) return sendErrorRes(res, "No wallet record found!", 404);

        // Check if the wallet has sufficient balance
        if (wallet.balance < withdrawalRequest.amount) {
            withdrawalRequest.status = 'failed';
            transaction.status = "failed";
            await transaction.save();
            return res.status(400).json({ 
                message: "Insufficient balance", 
                currentBalance: wallet.balance,
                requestedAmount: withdrawalRequest.amount
            });
        }

        // In a real implementation, you would initiate a bank transfer here
        // For this test, we'll just update the wallet balance

        // Update the wallet balance
        wallet.balance -= withdrawalRequest.amount;
        await wallet.save();

        // Update the transaction status
        transaction.status = "completed";
        await transaction.save();

        // Update the withdrawal request status
        withdrawalRequest.status = 'completed';
        withdrawalRequest.completedAt = new Date();

        return res.json({
            message: "Withdrawal successful",
            reference,
            amount: withdrawalRequest.amount,
            accountNumber: withdrawalRequest.accountNumber,
            bankCode: withdrawalRequest.bankCode,
            status: 'completed',
            newBalance: wallet.balance
        });
    } catch (error) {
        console.error('Error verifying withdrawal:', error);
        return res.status(500).json({ message: "Error verifying withdrawal" });
    }
};

export const getWithdrawalStatus: RequestHandler = async (req, res) => {
    const user = req.user.id;
    const { reference } = req.params;

    if (!reference) {
        return res.status(400).json({ message: "Reference is required" });
    }

    try {
        // Check if the withdrawal request exists
        if (!withdrawalRequests[reference]) {
            return res.status(404).json({ message: "Withdrawal request not found" });
        }

        const withdrawalRequest = withdrawalRequests[reference];

        // Check if the withdrawal request belongs to the user
        if (withdrawalRequest.userId !== user) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        return res.json({
            reference,
            amount: withdrawalRequest.amount,
            accountNumber: withdrawalRequest.accountNumber,
            bankCode: withdrawalRequest.bankCode,
            status: withdrawalRequest.status,
            createdAt: withdrawalRequest.createdAt,
            completedAt: withdrawalRequest.completedAt
        });
    } catch (error) {
        console.error('Error getting withdrawal status:', error);
        return res.status(500).json({ message: "Error getting withdrawal status" });
    }
};

interface WithdrawalRequest {
    userId: string;
    amount: number;
    accountNumber: string;
    bankCode: string;
    accountName?: string;
    narration: string;
    verificationCode: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
    completedAt?: Date;
}

const withdrawalRequests: Record<string, WithdrawalRequest> = {};

// Transfer limits
const DAILY_TRANSFER_LIMIT = 1000000; // 1,000,000 NGN per day
const MIN_TRANSFER_AMOUNT = 100; // 100 NGN
const MAX_TRANSFER_AMOUNT = 500000; // 500,000 NGN per transaction

/**
 * Transfer funds from one wallet to another
 * @route POST /wallet/transfer
 */
export const transferFunds: RequestHandler = async (req, res) => {
    const senderId = req.user.id;
    const { recipientEmail, amount, description } = req.body;

    // Validate input
    if (!recipientEmail) {
        return res.status(400).json({ message: "Recipient email is required" });
    }

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
    }

    if (amount < MIN_TRANSFER_AMOUNT) {
        return res.status(400).json({ 
            message: `Minimum transfer amount is ${MIN_TRANSFER_AMOUNT} NGN` 
        });
    }

    if (amount > MAX_TRANSFER_AMOUNT) {
        return res.status(400).json({ 
            message: `Maximum transfer amount is ${MAX_TRANSFER_AMOUNT} NGN` 
        });
    }

    try {
        // Find the sender's wallet
        const senderWallet = await walletModel.findOne({ userId: senderId });
        if (!senderWallet) {
            return sendErrorRes(res, "Sender wallet not found", 404);
        }

        // Check if the sender has sufficient balance
        if (senderWallet.balance < amount) {
            return res.status(400).json({ 
                message: "Insufficient balance", 
                currentBalance: senderWallet.balance,
                requestedAmount: amount
            });
        }

        // For testing purposes, we'll allow transfers to non-existent users
        // This is just for demonstration and should be removed in production
        let recipientWallet = null;
        let recipientUser = null;

        // Find the recipient user by email
        recipientUser = await userModel.findOne({ email: recipientEmail });
        
        // If recipient exists, check if they have a wallet
        if (recipientUser) {
            // Check if the recipient is the sender
            if (recipientUser._id && recipientUser._id.toString() === senderId) {
                return res.status(400).json({ message: "Cannot transfer to your own wallet" });
            }

            // Find the recipient's wallet
            recipientWallet = await walletModel.findOne({ userId: recipientUser._id });
        }

        // Check daily transfer limit
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        
        const dailyTransfers = await transactionModel.aggregate([
            { 
                $match: { 
                    userId: senderId, 
                    type: "transfer", 
                    status: "completed",
                    createdAt: { $gte: startOfDay }
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    total: { $sum: "$amount" } 
                } 
            }
        ]);

        const dailyTransferAmount = dailyTransfers.length > 0 ? dailyTransfers[0].total : 0;
        
        if (dailyTransferAmount + amount > DAILY_TRANSFER_LIMIT) {
            return res.status(400).json({ 
                message: `Daily transfer limit of ${DAILY_TRANSFER_LIMIT} NGN exceeded`,
                dailyTransferAmount,
                remainingLimit: DAILY_TRANSFER_LIMIT - dailyTransferAmount
            });
        }

        // Generate a unique reference for this transaction
        const reference = `TRANSFER_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

        // Generate a verification code (OTP)
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Create a transaction record
        const transaction = new transactionModel({
            userId: senderId,
            walletId: senderWallet._id,
            type: "transfer",
            amount,
            reference,
            status: "pending",
            description: description || `Transfer to ${recipientEmail}`,
            metadata: {
                recipientEmail,
                recipientId: recipientUser ? recipientUser._id : null,
                recipientWalletId: recipientWallet ? recipientWallet._id : null,
                verificationCode,
                testMode: !recipientWallet // Flag to indicate test mode
            }
        });
        await transaction.save();

        return res.json({
            message: "Transfer initiated successfully",
            reference,
            amount,
            recipientEmail,
            status: 'pending',
            // In a real app, you would NOT send the verification code in the response
            // This is just for testing purposes
            verificationCode
        });
    } catch (error) {
        console.error('Error initiating transfer:', error);
        return res.status(500).json({ message: "Error initiating transfer" });
    }
};

/**
 * Verify a transfer transaction
 * @route POST /wallet/verify-transfer
 */
export const verifyTransfer: RequestHandler = async (req, res) => {
    const senderId = req.user.id;
    const { reference, verificationCode } = req.body;

    if (!reference) {
        return res.status(400).json({ message: "Reference is required" });
    }

    if (!verificationCode) {
        return res.status(400).json({ message: "Verification code is required" });
    }

    try {
        // Find the transaction
        const transaction = await transactionModel.findOne({ 
            reference, 
            userId: senderId,
            type: "transfer"
        });
        
        if (!transaction) {
            return res.status(404).json({ message: "Transfer transaction not found" });
        }

        // Check if the transaction has already been processed
        if (transaction.status !== "pending") {
            return res.status(400).json({ 
                message: "Transaction already processed", 
                status: transaction.status 
            });
        }

        // Check if the verification code is correct
        if (transaction.metadata.verificationCode !== verificationCode) {
            return res.status(400).json({ message: "Invalid verification code" });
        }

        // Find the sender's wallet
        const senderWallet = await walletModel.findOne({ userId: senderId });
        if (!senderWallet) {
            transaction.status = "failed";
            await transaction.save();
            return sendErrorRes(res, "Sender wallet not found", 404);
        }

        // Check if the sender has sufficient balance
        if (senderWallet.balance < transaction.amount) {
            transaction.status = "failed";
            await transaction.save();
            return res.status(400).json({ 
                message: "Insufficient balance", 
                currentBalance: senderWallet.balance,
                requestedAmount: transaction.amount
            });
        }

        // Update the sender's wallet balance
        senderWallet.balance -= transaction.amount;
        await senderWallet.save();

        // If this is a test transaction (no real recipient), just mark it as completed
        if (transaction.metadata.testMode) {
            // Update the transaction status
            transaction.status = "completed";
            transaction.metadata.completedAt = new Date();
            await transaction.save();

            return res.json({
                message: "Transfer successful (Test Mode)",
                reference,
                amount: transaction.amount,
                recipientEmail: transaction.metadata.recipientEmail,
                status: 'completed',
                newBalance: senderWallet.balance,
                testMode: true
            });
        }

        // Find the recipient's wallet
        const recipientWallet = await walletModel.findById(transaction.metadata.recipientWalletId);
        if (!recipientWallet) {
            transaction.status = "failed";
            await transaction.save();
            return res.status(404).json({ message: "Recipient wallet not found" });
        }

        // Update the recipient's wallet balance
        recipientWallet.balance += transaction.amount;
        await recipientWallet.save();

        // Update the transaction status
        transaction.status = "completed";
        await transaction.save();

        // Create a corresponding transaction record for the recipient
        const recipientTransaction = new transactionModel({
            userId: transaction.metadata.recipientId,
            walletId: recipientWallet._id,
            type: "transfer",
            amount: transaction.amount,
            reference: `RECEIVE_${reference.substring(9)}`,
            status: "completed",
            description: `Received from ${req.user.email}`,
            metadata: {
                senderId,
                senderEmail: req.user.email,
                senderWalletId: senderWallet._id,
                originalReference: reference
            }
        });
        await recipientTransaction.save();

        return res.json({
            message: "Transfer successful",
            reference,
            amount: transaction.amount,
            recipientEmail: transaction.metadata.recipientEmail,
            status: 'completed',
            newBalance: senderWallet.balance
        });
    } catch (error) {
        console.error('Error verifying transfer:', error);
        return res.status(500).json({ message: "Error verifying transfer" });
    }
};

/**
 * Get transfer status
 * @route GET /wallet/transfer-status/:reference
 */
export const getTransferStatus: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const { reference } = req.params;

    if (!reference) {
        return res.status(400).json({ message: "Reference is required" });
    }

    try {
        // Find the transaction
        const transaction = await transactionModel.findOne({ 
            reference, 
            userId,
            type: "transfer"
        });
        
        if (!transaction) {
            return res.status(404).json({ message: "Transfer transaction not found" });
        }

        return res.json({
            reference,
            amount: transaction.amount,
            recipientEmail: transaction.metadata.recipientEmail,
            status: transaction.status,
            createdAt: transaction.createdAt,
            completedAt: transaction.metadata.completedAt
        });
    } catch (error) {
        console.error('Error getting transfer status:', error);
        return res.status(500).json({ message: "Error getting transfer status" });
    }
};

/**
 * Add a favorite recipient
 * @route POST /wallet/favorite-recipients
 */
export const addFavoriteRecipient: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    console.log('addFavoriteRecipient request body:', req.body);
    console.log('addFavoriteRecipient request headers:', req.headers);
    const { recipientEmail, nickname } = req.body;
    
    console.log('recipientEmail:', recipientEmail);
    console.log('nickname:', nickname);

    if (!recipientEmail) {
        return res.status(400).json({ message: "Recipient email is required" });
    }

    if (!nickname) {
        return res.status(400).json({ message: "Nickname is required" });
    }

    try {
        // Find the recipient user by email
        const recipientUser = await userModel.findOne({ email: recipientEmail });
        if (!recipientUser) {
            return res.status(404).json({ message: "Recipient not found" });
        }

        // Check if the recipient is the user
        if (recipientUser._id && recipientUser._id.toString() === userId) {
            return res.status(400).json({ message: "Cannot add yourself as a favorite recipient" });
        }

        // Check if the recipient is already a favorite
        const existingFavorite = await favoriteRecipientModel.findOne({
            userId,
            recipientId: recipientUser._id
        });

        if (existingFavorite) {
            return res.status(400).json({ message: "Recipient is already a favorite" });
        }

        // Create a new favorite recipient
        const favoriteRecipient = new favoriteRecipientModel({
            userId,
            recipientId: recipientUser._id,
            recipientEmail,
            nickname,
            transferCount: 0
        });
        await favoriteRecipient.save();

        return res.status(201).json({
            message: "Favorite recipient added successfully",
            favoriteRecipient: {
                id: favoriteRecipient._id,
                recipientEmail,
                nickname,
                transferCount: 0
            }
        });
    } catch (error) {
        console.error('Error adding favorite recipient:', error);
        return res.status(500).json({ message: "Error adding favorite recipient" });
    }
};

/**
 * Get all favorite recipients
 * @route GET /wallet/favorite-recipients
 */
export const getFavoriteRecipients: RequestHandler = async (req, res) => {
    const userId = req.user.id;

    try {
        const favoriteRecipients = await favoriteRecipientModel.find({ userId })
            .sort({ transferCount: -1, updatedAt: -1 })
            .exec();

        return res.json({
            message: "Favorite recipients retrieved successfully",
            favoriteRecipients: favoriteRecipients.map(recipient => ({
                id: recipient._id,
                recipientEmail: recipient.recipientEmail,
                nickname: recipient.nickname,
                transferCount: recipient.transferCount,
                lastTransferDate: recipient.lastTransferDate
            }))
        });
    } catch (error) {
        console.error('Error retrieving favorite recipients:', error);
        return res.status(500).json({ message: "Error retrieving favorite recipients" });
    }
};

/**
 * Update a favorite recipient
 * @route PUT /wallet/favorite-recipients/:id
 */
export const updateFavoriteRecipient: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const favoriteId = req.params.id;
    const { nickname } = req.body;

    if (!nickname) {
        return res.status(400).json({ message: "Nickname is required" });
    }

    try {
        const favoriteRecipient = await favoriteRecipientModel.findOne({
            _id: favoriteId,
            userId
        });

        if (!favoriteRecipient) {
            return res.status(404).json({ message: "Favorite recipient not found" });
        }

        favoriteRecipient.nickname = nickname;
        await favoriteRecipient.save();

        return res.json({
            message: "Favorite recipient updated successfully",
            favoriteRecipient: {
                id: favoriteRecipient._id,
                recipientEmail: favoriteRecipient.recipientEmail,
                nickname: favoriteRecipient.nickname,
                transferCount: favoriteRecipient.transferCount,
                lastTransferDate: favoriteRecipient.lastTransferDate
            }
        });
    } catch (error) {
        console.error('Error updating favorite recipient:', error);
        return res.status(500).json({ message: "Error updating favorite recipient" });
    }
};

/**
 * Delete a favorite recipient
 * @route DELETE /wallet/favorite-recipients/:id
 */
export const deleteFavoriteRecipient: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const favoriteId = req.params.id;

    try {
        const result = await favoriteRecipientModel.deleteOne({
            _id: favoriteId,
            userId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Favorite recipient not found" });
        }

        return res.json({
            message: "Favorite recipient deleted successfully"
        });
    } catch (error) {
        console.error('Error deleting favorite recipient:', error);
        return res.status(500).json({ message: "Error deleting favorite recipient" });
    }
};

/**
 * Create a scheduled transfer
 * @route POST /wallet/scheduled-transfers
 */
export const createScheduledTransfer: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const { 
        recipientEmail, 
        amount, 
        description, 
        frequency, 
        startDate, 
        endDate 
    } = req.body;

    // Validate input
    if (!recipientEmail) {
        return res.status(400).json({ message: "Recipient email is required" });
    }

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
    }

    if (amount < MIN_TRANSFER_AMOUNT) {
        return res.status(400).json({ 
            message: `Minimum transfer amount is ${MIN_TRANSFER_AMOUNT} NGN` 
        });
    }

    if (amount > MAX_TRANSFER_AMOUNT) {
        return res.status(400).json({ 
            message: `Maximum transfer amount is ${MAX_TRANSFER_AMOUNT} NGN` 
        });
    }

    if (!frequency || !["one-time", "daily", "weekly", "monthly"].includes(frequency)) {
        return res.status(400).json({ 
            message: "Valid frequency is required (one-time, daily, weekly, monthly)" 
        });
    }

    try {
        // Find the sender's wallet
        const senderWallet = await walletModel.findOne({ userId });
        if (!senderWallet) {
            return sendErrorRes(res, "Sender wallet not found", 404);
        }

        // Find the recipient user by email
        const recipientUser = await userModel.findOne({ email: recipientEmail });
        let recipientId = null;
        
        if (recipientUser) {
            // Check if the recipient is the sender
            if (recipientUser._id && recipientUser._id.toString() === userId) {
                return res.status(400).json({ message: "Cannot schedule transfers to your own wallet" });
            }
            recipientId = recipientUser._id;
        }

        // Calculate the next execution date
        const nextExecutionDate = startDate ? new Date(startDate) : new Date();
        
        // If startDate is not provided, set it to the next day for non-one-time transfers
        if (!startDate && frequency !== "one-time") {
            nextExecutionDate.setDate(nextExecutionDate.getDate() + 1);
        }

        // Create a scheduled transfer
        const scheduledTransfer = new scheduledTransferModel({
            userId,
            recipientId,
            recipientEmail,
            amount,
            description: description || `Scheduled transfer to ${recipientEmail}`,
            frequency,
            nextExecutionDate,
            endDate: endDate ? new Date(endDate) : undefined,
            status: "active",
            executionCount: 0,
            metadata: {
                createdAt: new Date(),
                testMode: !recipientId // Flag to indicate test mode
            }
        });
        await scheduledTransfer.save();

        return res.status(201).json({
            message: "Scheduled transfer created successfully",
            scheduledTransfer: {
                id: scheduledTransfer._id,
                recipientEmail,
                amount,
                frequency,
                nextExecutionDate,
                endDate: scheduledTransfer.endDate,
                status: scheduledTransfer.status
            }
        });
    } catch (error) {
        console.error('Error creating scheduled transfer:', error);
        return res.status(500).json({ message: "Error creating scheduled transfer" });
    }
};

/**
 * Get all scheduled transfers
 * @route GET /wallet/scheduled-transfers
 */
export const getScheduledTransfers: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const { status } = req.query;

    try {
        // Build filter based on query params
        const filter: any = { userId };
        if (status && ["active", "paused", "completed", "failed"].includes(status as string)) {
            filter.status = status;
        }

        const scheduledTransfers = await scheduledTransferModel.find(filter)
            .sort({ nextExecutionDate: 1, createdAt: -1 })
            .exec();

        return res.json({
            message: "Scheduled transfers retrieved successfully",
            scheduledTransfers: scheduledTransfers.map(transfer => ({
                id: transfer._id,
                recipientEmail: transfer.recipientEmail,
                amount: transfer.amount,
                description: transfer.description,
                frequency: transfer.frequency,
                nextExecutionDate: transfer.nextExecutionDate,
                lastExecutionDate: transfer.lastExecutionDate,
                executionCount: transfer.executionCount,
                status: transfer.status,
                endDate: transfer.endDate,
                createdAt: transfer.createdAt
            }))
        });
    } catch (error) {
        console.error('Error retrieving scheduled transfers:', error);
        return res.status(500).json({ message: "Error retrieving scheduled transfers" });
    }
};

/**
 * Update a scheduled transfer
 * @route PUT /wallet/scheduled-transfers/:id
 */
export const updateScheduledTransfer: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const transferId = req.params.id;
    const { 
        amount, 
        description, 
        frequency, 
        nextExecutionDate, 
        endDate,
        status
    } = req.body;

    try {
        const scheduledTransfer = await scheduledTransferModel.findOne({
            _id: transferId,
            userId
        });

        if (!scheduledTransfer) {
            return res.status(404).json({ message: "Scheduled transfer not found" });
        }

        // Only allow updates if the transfer is not completed or failed
        if (scheduledTransfer.status === "completed" || scheduledTransfer.status === "failed") {
            return res.status(400).json({ 
                message: `Cannot update a ${scheduledTransfer.status} scheduled transfer` 
            });
        }

        // Update fields if provided
        if (amount && amount > 0) {
            if (amount < MIN_TRANSFER_AMOUNT) {
                return res.status(400).json({ 
                    message: `Minimum transfer amount is ${MIN_TRANSFER_AMOUNT} NGN` 
                });
            }
            if (amount > MAX_TRANSFER_AMOUNT) {
                return res.status(400).json({ 
                    message: `Maximum transfer amount is ${MAX_TRANSFER_AMOUNT} NGN` 
                });
            }
            scheduledTransfer.amount = amount;
        }

        if (description) {
            scheduledTransfer.description = description;
        }

        if (frequency && ["one-time", "daily", "weekly", "monthly"].includes(frequency)) {
            scheduledTransfer.frequency = frequency as any;
        }

        if (nextExecutionDate) {
            scheduledTransfer.nextExecutionDate = new Date(nextExecutionDate);
        }

        if (endDate) {
            scheduledTransfer.endDate = new Date(endDate);
        } else if (endDate === null) {
            // Allow removing the end date
            scheduledTransfer.endDate = undefined;
        }

        if (status && ["active", "paused"].includes(status)) {
            scheduledTransfer.status = status as any;
        }

        await scheduledTransfer.save();

        return res.json({
            message: "Scheduled transfer updated successfully",
            scheduledTransfer: {
                id: scheduledTransfer._id,
                recipientEmail: scheduledTransfer.recipientEmail,
                amount: scheduledTransfer.amount,
                description: scheduledTransfer.description,
                frequency: scheduledTransfer.frequency,
                nextExecutionDate: scheduledTransfer.nextExecutionDate,
                lastExecutionDate: scheduledTransfer.lastExecutionDate,
                executionCount: scheduledTransfer.executionCount,
                status: scheduledTransfer.status,
                endDate: scheduledTransfer.endDate
            }
        });
    } catch (error) {
        console.error('Error updating scheduled transfer:', error);
        return res.status(500).json({ message: "Error updating scheduled transfer" });
    }
};

/**
 * Delete a scheduled transfer
 * @route DELETE /wallet/scheduled-transfers/:id
 */
export const deleteScheduledTransfer: RequestHandler = async (req, res) => {
    const userId = req.user.id;
    const transferId = req.params.id;

    try {
        const scheduledTransfer = await scheduledTransferModel.findOne({
            _id: transferId,
            userId
        });

        if (!scheduledTransfer) {
            return res.status(404).json({ message: "Scheduled transfer not found" });
        }

        // Only allow deletion if the transfer is not in progress
        if (scheduledTransfer.status === "active" && scheduledTransfer.executionCount > 0) {
            // Instead of deleting, mark it as completed
            scheduledTransfer.status = "completed";
            await scheduledTransfer.save();
            
            return res.json({
                message: "Scheduled transfer marked as completed",
                wasDeleted: false
            });
        }

        // Delete the scheduled transfer
        await scheduledTransferModel.deleteOne({ _id: transferId });

        return res.json({
            message: "Scheduled transfer deleted successfully",
            wasDeleted: true
        });
    } catch (error) {
        console.error('Error deleting scheduled transfer:', error);
        return res.status(500).json({ message: "Error deleting scheduled transfer" });
    }
};

/**
 * Execute scheduled transfers (to be called by a cron job)
 * This is an internal function and not exposed as an API endpoint
 */
export const executeScheduledTransfers = async () => {
    try {
        const now = new Date();
        
        // Find all active scheduled transfers that are due for execution
        const dueTransfers = await scheduledTransferModel.find({
            status: "active",
            nextExecutionDate: { $lte: now }
        });

        logger.info(`Found ${dueTransfers.length} scheduled transfers to execute`);

        const executedTransfers = [];
        
        // Process each due transfer
        for (const transfer of dueTransfers) {
            try {
                // Find the sender's wallet
                const senderWallet = await walletModel.findOne({ userId: transfer.userId });
                if (!senderWallet) {
                    logger.error(`Sender wallet not found for scheduled transfer ${transfer._id}`);
                    transfer.status = "failed";
                    await transfer.save();
                    continue;
                }

                // Check if the sender has sufficient balance
                if (senderWallet.balance < transfer.amount) {
                    logger.error(`Insufficient balance for scheduled transfer ${transfer._id}`);
                    
                    // Check notification preferences
                    const notificationPrefs = await notificationPreferencesModel.findOne({ userId: transfer.userId });
                    
                    // Create a notification for the user
                    if (!notificationPrefs || notificationPrefs.preferences.scheduledTransfers) {
                        const notification = new notificationModel({
                            userId: transfer.userId,
                            type: "transfer",
                            title: "Scheduled Transfer Failed",
                            message: `Your scheduled transfer of ${transfer.amount} NGN to ${transfer.recipientEmail} failed due to insufficient balance.`,
                            reference: transfer._id?.toString(),
                            isRead: false
                        });
                        await notification.save();
                    }
                    
                    // Skip this transfer but keep it active for the next attempt
                    continue;
                }

                // Find the recipient user by email
                let recipientUser = null;
                let recipientWallet = null;
                
                if (transfer.recipientId) {
                    recipientUser = await userModel.findById(transfer.recipientId);
                    if (recipientUser) {
                        recipientWallet = await walletModel.findOne({ userId: recipientUser._id });
                    }
                } else {
                    recipientUser = await userModel.findOne({ email: transfer.recipientEmail });
                    if (recipientUser) {
                        recipientWallet = await walletModel.findOne({ userId: recipientUser._id });
                    }
                }

                // Generate a unique reference for this transaction
                const reference = `SCHED_${transfer._id?.toString().substring(0, 8) || 'UNKNOWN'}_${Date.now()}`;

                // Update the sender's wallet balance
                senderWallet.balance -= transfer.amount;
                await senderWallet.save();

                // Create a transaction record for the sender
                const senderTransaction = new transactionModel({
                    userId: transfer.userId,
                    walletId: senderWallet._id,
                    type: "transfer",
                    amount: transfer.amount,
                    reference,
                    status: "completed",
                    description: transfer.description || `Scheduled transfer to ${transfer.recipientEmail}`,
                    metadata: {
                        recipientEmail: transfer.recipientEmail,
                        recipientId: recipientUser ? recipientUser._id : null,
                        recipientWalletId: recipientWallet ? recipientWallet._id : null,
                        scheduledTransferId: transfer._id?.toString(),
                        isScheduled: true,
                        testMode: !recipientWallet
                    }
                });
                await senderTransaction.save();

                // If recipient wallet exists, update it and create a transaction record
                if (recipientWallet) {
                    // Update the recipient's wallet balance
                    recipientWallet.balance += transfer.amount;
                    await recipientWallet.save();

                    // Create a transaction record for the recipient
                    const recipientTransaction = new transactionModel({
                        userId: recipientUser!._id,
                        walletId: recipientWallet._id,
                        type: "transfer",
                        amount: transfer.amount,
                        reference: `RECEIVE_${reference.substring(6)}`,
                        status: "completed",
                        description: `Scheduled transfer received`,
                        metadata: {
                            senderId: transfer.userId,
                            senderWalletId: senderWallet._id,
                            originalReference: reference,
                            scheduledTransferId: transfer._id?.toString(),
                            isScheduled: true
                        }
                    });
                    await recipientTransaction.save();

                    // Check recipient notification preferences
                    const recipientNotificationPrefs = await notificationPreferencesModel.findOne({ 
                        userId: recipientUser!._id 
                    });
                    
                    // Create a notification for the recipient if they have enabled transfer notifications
                    if (!recipientNotificationPrefs || recipientNotificationPrefs.preferences.transfers) {
                        const recipientNotification = new notificationModel({
                            userId: recipientUser!._id,
                            type: "transfer",
                            title: "Transfer Received",
                            message: `You have received ${transfer.amount} NGN from a scheduled transfer.`,
                            reference,
                            isRead: false
                        });
                        await recipientNotification.save();
                    }
                }

                // Check sender notification preferences
                const senderNotificationPrefs = await notificationPreferencesModel.findOne({ 
                    userId: transfer.userId 
                });
                
                // Create a notification for the sender if they have enabled scheduled transfer notifications
                if (!senderNotificationPrefs || senderNotificationPrefs.preferences.scheduledTransfers) {
                    const senderNotification = new notificationModel({
                        userId: transfer.userId,
                        type: "transfer",
                        title: "Scheduled Transfer Completed",
                        message: `Your scheduled transfer of ${transfer.amount} NGN to ${transfer.recipientEmail} was completed successfully.`,
                        reference,
                        isRead: false
                    });
                    await senderNotification.save();
                }

                // Update the scheduled transfer record
                transfer.lastExecutionDate = now;
                transfer.executionCount += 1;

                // Update favorite recipient if it exists
                if (recipientUser) {
                    const favoriteRecipient = await favoriteRecipientModel.findOne({
                        userId: transfer.userId,
                        recipientId: recipientUser._id
                    });

                    if (favoriteRecipient) {
                        favoriteRecipient.transferCount += 1;
                        favoriteRecipient.lastTransferDate = now;
                        await favoriteRecipient.save();
                    }
                }

                // Calculate the next execution date based on frequency
                if (transfer.frequency === "one-time") {
                    transfer.status = "completed";
                } else {
                    const nextDate = new Date(transfer.nextExecutionDate);
                    
                    switch (transfer.frequency) {
                        case "daily":
                            nextDate.setDate(nextDate.getDate() + 1);
                            break;
                        case "weekly":
                            nextDate.setDate(nextDate.getDate() + 7);
                            break;
                        case "monthly":
                            nextDate.setMonth(nextDate.getMonth() + 1);
                            break;
                    }
                    
                    transfer.nextExecutionDate = nextDate;
                    
                    // Check if the end date has been reached
                    if (transfer.endDate && nextDate > transfer.endDate) {
                        transfer.status = "completed";
                    }
                }

                await transfer.save();
                
                // Add to executed transfers list for logging
                executedTransfers.push({
                    id: transfer._id,
                    recipientEmail: transfer.recipientEmail,
                    amount: transfer.amount,
                    status: "completed",
                    reference
                });
                
                logger.info(`Successfully executed scheduled transfer ${transfer._id?.toString()}`);
            } catch (error) {
                logger.error(`Error executing scheduled transfer ${transfer._id?.toString()}:`, error);
                
                // Mark the transfer as failed
                transfer.status = "failed";
                await transfer.save();
                
                // Create a notification for the user
                const notification = new notificationModel({
                    userId: transfer.userId,
                    type: "transfer",
                    title: "Scheduled Transfer Failed",
                    message: `Your scheduled transfer of ${transfer.amount} NGN to ${transfer.recipientEmail} failed due to an error.`,
                    reference: transfer._id?.toString(),
                    isRead: false
                });
                await notification.save();
            }
        }

        return { success: true, executedCount: dueTransfers.length, executedTransfers };
    } catch (error) {
        logger.error('Error executing scheduled transfers:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
};

/**
 * Test endpoint to fund a wallet for testing purposes
 * This should only be enabled in development/testing environments
 * @route POST /wallet/test-fund
 */
export const testFundWallet: RequestHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { amount } = req.body;

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            return res.status(400).json({ 
                message: "Invalid amount. Amount must be a positive number." 
            });
        }

        // Find the user's wallet
        const wallet = await walletModel.findOne({ userId });
        
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        // Generate a unique reference
        const reference = `FUND_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
        
        // Create a funding transaction
        const transaction = new transactionModel({
            userId,
            walletId: wallet._id,
            type: "funding",
            amount: Number(amount),
            currency: "NGN",
            reference,
            status: "completed",
            description: "Test wallet funding",
            metadata: {
                method: "test_funding",
                purpose: "testing"
            }
        });
        
        // Update wallet balance
        const oldBalance = wallet.balance;
        wallet.balance += Number(amount);
        
        // Save both the transaction and updated wallet
        await Promise.all([
            transaction.save(),
            wallet.save()
        ]);
        
        // Create a notification for the funding
        await createNotification(
            userId,
            "wallet",
            "Wallet Funded",
            `Your wallet has been funded with ${amount} NGN`,
            reference
        );
        
        return res.status(200).json({
            message: "Wallet funded successfully",
            oldBalance,
            newBalance: wallet.balance,
            amount: Number(amount),
            reference,
            status: "completed"
        });
    } catch (error) {
        console.error("Error funding wallet:", error);
        return res.status(500).json({ message: "Error funding wallet" });
    }
};

/**
 * Complete a pending funding transaction
 * This should only be enabled in development/testing environments
 * @route POST /wallet/test-complete-funding
 */
export const testCompleteFunding: RequestHandler = async (req, res) => {
    try {
        const userId = req.user.id;
        const { reference } = req.body;

        if (!reference) {
            return res.status(400).json({ message: "Reference is required" });
        }

        // Find the pending transaction
        const transaction = await transactionModel.findOne({ 
            reference, 
            userId, 
            type: "funding",
            status: "pending"
        });
        
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found or not pending" });
        }

        // Find the user's wallet
        const wallet = await walletModel.findOne({ userId });
        
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        // Update wallet balance
        const oldBalance = wallet.balance;
        wallet.balance += transaction.amount;
        
        // Update transaction status
        transaction.status = "completed";
        
        // Save both the transaction and updated wallet
        await Promise.all([
            transaction.save(),
            wallet.save()
        ]);
        
        // Create a notification for the completed funding
        await createNotification(
            userId, 
            "wallet", 
            "Funding Completed", 
            `Your wallet funding of ${transaction.amount} NGN has been completed`, 
            reference
        );
        
        return res.status(200).json({
            message: "Funding completed successfully",
            oldBalance,
            newBalance: wallet.balance,
            amount: transaction.amount,
            reference,
            status: "completed"
        });
    } catch (error) {
        console.error("Error completing funding:", error);
        return res.status(500).json({ message: "Error completing funding" });
    }
};

/**
 * Test endpoint for debugging purposes
 * @route POST /wallet/test-endpoint
 */
export const testEndpoint: RequestHandler = async (req, res) => {
    console.log('Test endpoint request body:', req.body);
    return res.json({
        message: "Test endpoint successful",
        body: req.body
    });
};
