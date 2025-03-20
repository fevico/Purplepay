import { RequestHandler } from "express";
import transactionModel from "../model/transaction";
import { sendErrorRes } from "../utils/helper";

/**
 * Get transaction history for the authenticated user
 * @route GET /transactions
 * @param {string} type - Optional filter by transaction type (funding, withdrawal, transfer)
 * @param {string} status - Optional filter by transaction status (pending, completed, failed)
 * @param {string} startDate - Optional filter by start date (ISO format)
 * @param {string} endDate - Optional filter by end date (ISO format)
 * @param {number} page - Optional page number for pagination (default: 1)
 * @param {number} limit - Optional limit for pagination (default: 10)
 */
export const getTransactionHistory: RequestHandler = async (req, res) => {
    const user = req.user.id;
    const { 
        type, 
        status, 
        startDate, 
        endDate, 
        page = 1, 
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc"
    } = req.query;

    try {
        // Build the filter
        const filter: any = { userId: user };

        // Add optional filters
        if (type) {
            filter.type = type;
        }

        if (status) {
            filter.status = status;
        }

        // Add date range filter
        if (startDate || endDate) {
            filter.createdAt = {};
            
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate as string);
            }
            
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate as string);
            }
        }

        // Calculate pagination
        const skip = (Number(page) - 1) * Number(limit);

        // Determine sort order
        const sort: any = {};
        sort[sortBy as string] = sortOrder === "asc" ? 1 : -1;

        // Get total count for pagination
        const total = await transactionModel.countDocuments(filter);

        // Get transactions with pagination
        const transactions = await transactionModel
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .exec();

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / Number(limit));
        const currentPage = Number(page);
        const hasNextPage = currentPage < totalPages;
        const hasPrevPage = currentPage > 1;

        return res.json({
            message: "Transaction history retrieved successfully",
            transactions: transactions || [], // Ensure transactions is always an array
            pagination: {
                total,
                totalPages,
                currentPage,
                limit: Number(limit),
                hasNextPage,
                hasPrevPage
            }
        });
    } catch (error) {
        console.error('Error getting transaction history:', error);
        return res.status(500).json({ message: "Error getting transaction history" });
    }
};

/**
 * Get transaction details by reference
 * @route GET /transactions/:reference
 */
export const getTransactionDetails: RequestHandler = async (req, res) => {
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

        return res.json({
            message: "Transaction details retrieved successfully",
            transaction: transaction
        });
    } catch (error) {
        console.error('Error getting transaction details:', error);
        return res.status(500).json({ message: "Error getting transaction details" });
    }
};

/**
 * Get transaction summary for the authenticated user
 * @route GET /transactions/summary
 */
export const getTransactionSummary: RequestHandler = async (req, res) => {
    const user = req.user.id;
    const { period = "all" } = req.query;

    try {
        // Build the filter
        const filter: any = { userId: user };

        // Add date range filter based on period
        const now = new Date();
        if (period === "today") {
            const startOfDay = new Date(now.setHours(0, 0, 0, 0));
            filter.createdAt = { $gte: startOfDay };
        } else if (period === "week") {
            const startOfWeek = new Date(now);
            startOfWeek.setDate(now.getDate() - now.getDay());
            startOfWeek.setHours(0, 0, 0, 0);
            filter.createdAt = { $gte: startOfWeek };
        } else if (period === "month") {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            filter.createdAt = { $gte: startOfMonth };
        } else if (period === "year") {
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            filter.createdAt = { $gte: startOfYear };
        }

        // Get total counts by type and status
        const [
            totalFunding,
            totalWithdrawal,
            totalTransfer,
            pendingTransactions,
            completedTransactions,
            failedTransactions
        ] = await Promise.all([
            transactionModel.countDocuments({ ...filter, type: "funding" }),
            transactionModel.countDocuments({ ...filter, type: "withdrawal" }),
            transactionModel.countDocuments({ ...filter, type: "transfer" }),
            transactionModel.countDocuments({ ...filter, status: "pending" }),
            transactionModel.countDocuments({ ...filter, status: "completed" }),
            transactionModel.countDocuments({ ...filter, status: "failed" })
        ]);

        // Get total amounts by type
        const [
            fundingAmount,
            withdrawalAmount,
            transferAmount
        ] = await Promise.all([
            transactionModel.aggregate([
                { $match: { ...filter, type: "funding", status: "completed" } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            transactionModel.aggregate([
                { $match: { ...filter, type: "withdrawal", status: "completed" } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ]),
            transactionModel.aggregate([
                { $match: { ...filter, type: "transfer", status: "completed" } },
                { $group: { _id: null, total: { $sum: "$amount" } } }
            ])
        ]);

        return res.json({
            message: "Transaction summary retrieved successfully",
            data: {
                counts: {
                    total: totalFunding + totalWithdrawal + totalTransfer,
                    funding: totalFunding,
                    withdrawal: totalWithdrawal,
                    transfer: totalTransfer,
                    pending: pendingTransactions,
                    completed: completedTransactions,
                    failed: failedTransactions
                },
                amounts: {
                    funding: fundingAmount.length > 0 ? fundingAmount[0].total : 0,
                    withdrawal: withdrawalAmount.length > 0 ? withdrawalAmount[0].total : 0,
                    transfer: transferAmount.length > 0 ? transferAmount[0].total : 0,
                    net: (fundingAmount.length > 0 ? fundingAmount[0].total : 0) - 
                         (withdrawalAmount.length > 0 ? withdrawalAmount[0].total : 0) -
                         (transferAmount.length > 0 ? transferAmount[0].total : 0)
                },
                period
            }
        });
    } catch (error) {
        console.error('Error getting transaction summary:', error);
        return res.status(500).json({ message: "Error getting transaction summary" });
    }
};

/**
 * Update transaction status
 * @route PUT /transactions/:id/status
 * @param {string} id - Transaction ID
 * @param {string} status - New status (completed, failed, pending)
 */
export const updateTransactionStatus: RequestHandler = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user.id;

    try {
        // Validate status
        if (!status || !["completed", "failed", "pending"].includes(status)) {
            return sendErrorRes(res, "Invalid status value", 400);
        }

        // Find transaction and verify ownership
        const transaction = await transactionModel.findOne({ 
            _id: id,
            userId: user
        });

        if (!transaction) {
            return sendErrorRes(res, "Transaction not found", 404);
        }

        // Update status
        transaction.status = status;
        await transaction.save();

        // Store transaction in res.locals for middleware
        res.locals.transaction = transaction;

        return res.status(200).json({
            success: true,
            message: "Transaction status updated successfully",
            data: transaction
        });
    } catch (error) {
        return sendErrorRes(res, "Error updating transaction status", 500);
    }
};
