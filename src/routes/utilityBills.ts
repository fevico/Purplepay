import { Router } from "express";
import { 
    acessToken, 
    getBillers, 
    payBillers 
} from "../controller/utilityBills";
import { isAuthenticated } from "../middleware/auth";

const utilityBillRouter = Router()

// Apply authentication middleware
utilityBillRouter.use(isAuthenticated);

utilityBillRouter.get('/get-biller', acessToken, getBillers)
utilityBillRouter.post('/pay-biller', acessToken, payBillers)

/**
 * @swagger
 * tags:
 *   name: utilityBills
 *   description: Api endpoint to manage utilityBills payment
 */

/**
 * @swagger
 * /utility/get-biller:
 *   get:
 *     summary: Get Billers 
 *     tags:
 *       - utilityBills
 *     responses:
 *       "200":
 *         description: utilityBills details retrieve successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Service found
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

/**
 * @swagger
 * /utility/pay-biller:
 *   post:
 *     summary: Pay Biller
 *     tags:
 *       - utilityBills
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *              $ref: '#/components/schemas/utilityBills'
 *     responses:
 *       "200":
 *         description: User details created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User details created successfully
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

export default utilityBillRouter;