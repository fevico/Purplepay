import { Router } from "express";
import { 
    createCustomer, 
    createCard, 
    fundCard, 
    cardDetails, 
    cardTransactions, 
    freezeAndUnfreezeCard, 
    cardHistory, 
    withdrawFromCard,
    cardStatus 
} from "../controller/virtualCard";
import { isAuthenticated } from "../middleware/auth";

const virtualCardRouter = Router()

// Apply authentication middleware to all routes
virtualCardRouter.use(isAuthenticated);

virtualCardRouter.post('/create-customer', createCustomer)
virtualCardRouter.post('/create-card', createCard) 
virtualCardRouter.post('/fund-card', fundCard)
virtualCardRouter.post('/card-details', cardDetails)
virtualCardRouter.post('/card-transactions', cardTransactions)
virtualCardRouter.post('/freeze-unfreze-card', freezeAndUnfreezeCard)
virtualCardRouter.get('/card-history', cardHistory)
virtualCardRouter.post('/withdraw-from-card', withdrawFromCard)
virtualCardRouter.post('/card-status', cardStatus)

/**
 * @swagger
 * tags:
 *   name: virtualCard
 *   description: Api endpoint to manage virtual cards
 */


/**
 * @swagger
 * /card/create-customer:
 *   post:
 *     summary: create customer
 *     tags:
 *       - virtualCard
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *              $ref: '#/components/schemas/virtualCard'
 *     responses:
 *       "200":
 *         description: customer details created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: customer details created successfully
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

/**
 * @swagger
 * /card/create-card:
 *   post:
 *     summary: create virtual card
 *     tags:
 *       - virtualCard
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *              type: object
 *           properties:
 *               name_on_card:            
 *                   type: string
 *               amount:            
 *                   type: string
 *               customerEmail:            
 *                   type: string
 *               card_type:            
 *                   type: string
 *           example:
 *               name_on_card: "John Doe"
 *               amount: "1000"
 *               customerEmail: "johndoe@gmail.com"
 *               card_type: "virtual"
 *     responses:
 *       "200":
 *         description: Virtual card details created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Virtual card details created successfully
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

/**
 * @swagger
 * /card/card-transactions:
 *   post:
 *     summary: virtual card transactions
 *     tags:
 *       - virtualCard
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *              type: object
 *           properties:
 *               card_id:            
 *                   type: string
 *           example:
 *               card_id: "6001119434"
 *     responses:
 *       "200":
 *         description: Virtual card transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Virtual card transactions
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


/**
 * @swagger
 * /card/card-history:
 *   get:
 *     summary: virtual card history
 *     tags:
 *       - virtualCard
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *              type: object
 *           properties:
 *               card_id:            
 *                   type: string
 *           example:
 *               card_id: "6001119434"
 *     responses:
 *       "200":
 *         description: Virtual card transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Virtual card transactions
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
/**
 * @swagger
 * /card/freeze-unfreze-card:
 *   post:
 *     summary: Freeze and unfreeze virtual card
 *     tags:
 *       - virtualCard
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *              type: object
 *           properties:
 *               card_id:            
 *                   type: string
 *               action:
 *                  type: string
 *           example:
 *               card_id: "6001119434"
 *               action: "freeze"
 *     responses:
 *       "200":
 *         description: Virtual card transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Virtual card transactions
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


/**
 * @swagger
 * /card/card-details:
 *   post:
 *     summary: virtual card details
 *     tags:
 *       - virtualCard
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *              type: object
 *           properties:
 *               card_id:            
 *                   type: string
 *           example:
 *               card_id: "6001119434"
 *     responses:
 *       "200":
 *         description: Virtual card funded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Virtual card funded successfully
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

/**
 * @swagger
 * /card/fund-card:
 *   post:
 *     summary: Fund virtual card
 *     tags:
 *       - virtualCard
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *              type: object
 *           properties:
 *               card_id:            
 *                   type: string
 *               amount:            
 *                   type: string
 *           example:
 *               card_id: "6001119434"
 *               amount: "1000"
 *     responses:
 *       "200":
 *         description: Virtual card funded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Virtual card funded successfully
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


/**
 * @swagger
 * /card/withdraw-from-card:
 *   post:
 *     summary: virtual card transactions
 *     tags:
 *       - virtualCard
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *              type: object
 *           properties:
 *               card_id:            
 *                   type: string
 *               amount:            
 *                   type: string
 *           example:
 *               card_id: "6001119434"
 *               amount: "10000"
 *     responses:
 *       "200":
 *         description: Withdrawer Sucessful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Virtual card transactions
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



export default virtualCardRouter;