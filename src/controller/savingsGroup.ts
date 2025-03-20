import { Request, Response } from 'express';
import SavingsGroup from '../models/savingsGroup';
import User from '../models/user';
import Wallet from '../models/wallet';
import Transaction from '../models/transaction';
import { generateTransactionReference } from '../utils/helpers';
import mongoose from 'mongoose';

/**
 * Digital Savings Group Controller (Ajo/Esusu)
 * This controller handles traditional Nigerian savings groups in digital form
 */

/**
 * Create a new savings group
 * @param req Request
 * @param res Response
 */
export const createSavingsGroup = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      contributionAmount,
      frequency,
      startDate,
      totalCycles,
      isPublic
    } = req.body;
    
    const userId = req.user.id;
    
    // Validate input
    if (!name || !contributionAmount || !frequency || !startDate || !totalCycles) {
      return res.status(400).json({
        message: 'Missing required fields'
      });
    }
    
    // Validate contribution amount
    if (contributionAmount < 100) {
      return res.status(400).json({
        message: 'Contribution amount must be at least 100 NGN'
      });
    }
    
    // Validate total cycles
    if (totalCycles < 1) {
      return res.status(400).json({
        message: 'Total cycles must be at least 1'
      });
    }
    
    // Validate start date
    const parsedStartDate = new Date(startDate);
    if (isNaN(parsedStartDate.getTime()) || parsedStartDate < new Date()) {
      return res.status(400).json({
        message: 'Start date must be a valid date in the future'
      });
    }
    
    // Create new savings group
    const savingsGroup = new SavingsGroup({
      name,
      description,
      creatorId: userId,
      contributionAmount,
      frequency,
      startDate: parsedStartDate,
      totalCycles,
      isPublic: isPublic || false,
      members: [{
        userId,
        position: 0,
        hasPaidCurrentCycle: false,
        hasReceivedCurrentCycle: false,
        totalContributed: 0,
        totalReceived: 0
      }]
    });
    
    // Calculate next contribution and payout dates
    savingsGroup.calculateNextDates();
    
    // Save savings group
    await savingsGroup.save();
    
    return res.status(201).json({
      message: 'Savings group created successfully',
      savingsGroup: {
        id: savingsGroup._id,
        name: savingsGroup.name,
        contributionAmount: savingsGroup.contributionAmount,
        frequency: savingsGroup.frequency,
        startDate: savingsGroup.startDate,
        totalCycles: savingsGroup.totalCycles,
        inviteCode: savingsGroup.inviteCode,
        memberCount: savingsGroup.members.length
      }
    });
    
  } catch (error) {
    console.error('Create Savings Group Error:', error);
    return res.status(500).json({
      message: 'An error occurred while creating the savings group'
    });
  }
};

/**
 * Get all savings groups for a user
 * @param req Request
 * @param res Response
 */
export const getUserSavingsGroups = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    // Find all savings groups where user is a member
    const savingsGroups = await SavingsGroup.find({
      'members.userId': userId
    }).sort({ createdAt: -1 });
    
    // Format response
    const formattedGroups = savingsGroups.map(group => ({
      id: group._id,
      name: group.name,
      description: group.description,
      contributionAmount: group.contributionAmount,
      currency: group.currency,
      frequency: group.frequency,
      startDate: group.startDate,
      currentCycle: group.currentCycle,
      totalCycles: group.totalCycles,
      nextContributionDate: group.nextContributionDate,
      nextPayoutDate: group.nextPayoutDate,
      memberCount: group.members.length,
      isActive: group.isActive,
      isCreator: group.creatorId.toString() === userId,
      myPosition: group.members.find(member => member.userId.toString() === userId)?.position || 0,
      inviteCode: group.inviteCode
    }));
    
    return res.status(200).json({
      savingsGroups: formattedGroups
    });
    
  } catch (error) {
    console.error('Get User Savings Groups Error:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching savings groups'
    });
  }
};

/**
 * Get a single savings group by ID
 * @param req Request
 * @param res Response
 */
