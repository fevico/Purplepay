import express from "express";
import { isAuthenticated } from "../middleware/auth";
import { 
  getUserRewards, 
  redeemRewards 
} from "../controller/rewards";

const rewardsRouter = express.Router();

/**
 * @route GET /api/rewards
 * @desc Get user's rewards balance and history
 * @access Private
 */
rewardsRouter.get("/", isAuthenticated, getUserRewards);

/**
 * @route POST /api/rewards/redeem
 * @desc Redeem rewards
 * @access Private
 */
rewardsRouter.post("/redeem", isAuthenticated, redeemRewards);

export default rewardsRouter;
