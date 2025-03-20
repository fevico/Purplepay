import { Router } from "express";
import { 
    getTransactionHistory, 
    getTransactionDetails, 
    getTransactionSummary, 
    updateTransactionStatus 
} from "../controller/transaction";
import { isAuthenticated } from "../middleware/auth";
import { handleTransactionRewards } from "../middleware/rewardsMiddleware";

const transactionRouter = Router()

// Apply authentication middleware to all transaction routes
transactionRouter.use(isAuthenticated);

// Get transaction history with filtering options
transactionRouter.get("/", getTransactionHistory);

// Get transaction summary
transactionRouter.get("/summary", getTransactionSummary);

// Get transaction details by reference
transactionRouter.get("/:reference", getTransactionDetails);

// Update transaction status (with rewards middleware)
transactionRouter.put("/:id/status", updateTransactionStatus, handleTransactionRewards);

export default transactionRouter;