export const getSavingsGroupById = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    // Validate group ID
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        message: 'Invalid group ID'
      });
    }
    
    // Find savings group
    const savingsGroup = await SavingsGroup.findById(groupId);
    
    if (!savingsGroup) {
      return res.status(404).json({
        message: 'Savings group not found'
      });
    }
    
    // Check if user is a member
    const isMember = savingsGroup.members.some(member => member.userId.toString() === userId);
    
    if (!isMember && !savingsGroup.isPublic) {
      return res.status(403).json({
        message: 'You do not have access to this savings group'
      });
    }
    
    // Get member details with names
    const memberIds = savingsGroup.members.map(member => member.userId);
    const users = await User.find({ _id: { $in: memberIds } }).select('_id name tag profilePicture');
    
    const membersWithDetails = savingsGroup.members.map(member => {
      const user = users.find(u => u._id.toString() === member.userId.toString());
      return {
        userId: member.userId,
        name: user?.name || 'Unknown User',
        tag: user?.tag || '',
        profilePicture: user?.profilePicture || '',
        position: member.position,
        hasPaidCurrentCycle: member.hasPaidCurrentCycle,
        hasReceivedCurrentCycle: member.hasReceivedCurrentCycle,
        totalContributed: member.totalContributed,
        totalReceived: member.totalReceived,
        joinDate: member.joinDate
      };
    });
    
    // Format response
    const formattedGroup = {
      id: savingsGroup._id,
      name: savingsGroup.name,
      description: savingsGroup.description,
      contributionAmount: savingsGroup.contributionAmount,
      currency: savingsGroup.currency,
      frequency: savingsGroup.frequency,
      startDate: savingsGroup.startDate,
      endDate: savingsGroup.endDate,
      currentCycle: savingsGroup.currentCycle,
      totalCycles: savingsGroup.totalCycles,
      nextContributionDate: savingsGroup.nextContributionDate,
      nextPayoutDate: savingsGroup.nextPayoutDate,
      currentPayoutPosition: savingsGroup.currentPayoutPosition,
      isActive: savingsGroup.isActive,
      isPublic: savingsGroup.isPublic,
      inviteCode: savingsGroup.inviteCode,
      creatorId: savingsGroup.creatorId,
      isCreator: savingsGroup.creatorId.toString() === userId,
      members: membersWithDetails,
      createdAt: savingsGroup.createdAt,
      updatedAt: savingsGroup.updatedAt
    };
    
    return res.status(200).json({
      savingsGroup: formattedGroup
    });
    
  } catch (error) {
    console.error('Get Savings Group By ID Error:', error);
    return res.status(500).json({
      message: 'An error occurred while fetching the savings group'
    });
  }
};

/**
 * Join a savings group using invite code
 * @param req Request
 * @param res Response
 */
export const joinSavingsGroup = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const userId = req.user.id;
    
    if (!inviteCode) {
      return res.status(400).json({
        message: 'Invite code is required'
      });
    }
    
    // Find savings group by invite code
    const savingsGroup = await SavingsGroup.findOne({ inviteCode });
    
    if (!savingsGroup) {
      return res.status(404).json({
        message: 'Savings group not found'
      });
    }
    
    // Check if group is active
    if (!savingsGroup.isActive) {
      return res.status(400).json({
        message: 'This savings group is no longer active'
      });
    }
    
    // Check if user is already a member
    const isMember = savingsGroup.members.some(member => member.userId.toString() === userId);
    
    if (isMember) {
      return res.status(400).json({
        message: 'You are already a member of this savings group'
      });
    }
    
    // Add user to group
    const newPosition = savingsGroup.members.length;
    
    savingsGroup.members.push({
      userId: new mongoose.Types.ObjectId(userId),
      position: newPosition,
      hasPaidCurrentCycle: false,
      hasReceivedCurrentCycle: false,
      totalContributed: 0,
      totalReceived: 0,
      joinDate: new Date()
    });
    
    await savingsGroup.save();
    
    return res.status(200).json({
      message: 'Successfully joined savings group',
      savingsGroup: {
        id: savingsGroup._id,
        name: savingsGroup.name,
        contributionAmount: savingsGroup.contributionAmount,
        frequency: savingsGroup.frequency,
        myPosition: newPosition
      }
    });
    
  } catch (error) {
    console.error('Join Savings Group Error:', error);
    return res.status(500).json({
      message: 'An error occurred while joining the savings group'
    });
  }
};

/**
 * Make a contribution to a savings group
 * @param req Request
 * @param res Response
 */
