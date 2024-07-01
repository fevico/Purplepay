import { Router } from "express";
import { bettingTopUp, getBettingProvider, validateCustormerId } from "src/controller/betting";

const bettingRouter = Router()

bettingRouter.get("/betting-providers", getBettingProvider)
bettingRouter.post("/validate-customerId", validateCustormerId)
bettingRouter.post("/top-up", bettingTopUp)

export default bettingRouter;