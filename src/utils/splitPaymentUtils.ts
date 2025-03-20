import mongoose from 'mongoose';
import SplitPaymentGroupModel, { ISplitPaymentGroup } from '../models/splitPaymentGroup';

/**
 * Check if a user is a member of a split payment group
 */
export const isGroupMember = async (
  groupId: mongoose.Types.ObjectId | string,
  userId: mongoose.Types.ObjectId | string
): Promise<boolean> => {
  try {
    const group = await SplitPaymentGroupModel.findById(groupId);
    
    if (!group) {
      return false;
    }
    
    return group.members.some(member => member.toString() === userId.toString());
  } catch (error) {
    console.error('Error checking group membership:', error);
    return false;
  }
};

/**
 * Get member contribution statistics for a group
 */
export const getMemberContributionStats = (
  group: ISplitPaymentGroup,
  contributionByMember: Record<string, number>
): Array<{
  memberId: string;
  name?: string;
  email?: string;
  contributionAmount: number;
  contributionPercentage: number;
}> => {
  // Calculate total contributions
  const totalContributions = Object.values(contributionByMember).reduce((sum, amount) => sum + amount, 0);
  
  // Create stats for each member
  return group.members.map(member => {
    const memberId = (member as any)._id.toString();
    const contributionAmount = contributionByMember[memberId] || 0;
    const contributionPercentage = totalContributions > 0 
      ? (contributionAmount / totalContributions) * 100 
      : 0;
    
    return {
      memberId,
      name: (member as any).name,
      email: (member as any).email,
      contributionAmount,
      contributionPercentage
    };
  });
};

/**
 * Calculate fair share amount for each member
 */
export const calculateFairShares = (
  group: ISplitPaymentGroup,
  totalAmount: number
): Record<string, number> => {
  const memberCount = group.members.length;
  if (memberCount === 0) return {};
  
  const fairSharePerMember = totalAmount / memberCount;
  
  // Create a map of member ID to fair share amount
  const fairShares: Record<string, number> = {};
  
  group.members.forEach(member => {
    const memberId = member.toString();
    fairShares[memberId] = fairSharePerMember;
  });
  
  return fairShares;
};

/**
 * Calculate who owes what to whom in a group
 */
export const calculateDebts = (
  group: ISplitPaymentGroup,
  contributionByMember: Record<string, number>
): Array<{
  debtor: string;
  creditor: string;
  amount: number;
}> => {
  const memberCount = group.members.length;
  if (memberCount <= 1) return [];
  
  // Calculate total contributions
  const totalContributions = Object.values(contributionByMember).reduce((sum, amount) => sum + amount, 0);
  
  // Calculate fair share per member
  const fairSharePerMember = totalContributions / memberCount;
  
  // Calculate net balance for each member (positive means they've contributed more than their fair share)
  const memberBalances: Record<string, number> = {};
  
  group.members.forEach(member => {
    const memberId = member.toString();
    const contribution = contributionByMember[memberId] || 0;
    memberBalances[memberId] = contribution - fairSharePerMember;
  });
  
  // Separate debtors (negative balance) and creditors (positive balance)
  const debtors: Array<{ id: string; amount: number }> = [];
  const creditors: Array<{ id: string; amount: number }> = [];
  
  Object.entries(memberBalances).forEach(([memberId, balance]) => {
    if (balance < 0) {
      debtors.push({ id: memberId, amount: Math.abs(balance) });
    } else if (balance > 0) {
      creditors.push({ id: memberId, amount: balance });
    }
  });
  
  // Sort by amount (descending)
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);
  
  // Calculate who owes what to whom
  const debts: Array<{ debtor: string; creditor: string; amount: number }> = [];
  
  debtors.forEach(debtor => {
    let remainingDebt = debtor.amount;
    
    // While this debtor still has debt and there are creditors to pay
    while (remainingDebt > 0.01 && creditors.length > 0) {
      const creditor = creditors[0];
      
      // Calculate how much can be paid to this creditor
      const paymentAmount = Math.min(remainingDebt, creditor.amount);
      
      // Round to 2 decimal places to avoid floating point issues
      const roundedPaymentAmount = Math.round(paymentAmount * 100) / 100;
      
      if (roundedPaymentAmount > 0) {
        // Add the debt
        debts.push({
          debtor: debtor.id,
          creditor: creditor.id,
          amount: roundedPaymentAmount
        });
        
        // Update remaining amounts
        remainingDebt -= roundedPaymentAmount;
        creditor.amount -= roundedPaymentAmount;
      }
      
      // If creditor is fully paid, remove them from the list
      if (creditor.amount < 0.01) {
        creditors.shift();
      }
    }
  });
  
  return debts;
};
