import express from 'express';
import {
  createSavingsGroup,
  getUserSavingsGroups,
  getSavingsGroupById,
  joinSavingsGroup,
  makeContribution,
  leaveSavingsGroup,
  deleteSavingsGroup
} from '../controller/savingsGroup';
import { isAuthenticated } from '../middleware/auth';

const router = express.Router();

/**
 * Digital Savings Group Routes (Ajo/Esusu)
 * These routes handle traditional Nigerian savings groups in digital form
 */

// Create a new savings group
router.post('/', isAuthenticated, createSavingsGroup);

// Get all savings groups for a user
router.get('/', isAuthenticated, getUserSavingsGroups);

// Get a single savings group by ID
router.get('/:groupId', isAuthenticated, getSavingsGroupById);

// Join a savings group using invite code
router.post('/join', isAuthenticated, joinSavingsGroup);

// Make a contribution to a savings group
router.post('/contribute', isAuthenticated, makeContribution);

// Leave a savings group
router.post('/:groupId/leave', isAuthenticated, leaveSavingsGroup);

// Delete a savings group (creator only)
router.delete('/:groupId', isAuthenticated, deleteSavingsGroup);

export default router;
