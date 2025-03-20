import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import authRouter from './routes/auth';
import walletRouter from './routes/wallet';
import utilityBillRouter from './routes/utilityBills';
import giftCardRouter from './routes/giftCard';
import moneyTransferRouter from './routes/moneyTransfer';
import virtualCardRouter from './routes/virtualCard';
import billsPaymentRouter from './routes/billsPayment';
import splitPaymentRouter from './routes/splitPayment';
import bettingRouter from "./routes/betting";
import webHookRouter from "./routes/webHook";
import transactionRouter from "./routes/transaction";
import notificationRouter from "./routes/notification";
import securityRouter from "./routes/security";
import notificationPreferencesRouter from "./routes/notificationPreferences";
import rewardsRouter from "./routes/rewards";
import tagRouter from "./routes/tag";
import ussdRouter from "./routes/ussd";
import bvnVerificationRouter from "./routes/bvnVerification";
import savingsGroupRouter from "./routes/savingsGroup";
import options from './swagger';
import option from './productionSwagger';
import { initScheduledTransferJob } from "./jobs/scheduledTransfers";
import { initCleanupTrustedDevicesJob } from "./jobs/cleanupTrustedDevices";

// Load environment variables
dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/purplepay';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express()

app.use(
    cors({
      origin: "*",
      credentials: false,
    })
  );

app.use(express.static('src/public'));

app.use(express.json())
app.use(express.urlencoded({extended: false}))

// API routes with /api prefix
app.use('/api/auth', authRouter)
app.use('/api/billsPayment', billsPaymentRouter)
app.use('/api/transfer', moneyTransferRouter)
app.use('/api/card',virtualCardRouter)
app.use('/api/utility',utilityBillRouter)
app.use("/api/giftCard", giftCardRouter)
app.use('/api/wallet', walletRouter)
app.use('/api/betting', bettingRouter)
app.use('/api/webHook', webHookRouter)
app.use('/api/transactions', transactionRouter)
app.use('/api/notifications', notificationRouter)
app.use('/api/security', securityRouter)
app.use('/api/notification-preferences', notificationPreferencesRouter)
app.use('/api/rewards', rewardsRouter)
app.use('/api/tag', tagRouter)
app.use('/api/splitPayment', splitPaymentRouter)
app.use('/api/ussd', ussdRouter)
app.use('/api/bvn', bvnVerificationRouter)
app.use('/api/savings-groups', savingsGroupRouter)

const specs = swaggerJsDoc(option);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(function (err, req, res, next){
    res.status(500).json({message: err.message})
} as express.ErrorRequestHandler)

// Initialize scheduled jobs
initScheduledTransferJob();
initCleanupTrustedDevicesJob();

const PORT = process.env.PORT || 9882;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})