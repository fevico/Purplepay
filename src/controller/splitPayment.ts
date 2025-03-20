import { Request, Response } from "express";
import mongoose from "mongoose";
import SplitPaymentGroup from "../models/splitPaymentGroup";
import SplitPaymentContribution from "../models/splitPaymentContribution";
import User from "../model/user";
import { createNotification } from "./notification";
import * as splitPaymentService from '../services/splitPayment';

/**
 * Create a new split payment group
 */
export const createGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Creating split payment group with data:', req.body);
    console.log('User ID from request:', req.user?.id);
    
    const { name, description, paymentPurpose, targetAmount, dueDate } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }
    
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
      return;
    }
    
    const group = await splitPaymentService.createSplitPaymentGroup(
      name,
      userId,
      description,
      paymentPurpose,
      targetAmount,
      dueDate ? new Date(dueDate) : undefined
    );
    
    console.log('Group created successfully:', group);
    
    res.status(201).json({
      success: true,
      message: 'Split payment group created successfully',
      data: group
    });
  } catch (error) {
    console.error('Error creating split payment group:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

/**
 * Get all groups for the current user
 */
export const getUserGroups = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    const groups = await splitPaymentService.getUserSplitPaymentGroups(userId);
    
    res.status(200).json({
      success: true,
      message: 'User groups retrieved successfully',
      data: groups
    });
  } catch (error) {
    console.error('Error getting user groups:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

/**
 * Get a group by ID
 */
export const getGroupById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
      return;
    }
    
    const group = await splitPaymentService.getSplitPaymentGroupById(groupId);
    
    if (!group) {
      res.status(404).json({
        success: false,
        message: 'Group not found'
      });
      return;
    }
    
    // Format members data
    const formattedMembers = group.members.map((member: any) => {
      return {
        _id: member._id,
        name: member.name,
        email: member.email,
        tag: member.tag
      };
    });
    
    // Check if the user is a member of the group
    if (!formattedMembers.some(member => member._id.toString() === userId)) {
      res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      message: 'Group retrieved successfully',
      data: {
        ...group,
        members: formattedMembers
      }
    });
  } catch (error) {
    console.error('Error getting group by ID:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

/**
 * Join a group using an invite code
 */
export const joinGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user?.id;
    
    if (!inviteCode) {
      res.status(400).json({
        success: false,
        message: 'Invite code is required'
      });
      return;
    }
    
    const group = await splitPaymentService.joinSplitPaymentGroup(inviteCode, userId);
    
    res.status(200).json({
      success: true,
      message: 'Successfully joined the group',
      data: group
    });
  } catch (error) {
    console.error('Error joining group:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

/**
 * Contribute to a group
 */
export const contributeToGroup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId, amount, notes } = req.body;
    const userId = req.user?.id;
    
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      res.status(400).json({
        success: false,
        message: 'Valid group ID is required'
      });
      return;
    }
    
    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
      return;
    }
    
    const contribution = await splitPaymentService.contributeToGroup(
      groupId,
      userId,
      amount,
      notes
    );
    
    res.status(200).json({
      success: true,
      message: 'Contribution successful',
      data: contribution
    });
  } catch (error) {
    console.error('Error contributing to group:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

/**
 * Make a payment from a group
 */
export const makeGroupPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      groupId,
      amount,
      paymentMethod,
      recipient,
      description,
      requiresApproval,
      minApprovals
    } = req.body;
    const userId = req.user?.id;
    
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      res.status(400).json({
        success: false,
        message: 'Valid group ID is required'
      });
      return;
    }
    
    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
      return;
    }
    
    if (!paymentMethod || !['virtual_card', 'bank_transfer', 'bill_payment'].includes(paymentMethod)) {
      res.status(400).json({
        success: false,
        message: 'Valid payment method is required'
      });
      return;
    }
    
    if (!recipient) {
      res.status(400).json({
        success: false,
        message: 'Recipient is required'
      });
      return;
    }
    
    const transaction = await splitPaymentService.makePayment(
      groupId,
      userId,
      amount,
      paymentMethod as 'virtual_card' | 'bank_transfer' | 'bill_payment',
      recipient,
      description,
      requiresApproval,
      minApprovals
    );
    
    res.status(200).json({
      success: true,
      message: requiresApproval && transaction.status === 'pending'
        ? 'Payment initiated and awaiting approval'
        : 'Payment successful',
      data: transaction
    });
  } catch (error) {
    console.error('Error making group payment:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

/**
 * Approve a group payment
 */
export const approveGroupPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.body;
    const userId = req.user?.id;
    
    if (!transactionId) {
      res.status(400).json({
        success: false,
        message: 'Transaction ID is required'
      });
      return;
    }
    
    const transaction = await splitPaymentService.approveGroupPayment(transactionId, userId);
    
    res.status(200).json({
      success: true,
      message: transaction.status === 'completed'
        ? 'Payment approved and completed'
        : 'Payment approved but awaiting more approvals',
      data: transaction
    });
  } catch (error) {
    console.error('Error approving group payment:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

/**
 * Get all contributions for a group
 */
export const getGroupContributions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
      return;
    }
    
    // Check if the user is a member of the group
    const group = await splitPaymentService.getSplitPaymentGroupById(groupId);
    
    if (!group) {
      res.status(404).json({
        success: false,
        message: 'Group not found'
      });
      return;
    }
    
    // Format members data
    const formattedMembers = group.members.map((member: any) => {
      return {
        _id: member._id,
        name: member.name,
        email: member.email,
        tag: member.tag
      };
    });
    
    if (!formattedMembers.some(member => member._id.toString() === userId)) {
      res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
      return;
    }
    
    const contributions = await splitPaymentService.getGroupContributions(groupId);
    
    res.status(200).json({
      success: true,
      message: 'Group contributions retrieved successfully',
      data: contributions
    });
  } catch (error) {
    console.error('Error getting group contributions:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

/**
 * Get all transactions for a group
 */
export const getGroupTransactions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
      return;
    }
    
    // Check if the user is a member of the group
    const group = await splitPaymentService.getSplitPaymentGroupById(groupId);
    
    if (!group) {
      res.status(404).json({
        success: false,
        message: 'Group not found'
      });
      return;
    }
    
    // Format members data
    const formattedMembers = group.members.map((member: any) => {
      return {
        _id: member._id,
        name: member.name,
        email: member.email,
        tag: member.tag
      };
    });
    
    if (!formattedMembers.some(member => member._id.toString() === userId)) {
      res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
      return;
    }
    
    const transactions = await splitPaymentService.getGroupTransactions(groupId);
    
    res.status(200).json({
      success: true,
      message: 'Group transactions retrieved successfully',
      data: transactions
    });
  } catch (error) {
    console.error('Error getting group transactions:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

/**
 * Get group statistics
 */
export const getGroupStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const userId = req.user?.id;
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
      return;
    }
    
    // Check if the user is a member of the group
    const group = await splitPaymentService.getSplitPaymentGroupById(groupId);
    
    if (!group) {
      res.status(404).json({
        success: false,
        message: 'Group not found'
      });
      return;
    }
    
    // Format members data
    const formattedMembers = group.members.map((member: any) => {
      return {
        _id: member._id,
        name: member.name,
        email: member.email,
        tag: member.tag
      };
    });
    
    if (!formattedMembers.some(member => member._id.toString() === userId)) {
      res.status(403).json({
        success: false,
        message: 'You are not a member of this group'
      });
      return;
    }
    
    const statistics = await splitPaymentService.getGroupStatistics(groupId);
    
    res.status(200).json({
      success: true,
      message: 'Group statistics retrieved successfully',
      data: statistics
    });
  } catch (error) {
    console.error('Error getting group statistics:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};

/**
 * Settle a debt between group members
 */
export const settleDebt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId, debtorId, creditorId, amount } = req.body;
    const userId = req.user?.id;
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid group ID'
      });
      return;
    }
    
    if (!mongoose.Types.ObjectId.isValid(debtorId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid debtor ID'
      });
      return;
    }
    
    if (!mongoose.Types.ObjectId.isValid(creditorId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid creditor ID'
      });
      return;
    }
    
    if (!amount || amount <= 0) {
      res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
      return;
    }
    
    // Check if the user is the debtor (only the debtor can settle their debt)
    if (userId !== debtorId) {
      res.status(403).json({
        success: false,
        message: 'You can only settle your own debts'
      });
      return;
    }
    
    // Check if both users are members of the group
    const group = await splitPaymentService.getSplitPaymentGroupById(groupId);
    
    if (!group) {
      res.status(404).json({
        success: false,
        message: 'Group not found'
      });
      return;
    }
    
    const isDebtorMember = group.members.some(member => (member as any).id.toString() === debtorId);
    const isCreditorMember = group.members.some(member => (member as any).id.toString() === creditorId);
    
    if (!isDebtorMember || !isCreditorMember) {
      res.status(403).json({
        success: false,
        message: 'Both users must be members of the group'
      });
      return;
    }
    
    // Create a contribution record for the debtor
    const contribution = await splitPaymentService.contributeToGroup(
      groupId,
      debtorId,
      amount,
      `Debt settlement to ${creditorId}`
    );
    
    // Get updated statistics
    const statistics = await splitPaymentService.getGroupStatistics(groupId);
    
    // Format debtors data for response
    const debtors = group.members.filter((member: any) => member.id.toString() === debtorId);
    const formattedDebtors = debtors.map((member: any) => {
      return {
        _id: member._id,
        name: member.name,
        email: member.email,
        amount: member.amount
      };
    });
    
    res.status(200).json({
      success: true,
      message: 'Debt settled successfully',
      data: {
        contribution,
        statistics,
        debtors: formattedDebtors
      }
    });
  } catch (error) {
    console.error('Error settling debt:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    });
  }
};
