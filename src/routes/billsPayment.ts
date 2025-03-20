import { Router } from "express";
import { 
    VerifySmartCardNumber, 
    buyData, 
    generateResultPin, 
    getAllDataPlans, 
    getCableTvPlan, 
    purchaseAirtime, 
    purchaseData, 
    rechargeCardPrinting, 
    sendBulkSMS, 
    subscribeCableTv,
    initiateBillPayment,
    processBillPayment,
    getBillPaymentStatus,
    getBillPaymentHistory
} from "../controller/billsPayment";
import { isAuthenticated } from "../middleware/auth";

const billsPaymentRouter = Router()

// Existing endpoints
billsPaymentRouter.get('/get-data-plans', getAllDataPlans)
billsPaymentRouter.post('/purchase-data', purchaseData)
billsPaymentRouter.post('/airtime-purchase', purchaseAirtime)
billsPaymentRouter.get('/get-tv-cable-plan', getCableTvPlan)
billsPaymentRouter.post('/verify-smart-card-number', VerifySmartCardNumber)
billsPaymentRouter.post('/subscribe-cable-tv', subscribeCableTv)
// billsPaymntent.post('/verify-meter-number', verifyMeterNumber)
// billsPaymntent.post('/subscribe-electriciy-bill', subscribeElecticityBill)
billsPaymentRouter.post('/generate-result-pin',generateResultPin)
billsPaymentRouter.post('/recharge-card-printing', rechargeCardPrinting)
billsPaymentRouter.post('/send-bulk-sms', sendBulkSMS)
billsPaymentRouter.get('/buy-data', buyData)

// New comprehensive bill payment endpoints
billsPaymentRouter.post('/initiate', isAuthenticated, initiateBillPayment)
billsPaymentRouter.post('/process/:reference', isAuthenticated, processBillPayment)
billsPaymentRouter.get('/status/:reference', isAuthenticated, getBillPaymentStatus)
billsPaymentRouter.get('/history', isAuthenticated, getBillPaymentHistory)

/**
 * @swagger
 * tags:
 *   name: billsPayment
 *   description: Api endpoint to manage billsPayment payment
 */

/**
 * @swagger
 * /billsPayment/get-data-plans:
 *   get:
 *     summary: Get Data plans
 *     tags:
 *       - billsPayment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service_name:
 *                 type: string
 *     responses:
 *       "200":
 *         description: Data plans retrieved successfully
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
 * /billsPayment/get-tv-cable-plan:
 *   get:
 *     summary: Get TV and cable plans
 *     tags:
 *       - billsPayment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service_name:
 *                 type: string
 *     responses:
 *       "200":
 *         description: TV plans retrieved successfully
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
 * /billsPayment/purchase-data:
 *   post:
 *     summary: Purchase Data
 *     tags:
 *       - billsPayment
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *              $ref: '#/components/schemas/billsPayment'
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


/**
 * @swagger
 * /billsPayment/airtime-purchase:
 *   post:
 *     summary: Purchase Airtime
 *     tags:
 *       - billsPayment
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service_name:
 *                 type: string
 *               amount:
 *                 type: string
 *               phone:
 *                 type: string
 *             example:
 *               service_name: mtn
 *               amount: 100
 *               phone: 08136819208
 *     responses:
 *       "200":
 *         description: Airtime Purchased successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Airtime Purchased successfully
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
 * /billsPayment/verify-smart-card-number:
 *   post:
 *     summary: Verify smart card number 
 *     tags:
 *       - billsPayment
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service_id:
 *                 type: string
 *               customer_id:
 *                 type: string
 *             example:
 *               service_id: dstv
 *               customer_id: 08136819208 
 *     responses:
 *       "200":
 *         description: Smart card number verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Smart card number verified successfully
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
 * /billsPayment/subscribe-cable-tv:
 *   post:
 *     summary: Subscribe smart card number 
 *     tags:
 *       - billsPayment
 *     requestBody:
 *       required: true 
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: string
 *               phone:
 *                 type: string
 *               service_name:
 *                 type: string
 *               customer_id:
 *                 type: string
 *               service_id:
 *                 type: string
 *               variation_code:
 *                 type: string
 *             example:
 *               amount: 1000
 *               phone: 08136819208
 *               service_name: Gotv lite     
 *               service_id: dstv
 *               customer_id: 08136819208 
 *               variation_code: 100
 *     responses:
 *       "200":
 *         description: Smart card number verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Smart card number verified successfully
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
 * /billsPayment/initiate:
 *   post:
 *     summary: Initiate a bill payment
 *     tags:
 *       - billsPayment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - billType
 *               - provider
 *               - customerReference
 *               - amount
 *             properties:
 *               billType:
 *                 type: string
 *                 enum: [electricity, water, internet, tv, education, tax, other]
 *                 description: Type of bill to pay
 *               provider:
 *                 type: string
 *                 description: Service provider name
 *               customerReference:
 *                 type: string
 *                 description: Customer reference number (meter number, account number, etc.)
 *               amount:
 *                 type: number
 *                 description: Amount to pay
 *               currency:
 *                 type: string
 *                 default: NGN
 *                 description: Currency code
 *               metadata:
 *                 type: object
 *                 description: Additional data required for the payment
 *     responses:
 *       "200":
 *         description: Bill payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Bill payment initiated successfully
 *                 reference:
 *                   type: string
 *                   example: BP-1234567890
 *                 billPayment:
 *                   type: object
 *       "400":
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Missing required fields
 *       "403":
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized request
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: An error occurred while initiating bill payment
 */

/**
 * @swagger
 * /billsPayment/process/{reference}:
 *   post:
 *     summary: Process a bill payment
 *     tags:
 *       - billsPayment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Bill payment reference
 *     responses:
 *       "200":
 *         description: Bill payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Bill payment processed successfully
 *                 billPayment:
 *                   type: object
 *                 providerResponse:
 *                   type: object
 *       "400":
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Bill payment already processed
 *       "403":
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized access to this bill payment
 *       "404":
 *         description: Bill payment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Bill payment not found
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: An error occurred while processing bill payment
 */

/**
 * @swagger
 * /billsPayment/status/{reference}:
 *   get:
 *     summary: Get bill payment status
 *     tags:
 *       - billsPayment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Bill payment reference
 *     responses:
 *       "200":
 *         description: Bill payment status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 billPayment:
 *                   type: object
 *       "403":
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized access to this bill payment
 *       "404":
 *         description: Bill payment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Bill payment not found
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: An error occurred while getting bill payment status
 */

/**
 * @swagger
 * /billsPayment/history:
 *   get:
 *     summary: Get bill payment history
 *     tags:
 *       - billsPayment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: billType
 *         schema:
 *           type: string
 *         description: Filter by bill type
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *         description: Filter by provider
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed]
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       "200":
 *         description: Bill payment history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 billPayments:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       "403":
 *         description: Unauthorized request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Unauthorized request
 *       "500":
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: An error occurred while getting bill payment history
 */

export default billsPaymentRouter