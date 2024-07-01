import { Router } from "express";
import { getCountries, getProductByISOCode, getProductById, getProducts, RedeemInstruction, redeemInstructionByBrandId, getFxRate, getDiscount, getDiscountByProductId, orderGiftCard, getTransactions, getTransactionsById } from "src/controller/giftCard";
import { acessToken } from "src/controller/utilityBills";
import { isAuth } from "src/middleware/auth";

const giftCardRouter = Router()

giftCardRouter.get('/get-countries', acessToken, getCountries)
giftCardRouter.get('/get-products', acessToken, getProducts) 
giftCardRouter.get('/product-by-id/:productId', acessToken, getProductById) 
giftCardRouter.get('/product-by-code/:countrycode', acessToken, getProductByISOCode) 
giftCardRouter.get('/redeem-instructions', acessToken, RedeemInstruction) 
giftCardRouter.get('/redeem-instructions-by-id/:brandId', acessToken, redeemInstructionByBrandId) 
giftCardRouter.get('/fx-rate', acessToken, getFxRate)
giftCardRouter.get('/get-discount', acessToken, getDiscount)
giftCardRouter.get('/discount-by-id/:productId', acessToken, getDiscountByProductId)
giftCardRouter.post('/order-gift-card', isAuth, orderGiftCard)
giftCardRouter.get('/get-transactions', acessToken, getTransactions)
giftCardRouter.get('/transactions-by-id', acessToken, getTransactionsById)

export default giftCardRouter 