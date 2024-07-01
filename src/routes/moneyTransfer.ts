import { Router } from "express";
import { getAccountName, getListOfBank, moneyTransfer } from "src/controller/moneyTransfer";

const moneyTransferRouter = Router()

moneyTransferRouter.get('/list-of-bank', getListOfBank )
moneyTransferRouter.get('/get-account-name', getAccountName)
moneyTransferRouter.post('/money-transfer', moneyTransfer)

export default moneyTransferRouter