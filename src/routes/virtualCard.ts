import { Router } from "express";
import { cardDetails, cardHistory, cardTransactions, createCard, createCustomer, freezeAndUnfreezeCard, fundCard, withdrawFromCard } from "src/controller/virtualCard";

const virtualCardRouter = Router()

virtualCardRouter.post('/create-customer', createCustomer)
virtualCardRouter.post('/create-card', createCard) 
virtualCardRouter.post('/fund-card', fundCard)
virtualCardRouter.post('/card-details', cardDetails)
virtualCardRouter.post('/card-transactions', cardTransactions)
virtualCardRouter.post('/freeze-unfreze-card', freezeAndUnfreezeCard)
virtualCardRouter.get('/card-history', cardHistory)
virtualCardRouter.post('/withdraw-from-card', withdrawFromCard)

export default virtualCardRouter;