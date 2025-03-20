import { v4 as uuidv4 } from 'uuid';
import { customAlphabet } from 'nanoid';
import SplitPaymentGroupModel, { ISplitPaymentGroup } from '../models/splitPaymentGroup';
import SplitPaymentContributionModel, { ISplitPaymentContribution } from '../models/splitPaymentContribution';
import SplitPaymentTransactionModel, { ISplitPaymentTransaction } from '../models/splitPaymentTransaction';
import StrollWalletClient from './strollwallet';
import mongoose from 'mongoose';
import { createRewardForTransaction } from './rewards';
import { calculateDebts, getMemberContributionStats, calculateFairShares } from '../utils/splitPaymentUtils';

// Create a nanoid generator for invite codes (8 characters, alphanumeric)
const generateInviteCode = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

// Mock transaction service
const createTransaction = async (
  userId: mongoose.Types.ObjectId | string,
  amount: number,
  type: string,
  description: string,
  reference: string,
  status: string = 'success',
  metadata: any = {}
) => {
  // Mock implementation for testing
  return {
    _id: new mongoose.Types.ObjectId(),
    userId,
    amount,
    type,
    description,
    reference,
    status,
    metadata,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

/**
 * Create a new split payment group
 */
export const createSplitPaymentGroup = async (
  name: string,
  creator: mongoose.Types.ObjectId | string,
  description?: string,
  paymentPurpose?: string,
  targetAmount?: number,
  dueDate?: Date
): Promise<ISplitPaymentGroup> => {
  try {
    // Generate a unique invite code
    const inviteCode = generateInviteCode();
    
    // Create the group
    const group = new SplitPaymentGroupModel({
      name,
      description,
      creator,
      members: [creator], // Add creator as the first member
      inviteCode,
      paymentPurpose,
      targetAmount,
      dueDate,
      balance: 0
    });
    
    // Save the group
    await group.save();
    
    // Create a virtual account for the group
    const customerResponse = await StrollWalletClient.createCustomer({
      firstName: `Group`,
      lastName: name,
      customerEmail: `group-${group._id}@email.propease.ca`,
      phoneNumber: '00000000000', // Placeholder
      dateOfBirth: '2000-01-01', // Placeholder
      idImage: 'https://example.com/placeholder.jpg', // Placeholder
      userPhoto: 'https://example.com/placeholder.jpg', // Placeholder
      line1: 'Group Address', // Placeholder
      state: 'Group State', // Placeholder
      zipCode: '00000', // Placeholder
      city: 'Group City', // Placeholder
      country: 'Group Country', // Placeholder
      idType: 'PASSPORT', // Placeholder
      houseNumber: '0', // Placeholder
      idNumber: `GROUP${group._id}` // Placeholder
    });
    
    // Create a card for the group
    const cardResponse = await StrollWalletClient.createCard({
      name_on_card: `Group ${name}`,
      amount: 0, // Start with zero balance
      customerEmail: customerResponse.customerEmail
    });
    
    // Update the group with the card ID
    group.cardId = cardResponse.card_id;
    await group.save();
    
    return group;
  } catch (error) {
    console.error('Error creating split payment group:', error);
    throw error;
  }
};

/**
 * Get a split payment group by ID
 */
export const getSplitPaymentGroupById = async (
  groupId: mongoose.Types.ObjectId | string
): Promise<ISplitPaymentGroup | null> => {
  try {
    return await SplitPaymentGroupModel.findById(groupId)
      .populate('creator', 'name email')
      .populate('members', 'name email');
  } catch (error) {
    console.error('Error getting split payment group by ID:', error);
    throw error;
  }
};

/**
 * Get all split payment groups for a user
 */
export const getUserSplitPaymentGroups = async (
  userId: mongoose.Types.ObjectId | string
): Promise<ISplitPaymentGroup[]> => {
  try {
    return await SplitPaymentGroupModel.find({ members: userId })
      .populate('creator', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error getting user split payment groups:', error);
    throw error;
  }
};

/**
 * Join a split payment group using an invite code
 */
export const joinSplitPaymentGroup = async (
  inviteCode: string,
  userId: mongoose.Types.ObjectId | string
): Promise<ISplitPaymentGroup> => {
  try {
    // Find the group by invite code
    const group = await SplitPaymentGroupModel.findOne({ inviteCode });
    
    if (!group) {
      throw new Error('Invalid invite code');
    }
    
    // Check if the user is already a member
    if (group.members.includes(userId as any)) {
      throw new Error('User is already a member of this group');
    }
    
    // Add the user to the group
    group.members.push(userId as any);
    await group.save();
    
    return group;
  } catch (error) {
    console.error('Error joining split payment group:', error);
    throw error;
  }
};

/**
 * Contribute to a split payment group
 */
export const contributeToGroup = async (
  groupId: mongoose.Types.ObjectId | string,
  userId: mongoose.Types.ObjectId | string,
  amount: number,
  notes?: string
): Promise<ISplitPaymentContribution> => {
  try {
    // Find the group
    const group = await SplitPaymentGroupModel.findById(groupId);
    
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Check if the user is a member of the group
    if (!group.members.includes(userId as any)) {
      throw new Error('User is not a member of this group');
    }
    
    // Create a transaction ID
    const transactionId = uuidv4();
    
    // Create the contribution record
    const contribution = new SplitPaymentContributionModel({
      group: groupId,
      contributor: userId,
      amount,
      transactionId,
      status: 'completed',
      notes: notes || 'Contribution to group',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await contribution.save();
    
    // Update the group balance
    group.balance += amount;
    await group.save();
    
    // Create a transaction record
    const transaction = await createTransaction(
      userId as string,
      amount,
      'split_payment_contribution',
      `Contribution to ${group.name}`,
      (contribution._id as mongoose.Types.ObjectId).toString(),
      'success',
      {
        groupId: group._id,
        contributionId: contribution._id
      }
    );
    
    // Create a reward for the contribution
    await createRewardForTransaction(transaction, 'transfer');
    
    return contribution;
  } catch (error) {
    console.error('Error contributing to group:', error);
    throw error;
  }
};

/**
 * Make a payment from a split payment group
 */
export const makePayment = async (
  groupId: mongoose.Types.ObjectId | string,
  initiatorId: mongoose.Types.ObjectId | string,
  amount: number,
  paymentMethod: string,
  recipient: string,
  description?: string,
  notes?: string,
  requiresApproval: boolean = true,
  minApprovals: number = 1
): Promise<ISplitPaymentTransaction> => {
  try {
    // Find the group
    const group = await SplitPaymentGroupModel.findById(groupId);
    
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Check if the user is a member of the group
    if (!group.members.includes(initiatorId as any)) {
      throw new Error('User is not a member of this group');
    }
    
    // Check if the group has enough balance
    if (group.balance < amount) {
      throw new Error('Insufficient group balance');
    }
    
    // Create a transaction ID
    const transactionId = uuidv4();
    
    // Create the transaction record
    const transaction = new SplitPaymentTransactionModel({
      group: groupId,
      initiator: initiatorId,
      amount,
      transactionId,
      paymentMethod,
      recipient,
      description,
      status: requiresApproval ? 'pending' : 'completed',
      approvals: [initiatorId], // Initiator automatically approves
      minApprovals,
      notes,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await transaction.save();
    
    // If no approval is required or the initiator's approval is enough, process the payment
    if (!requiresApproval || (minApprovals <= 1)) {
      // Update the group balance
      group.balance -= amount;
      await group.save();
      
      // Update the transaction status
      transaction.status = 'completed';
      await transaction.save();
      
      // Create a transaction record in the main transactions collection
      await createTransaction(
        initiatorId as string,
        amount,
        'split_payment',
        `Payment to ${recipient} from ${group.name}`,
        (transaction._id as mongoose.Types.ObjectId).toString(),
        'success',
        {
          groupId: group._id,
          transactionId: transaction._id
        }
      );
    }
    
    return transaction;
  } catch (error) {
    console.error('Error making payment from group:', error);
    throw error;
  }
};

/**
 * Approve a pending group payment
 */
export const approveGroupPayment = async (
  transactionId: string,
  approverId: mongoose.Types.ObjectId | string
): Promise<ISplitPaymentTransaction> => {
  try {
    // Find the transaction
    const transaction = await SplitPaymentTransactionModel.findOne({ transactionId });
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    
    // Find the group
    const group = await SplitPaymentGroupModel.findById(transaction.group);
    
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Check if the user is a member of the group
    if (!group.members.includes(approverId as any)) {
      throw new Error('User is not a member of this group');
    }
    
    // Check if the transaction is already completed
    if (transaction.status === 'completed') {
      throw new Error('This transaction is already completed');
    }
    
    // Check if the user has already approved
    if (transaction.approvals.includes(approverId as any)) {
      throw new Error('User has already approved this transaction');
    }
    
    // Add the user's approval
    transaction.approvals.push(approverId as any);
    
    // Check if the transaction has enough approvals
    if (transaction.approvals.length >= transaction.minApprovals) {
      // Update the transaction status
      transaction.status = 'completed';
      
      // Update the group balance
      group.balance -= transaction.amount;
      await group.save();
      
      // Create a transaction record in the main transactions collection
      await createTransaction(
        transaction.initiator as string,
        transaction.amount,
        'split_payment',
        `Payment to ${transaction.recipient} from ${group.name}`,
        (transaction._id as mongoose.Types.ObjectId).toString(),
        'success',
        {
          groupId: group._id,
          transactionId: transaction._id
        }
      );
    }
    
    await transaction.save();
    
    return transaction;
  } catch (error) {
    console.error('Error approving group payment:', error);
    throw error;
  }
};

/**
 * Get all contributions for a group
 */
export const getGroupContributions = async (
  groupId: mongoose.Types.ObjectId | string
): Promise<ISplitPaymentContribution[]> => {
  try {
    return await SplitPaymentContributionModel.find({ group: groupId })
      .populate('contributor', 'name email')
      .sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error getting group contributions:', error);
    throw error;
  }
};

/**
 * Get all transactions for a group
 */
export const getGroupTransactions = async (
  groupId: mongoose.Types.ObjectId | string
): Promise<ISplitPaymentTransaction[]> => {
  try {
    return await SplitPaymentTransactionModel.find({ group: groupId })
      .populate('initiator', 'name email')
      .populate('approvals', 'name email')
      .sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error getting group transactions:', error);
    throw error;
  }
};

/**
 * Get group statistics
 */
export const getGroupStatistics = async (
  groupId: mongoose.Types.ObjectId | string
): Promise<any> => {
  try {
    const group = await SplitPaymentGroupModel.findById(groupId)
      .populate('members', 'name email')
      .populate('creator', 'name email');
      
    if (!group) {
      throw new Error('Group not found');
    }
    
    // Get all contributions for the group
    const contributions = await SplitPaymentContributionModel.find({ group: groupId })
      .populate('contributor', 'name email');
    
    // Get all transactions for the group
    const transactions = await SplitPaymentTransactionModel.find({ group: groupId })
      .populate('initiator', 'name email')
      .populate('approvals', 'name email');
    
    // Calculate total contributions by member
    const contributionsByMember: Record<string, number> = {};
    
    contributions.forEach(contribution => {
      const contributorId = contribution.contributor.toString();
      contributionsByMember[contributorId] = (contributionsByMember[contributorId] || 0) + contribution.amount;
    });
    
    // Calculate member statistics
    const memberStats = getMemberContributionStats(group, contributionsByMember);
    
    // Calculate debts between members
    const debts = calculateDebts(group, contributionsByMember);
    
    // Format debts with member names
    const formattedDebts = debts.map(debt => {
      const debtorMember = group.members.find((m: any) => m._id.toString() === debt.debtor);
      const creditorMember = group.members.find((m: any) => m._id.toString() === debt.creditor);
      
      return {
        debtor: debt.debtor,
        debtorName: debtorMember ? (debtorMember as any).name || debt.debtor : debt.debtor,
        creditor: debt.creditor,
        creditorName: creditorMember ? (creditorMember as any).name || debt.creditor : debt.creditor,
        amount: debt.amount
      };
    });
    
    const stats = {
      balance: group.balance,
      contributionsByMember: contributionsByMember,
      memberStats,
      debts: formattedDebts,
      expensesByCategory: transactions.reduce((sum: Record<string, number>, t: any) => {
        const category = t.category || 'Other';
        sum[category] = (sum[category] || 0) + t.amount;
        return sum;
      }, {}),
      contributionsByMonth: contributions.reduce((sum: Record<string, number>, c: any) => {
        const month = c.createdAt.toISOString().slice(0, 7); // YYYY-MM format
        sum[month] = (sum[month] || 0) + c.amount;
        return sum;
      }, {})
    };
    
    return stats;
  } catch (error) {
    console.error('Error getting group statistics:', error);
    throw error;
  }
};
