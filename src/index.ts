import "dotenv/config";
import "express-async-errors"
import express from "express"
import "src/db";
import authRouter from "./routes/auth";
import billsPaymntent from "./routes/billsPayment";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import options from './swagger';
import option from './productionSwagger';
import moneyTransferRouter from "./routes/moneyTransfer";
import virtualCardRouter from "./routes/virtualCard";
import utilityBillRouter from "./routes/utilityBills";
import giftCardRouter from "./routes/giftCard";
import walletRouter from "./routes/wallet";
import bettingRouter from "./routes/betting";
import webHookRouter from "./routes/webHook";


const app = express()

app.use(express.static('src/public'));

app.use(express.json())
app.use(express.urlencoded({extended: false}))

app.use('/auth', authRouter)
app.use('/billsPayment', billsPaymntent)
app.use('/transfer', moneyTransferRouter)
app.use('/card',virtualCardRouter)
app.use('/utility',utilityBillRouter)
app.use("/gift-card", giftCardRouter)
app.use('/wallet', walletRouter)
app.use('/betting', bettingRouter)
app.use('webHook', webHookRouter)

// const spec = swaggerJsDoc(options);
// app.use("/api-doc", swaggerUi.serve, swaggerUi.setup(spec));

const specs = swaggerJsDoc(option);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.use(function (err, req, res, next){
    res.status(500).json({message: err.message})
} as express.ErrorRequestHandler)

app.listen(2000, () => {
    console.log("Server is running on http://localhost:2000")
})