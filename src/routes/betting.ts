import { Router } from "express";
import { 
    getBettingProvider, 
    validateCustormerId, 
    bettingTopUp 
} from "../controller/betting";
import { isAuthenticated } from "../middleware/auth";

const bettingRouter = Router()

// Apply authentication middleware
bettingRouter.use(isAuthenticated);

bettingRouter.get("/betting-providers", getBettingProvider)
bettingRouter.post("/validate-customerId", validateCustormerId)
bettingRouter.post("/top-up", bettingTopUp)

export default bettingRouter;