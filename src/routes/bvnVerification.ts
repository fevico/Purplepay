import express from 'express';
import { verifyBvn, getBvnStatus, confirmBvnWithOtp, getBvnDetails } from '../controller/bvnVerification';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * BVN Verification routes
 * These routes handle BVN verification for enhanced security
 */

/**
 * @route POST /api/bvn/verify
 * @desc Verify a user's BVN using Strowallet API
 * @access Private
 */
router.post('/verify', authenticateToken, verifyBvn);

/**
 * @route GET /api/bvn/status
 * @desc Get BVN verification status for the authenticated user
 * @access Private
 */
router.get('/status', authenticateToken, getBvnStatus);

/**
 * @route POST /api/bvn/confirm
 * @desc Confirm BVN with OTP (for two-factor verification)
 * @access Private
 */
router.post('/confirm', authenticateToken, confirmBvnWithOtp);

/**
 * @route GET /api/bvn/details
 * @desc Get BVN details from Strowallet API
 * @access Private
 */
router.get('/details', authenticateToken, getBvnDetails);

export default router;
