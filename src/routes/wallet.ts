import { Router } from "express";
import { 
    createWallet, 
    fetchBankList, 
    fundWallet, 
    getAccountDetails, 
    getWalletDetails, 
    getWithdrawalStatus, 
    initiateWithdrawal, 
    verifyFunding, 
    verifyWithdrawal,
    transferFunds,
    verifyTransfer,
    getTransferStatus,
    addFavoriteRecipient,
    getFavoriteRecipients,
    updateFavoriteRecipient,
    deleteFavoriteRecipient,
    createScheduledTransfer,
    getScheduledTransfers,
    updateScheduledTransfer,
    deleteScheduledTransfer,
    testFundWallet,
    testCompleteFunding,
    testEndpoint
} from "../controller/wallet";
import { isAuthenticated } from "../middleware/auth";

const walletRouter = Router()

walletRouter.use(isAuthenticated);

walletRouter.post('/create', createWallet)
walletRouter.get('/bank-list', fetchBankList)
walletRouter.post('/account-details', getAccountDetails)
walletRouter.get('/details', getWalletDetails)
walletRouter.post('/fund', fundWallet)
walletRouter.get('/verify-funding/:reference', verifyFunding)
walletRouter.post('/withdraw', initiateWithdrawal)
walletRouter.post('/verify-withdrawal', verifyWithdrawal)
walletRouter.get('/withdrawal-status/:reference', getWithdrawalStatus)
walletRouter.post('/transfer', transferFunds)
walletRouter.post('/verify-transfer', verifyTransfer)
walletRouter.get('/transfer-status/:reference', getTransferStatus)
walletRouter.post('/favorite-recipients', addFavoriteRecipient)
walletRouter.get('/favorite-recipients', getFavoriteRecipients)
walletRouter.put('/favorite-recipients/:id', updateFavoriteRecipient)
walletRouter.delete('/favorite-recipients/:id', deleteFavoriteRecipient)

walletRouter.post('/scheduled-transfers', createScheduledTransfer)
walletRouter.get('/scheduled-transfers', getScheduledTransfers)
walletRouter.put('/scheduled-transfers/:id', updateScheduledTransfer)
walletRouter.delete('/scheduled-transfers/:id', deleteScheduledTransfer)

walletRouter.post('/test-endpoint', testEndpoint)
// Test endpoints for wallet funding (only for development/testing)
walletRouter.post("/test-fund", testFundWallet);
walletRouter.post("/test-complete-funding", testCompleteFunding);

/**
 * @swagger
 * tags:
 *   name: wallet
 *   description: Api endpoint to manage user wallet
 */

/**
 * @swagger
 * /wallet/create:
 *   post:
 *     summary: create naira wallet
 *     tags:
 *       - wallet
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *              $ref: '#/components/schemas/wallet'
 *     responses:
 *       "200":
 *         description: wallet details created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: wallet details created successfully
 *       "400":
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Bad request
 *       "422":
 *         description: Unprocessable request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unprocessable request
 *       "403":
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Unauthorized request
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Internal server error
 */

// /**
//  * @swagger
//  * /wallet/wallet-details:
//  *   get:
//  *     summary: Get user's wallet details
//  *     tags:
//  *       - wallet
//  *     responses:
//  *       "200":
//  *         description: wallet details retrieve successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Service found
//  *       "400":
//  *         description: Bad request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Bad request
//  *       "403":
//  *         description: Unauthorized request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Unauthorized request
//  *       "422":
//  *         description: Unprocessable request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Unprocessable request
//  *       "500":
//  *         description: Internal server error
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Internal server error
//  */

// /**
//  * @swagger
//  * /wallet/wallet-transations:
//  *   get:
//  *     summary: Get user's wallet transactions
//  *     tags:
//  *       - wallet
//  *     responses:
//  *       "200":
//  *         description: wallet details retrieve successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Service found
//  *       "400":
//  *         description: Bad request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Bad request
//  *       "403":
//  *         description: Unauthorized request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Unauthorized request
//  *       "422":
//  *         description: Unprocessable request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Unprocessable request
//  *       "500":
//  *         description: Internal server error
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Internal server error
//  */

// /**
//  * @swagger
//  * /wallet/bank-list:
//  *   get:
//  *     summary: Get list of banks
//  *     tags:
//  *       - wallet
//  *     responses:
//  *       "200":
//  *         description: Bank list fetch successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Service found
//  *       "400":
//  *         description: Bad request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Bad request
//  *       "403":
//  *         description: Unauthorized request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Unauthorized request
//  *       "422":
//  *         description: Unprocessable request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Unprocessable request
//  *       "500":
//  *         description: Internal server error
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Internal server error
//  */

// /**
//  * @swagger
//  * /wallet/account-details:
//  *   post:
//  *     summary: Verify account details
//  *     tags:
//  *       - wallet
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               accountNumber:
//  *                 type: number
//  *               sortCode:
//  *                 type: string
//  *             example:
//  *               accountNumber: 123456789
//  *               sortCode: "12-34-56"
//  *     responses:
//  *       "200":
//  *         description: Bank verified successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Bank verified successfully
//  *       "400":
//  *         description: Bad request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Bad request
//  *       "403":
//  *         description: Unauthorized request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Unauthorized request
//  *       "422":
//  *         description: Unprocessable request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Unprocessable request
//  *       "500":
//  *         description: Internal server error
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Internal server error
//  */


// /**
//  * @swagger
//  * /wallet/bank-transfer:
//  *   post:
//  *     summary: Bank Transfer
//  *     tags:
//  *       - wallet
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             properties:
//  *               accountNumber:
//  *                 type: number
//  *               sortCode:
//  *                 type: string
//  *               amount:
//  *                 type: number
//  *               narration:
//  *                 type: string
//  *             example:
//  *               accountNumber: 123456789
//  *               sortCode: "12-34-56"
//  *               amount: 1000
//  *               narration: "Transfer"
//  *     responses:
//  *       "200":
//  *         description: Transfer successful
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 message:
//  *                   type: string
//  *                   example: Transfer successful
//  *       "400":
//  *         description: Bad request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Bad request
//  *       "403":
//  *         description: Unauthorized request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Unauthorized request
//  *       "422":
//  *         description: Unprocessable request
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Unprocessable request
//  *       "500":
//  *         description: Internal server error
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 error:
//  *                   type: string
//  *                   example: Internal server error
//  */
 
export default walletRouter