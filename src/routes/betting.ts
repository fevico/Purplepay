import { Router } from "express";
import { bettingTopUp, getBettingProvider, validateCustormerId } from "src/controller/betting";
import { isAuth } from "src/middleware/auth";

const bettingRouter = Router()

bettingRouter.get("/betting-providers", isAuth, getBettingProvider)
bettingRouter.post("/validate-customerId", isAuth, validateCustormerId)
bettingRouter.post("/top-up", isAuth, bettingTopUp)

export default bettingRouter;