export const makeContribution = async (req: Request, res: Response) => {
  try {
    const { groupId, transactionPin } = req.body;
    const userId = req.user.id;
    
    if (!groupId || !transactionPin) {
      return res.status(400).json({
        message: 'Group ID and transaction PIN are required'
      });
    }
    
    // Find user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    // Verify transaction PIN
    const isValidPin = await user.verifyTransactionPin(transactionPin);
    
    if (!isValidPin) {
      return res.status(401).json({
        message: 'Invalid transaction PIN'
      });
    }
    
    // Find savings group
    const savingsGroup = await SavingsGroup.findById(groupId);
    
    if (!savingsGroup) {
      return res.status(404).json({
        message: 'Savings group not found'
      });
    }
    
    // Check if group is active
    if (!savingsGroup.isActive) {
      return res.status(400).json({
        message: 'This savings group is no longer active'
      });
    }
    
    // Find member in group
    const memberIndex = savingsGroup.members.findIndex(member => member.userId.toString() === userId);
    
    if (memberIndex === -1) {
      return res.status(403).json({
        message: 'You are not a member of this savings group'
      });
    }
    
    // Check if member has already paid for current cycle
    if (savingsGroup.members[memberIndex].hasPaidCurrentCycle) {
      return res.status(400).json({
        message: 'You have already contributed for the current cycle'
      });
    }
    
    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });
    
    if (!wallet) {
      return res.status(404).json({
        message: 'Wallet not found'
      });
    }
    
    // Check if wallet has sufficient balance
    if (wallet.balance < savingsGroup.contributionAmount) {
      return res.status(400).json({
        message: 'Insufficient wallet balance'
      });
    }
    
    // Create transaction reference
    const reference = generateTransactionReference();
    
    // Update wallet balance
    wallet.balance -= savingsGroup.contributionAmount;
    await wallet.save();
    
    // Create transaction record
    await Transaction.create({
      userId,
      type: 'savings_contribution',
      amount: savingsGroup.contributionAmount,
      currency: savingsGroup.currency,
      status: 'completed',
      reference,
      description: `Contribution to ${savingsGroup.name} (Cycle ${savingsGroup.currentCycle + 1})`,
      metadata: {
        savingsGroupId: savingsGroup._id,
        cycle: savingsGroup.currentCycle + 1
      }
    });
    
    // Update member's contribution status
    savingsGroup.members[memberIndex].hasPaidCurrentCycle = true;
    savingsGroup.members[memberIndex].totalContributed += savingsGroup.contributionAmount;
    
    // Check if all members have paid
    const allPaid = savingsGroup.allMembersPaid();
    
    // If all members have paid, process payout
    let payoutResult = null;
    
    if (allPaid) {
      payoutResult = savingsGroup.processPayout();
      
      if (payoutResult.success) {
        // Create transaction for payout recipient
        await Transaction.create({
          userId: payoutResult.payoutMemberId,
          type: 'savings_payout',
          amount: payoutResult.payoutAmount,
          currency: savingsGroup.currency,
          status: 'completed',
          reference: generateTransactionReference(),
          description: `Payout from ${savingsGroup.name} (Cycle ${savingsGroup.currentCycle})`,
          metadata: {
            savingsGroupId: savingsGroup._id,
            cycle: savingsGroup.currentCycle
          }
        });
        
        // Update recipient's wallet
        const recipientWallet = await Wallet.findOne({ userId: payoutResult.payoutMemberId });
        
        if (recipientWallet) {
          recipientWallet.balance += payoutResult.payoutAmount;
          await recipientWallet.save();
        }
      }
    }
    
    await savingsGroup.save();
    
    return res.status(200).json({
      message: 'Contribution successful',
      contribution: {
        amount: savingsGroup.contributionAmount,
        cycle: savingsGroup.currentCycle + 1,
        newWalletBalance: wallet.balance
      },
      payoutProcessed: allPaid,
      payoutDetails: payoutResult
    });
    
  } catch (error) {
    console.error('Make Contribution Error:', error);
    return res.status(500).json({
      message: 'An error occurred while making the contribution'
    });
  }
};

/**
 * Leave a savings group
 * @param req Request
 * @param res Response
 */
export const leaveSavingsGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    // Find savings group
    const savingsGroup = await SavingsGroup.findById(groupId);
    
    if (!savingsGroup) {
      return res.status(404).json({
        message: 'Savings group not found'
      });
    }
    
    // Check if user is the creator
    if (savingsGroup.creatorId.toString() === userId) {
      return res.status(400).json({
        message: 'Group creator cannot leave the group. You can delete the group instead.'
      });
    }
    
    // Check if user is a member
    const memberIndex = savingsGroup.members.findIndex(member => member.userId.toString() === userId);
    
    if (memberIndex === -1) {
      return res.status(403).json({
        message: 'You are not a member of this savings group'
      });
    }
    
    // Check if user has pending obligations
    if (savingsGroup.isActive && !savingsGroup.members[memberIndex].hasPaidCurrentCycle) {
      return res.status(400).json({
        message: 'You cannot leave the group until you have paid your contribution for the current cycle'
      });
    }
    
    // Remove user from group
    savingsGroup.members = savingsGroup.members.filter(member => member.userId.toString() !== userId);
    
    // If no members left, deactivate the group
    if (savingsGroup.members.length === 0) {
      savingsGroup.isActive = false;
    }
    
    await savingsGroup.save();
    
    return res.status(200).json({
      message: 'Successfully left the savings group'
    });
    
  } catch (error) {
    console.error('Leave Savings Group Error:', error);
    return res.status(500).json({
      message: 'An error occurred while leaving the savings group'
    });
  }
};

/**
 * Delete a savings group (creator only)
 * @param req Request
 * @param res Response
 */
export const deleteSavingsGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;
    
    // Find savings group
    const savingsGroup = await SavingsGroup.findById(groupId);
    
    if (!savingsGroup) {
      return res.status(404).json({
        message: 'Savings group not found'
      });
    }
    
    // Check if user is the creator
    if (savingsGroup.creatorId.toString() !== userId) {
      return res.status(403).json({
        message: 'Only the creator can delete the savings group'
      });
    }
    
    // Check if group has active cycles with contributions
    if (savingsGroup.isActive && savingsGroup.currentCycle > 0) {
      return res.status(400).json({
        message: 'Cannot delete an active savings group with ongoing cycles'
      });
    }
    
    // Delete the group
    await SavingsGroup.findByIdAndDelete(groupId);
    
    return res.status(200).json({
      message: 'Savings group deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete Savings Group Error:', error);
    return res.status(500).json({
      message: 'An error occurred while deleting the savings group'
    });
  }
};
