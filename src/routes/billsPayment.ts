import { Router } from "express";
import { VerifySmartCardNumber, buyData, generateResultPin, getAllDataPlans, getCableTvPlan, purchaseAirtime, purchaseData, rechargeCardPrinting, sendBulkSMS, subscribeCableTv } from "src/controller/billsPayment";

const billsPaymntent = Router()

billsPaymntent.get('/get-data-plans', getAllDataPlans)
billsPaymntent.post('/purchase-data', purchaseData)
billsPaymntent.post('/airtime-purchase', purchaseAirtime)
billsPaymntent.get('/get-tv-cable-plan', getCableTvPlan)
billsPaymntent.post('/verify-smart-card-number', VerifySmartCardNumber)
billsPaymntent.post('/subscribe-cable-tv', subscribeCableTv)
// billsPaymntent.post('/verify-meter-number', verifyMeterNumber)
// billsPaymntent.post('/subscribe-electriciy-bill', subscribeElecticityBill)
billsPaymntent.post('/generate-result-pin',generateResultPin)
billsPaymntent.post('/recharge-card-printing', rechargeCardPrinting)
billsPaymntent.post('/send-bulk-sms', sendBulkSMS)
billsPaymntent.get('/buy-data', buyData)

/**
 * @swagger
 * tags:
 *   name: billsPayment
 *   description: Api endpoint to manage billsPayment payment
 */

// /**
//  * @swagger
//  * /billsPayment/get-data-plans:
//  *   get:
//  *     summary: Get Data plans
//  *     tags:
//  *       - billsPayment
//  *     parameters:
//  *       - in: query
//  *         name: service_name
//  *         required: true
//  *         schema:
//  *           type: string
//  *         description: The name of the service to retrieve data plans for.
//  *     responses:
//  *       "200":
//  *         description: Data plans retrieved successfully
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
export default billsPaymntent