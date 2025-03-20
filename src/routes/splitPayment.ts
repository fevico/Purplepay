import express from 'express';
import * as splitPaymentController from '../controller/splitPayment';
import { authenticateToken } from '../middleware/auth';
import { validateRequest } from '../middleware/validator';
import { body, param } from 'express-validator';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new split payment group
router.post(
  '/groups',
  [
    body('name').notEmpty().withMessage('Group name is required'),
    body('description').optional(),
    body('paymentPurpose').optional(),
    body('targetAmount').optional().isNumeric().withMessage('Target amount must be a number'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date')
  ],
  validateRequest,
  splitPaymentController.createGroup
);

// Get all groups for the current user
router.get('/groups', splitPaymentController.getUserGroups);

// Get a group by ID
router.get(
  '/groups/:groupId',
  [
    param('groupId').isMongoId().withMessage('Invalid group ID')
  ],
  validateRequest,
  splitPaymentController.getGroupById
);

// Join a group using an invite code
router.post(
  '/groups/join',
  [
    body('inviteCode').notEmpty().withMessage('Invite code is required')
  ],
  validateRequest,
  splitPaymentController.joinGroup
);

// Contribute to a group
router.post(
  '/contribute',
  [
    body('groupId').isMongoId().withMessage('Invalid group ID'),
    body('amount').isNumeric().withMessage('Amount must be a number').custom((value: number) => value > 0).withMessage('Amount must be greater than 0'),
    body('notes').optional()
  ],
  validateRequest,
  splitPaymentController.contributeToGroup
);

// Make a payment from a group
router.post(
  '/pay',
  [
    body('groupId').isMongoId().withMessage('Invalid group ID'),
    body('amount').isNumeric().withMessage('Amount must be a number').custom((value: number) => value > 0).withMessage('Amount must be greater than 0'),
    body('paymentMethod').isIn(['virtual_card', 'bank_transfer', 'bill_payment']).withMessage('Invalid payment method'),
    body('recipient').notEmpty().withMessage('Recipient is required'),
    body('description').optional(),
    body('requiresApproval').optional().isBoolean().withMessage('Requires approval must be a boolean'),
    body('minApprovals').optional().isInt({ min: 1 }).withMessage('Minimum approvals must be at least 1')
  ],
  validateRequest,
  splitPaymentController.makeGroupPayment
);

// Approve a group payment
router.post(
  '/approve',
  [
    body('transactionId').notEmpty().withMessage('Transaction ID is required')
  ],
  validateRequest,
  splitPaymentController.approveGroupPayment
);

// Get all contributions for a group
router.get(
  '/groups/:groupId/contributions',
  [
    param('groupId').isMongoId().withMessage('Invalid group ID')
  ],
  validateRequest,
  splitPaymentController.getGroupContributions
);

// Get all transactions for a group
router.get(
  '/groups/:groupId/transactions',
  [
    param('groupId').isMongoId().withMessage('Invalid group ID')
  ],
  validateRequest,
  splitPaymentController.getGroupTransactions
);

// Get group statistics
router.get(
  '/groups/:groupId/statistics',
  [
    param('groupId').isMongoId().withMessage('Invalid group ID')
  ],
  validateRequest,
  splitPaymentController.getGroupStatistics
);

// Settle a debt between group members
router.post(
  '/settle-debt',
  [
    body('groupId').isMongoId().withMessage('Invalid group ID'),
    body('debtorId').isMongoId().withMessage('Invalid debtor ID'),
    body('creditorId').isMongoId().withMessage('Invalid creditor ID'),
    body('amount').isNumeric().withMessage('Amount must be a number').custom((value: number) => value > 0).withMessage('Amount must be greater than 0')
  ],
  validateRequest,
  splitPaymentController.settleDebt
);

export default router;
