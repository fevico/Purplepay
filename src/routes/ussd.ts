import express from 'express';
import { processUssdRequest } from '../controller/ussd';

const router = express.Router();

/**
 * USSD routes for handling USSD requests
 * This provides a backup system for users to access their accounts without internet
 */

// Process USSD request
router.post('/', processUssdRequest);

export default router;
