import mongoose, { Document, Schema } from 'mongoose';
import { calculateNextDate } from '../utils/helpers';

/**
 * Digital Savings Group Model (Ajo/Esusu)
 * This model represents traditional Nigerian savings groups in digital form
 */

export interface ISavingsGroupMember {
  userId: mongoose.Types.ObjectId;
  joinDate: Date;
  position: number; // Position in rotation
  hasPaidCurrentCycle: boolean;
  hasReceivedCurrentCycle: boolean;
  totalContributed: number;
  totalReceived: number;
}

export interface ISavingsGroup extends Document {
  name: string;
  description: string;
  creatorId: mongoose.Types.ObjectId;
  contributionAmount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  currentCycle: number;
  totalCycles: number;
  nextContributionDate: Date;
  nextPayoutDate: Date;
  currentPayoutPosition: number;
  members: ISavingsGroupMember[];
  isActive: boolean;
  isPublic: boolean;
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
  calculateNextDates(): { nextContributionDate: Date; nextPayoutDate: Date };
  allMembersPaid(): boolean;
  processPayout(): {
    success: boolean;
    message?: string;
    payoutMemberId?: mongoose.Types.ObjectId;
    payoutAmount?: number;
    newCycle?: number;
    isCompleted?: boolean;
  };
}

const SavingsGroupMemberSchema = new Schema<ISavingsGroupMember>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  position: {
    type: Number,
    required: true
  },
  hasPaidCurrentCycle: {
    type: Boolean,
    default: false
  },
  hasReceivedCurrentCycle: {
    type: Boolean,
    default: false
  },
  totalContributed: {
    type: Number,
    default: 0
  },
  totalReceived: {
    type: Number,
    default: 0
  }
});

const SavingsGroupSchema = new Schema<ISavingsGroup>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  contributionAmount: {
    type: Number,
    required: true,
    min: 100 // Minimum contribution amount (e.g., 100 Naira)
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  currentCycle: {
    type: Number,
    default: 0
  },
  totalCycles: {
    type: Number,
    required: true
  },
  nextContributionDate: {
    type: Date
  },
  nextPayoutDate: {
    type: Date
  },
  currentPayoutPosition: {
    type: Number,
    default: 0
  },
  members: [SavingsGroupMemberSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  inviteCode: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to generate invite code if not provided
SavingsGroupSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    // Generate a random 8-character alphanumeric code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    this.inviteCode = code;
  }
  
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  next();
});

// Calculate next contribution and payout dates based on frequency
SavingsGroupSchema.methods.calculateNextDates = function() {
  const now = new Date();
  let nextContribution = new Date(this.nextContributionDate || this.startDate);
  
  // If next contribution date is in the past, calculate the next one
  if (nextContribution < now) {
    while (nextContribution < now) {
      switch (this.frequency) {
        case 'daily':
          nextContribution.setDate(nextContribution.getDate() + 1);
          break;
        case 'weekly':
          nextContribution.setDate(nextContribution.getDate() + 7);
          break;
        case 'biweekly':
          nextContribution.setDate(nextContribution.getDate() + 14);
          break;
        case 'monthly':
          nextContribution.setMonth(nextContribution.getMonth() + 1);
          break;
      }
    }
  }
  
  this.nextContributionDate = nextContribution;
  
  // Next payout is typically the same as next contribution
  // but could be different based on specific rules
  this.nextPayoutDate = new Date(nextContribution);
  
  return {
    nextContributionDate: this.nextContributionDate,
    nextPayoutDate: this.nextPayoutDate
  };
};

// Check if all members have paid for the current cycle
SavingsGroupSchema.methods.allMembersPaid = function() {
  return this.members.every((member: ISavingsGroupMember) => member.hasPaidCurrentCycle);
};

// Process payout for the current cycle
SavingsGroupSchema.methods.processPayout = function() {
  if (!this.allMembersPaid()) {
    return {
      success: false,
      message: 'Not all members have paid for this cycle'
    };
  }
  
  // Find the member who should receive the payout for this cycle
  const payoutMember = this.members.find((member: ISavingsGroupMember) => member.position === this.currentPayoutPosition);
  
  if (!payoutMember) {
    return {
      success: false,
      message: 'Payout member not found'
    };
  }
  
  // Calculate total payout amount (sum of all contributions)
  const payoutAmount = this.contributionAmount * this.members.length;
  
  // Mark member as having received payout
  payoutMember.hasReceivedCurrentCycle = true;
  payoutMember.totalReceived += payoutAmount;
  
  // Move to next cycle
  this.currentCycle += 1;
  
  // Reset payment status for all members
  this.members.forEach((member: ISavingsGroupMember) => {
    member.hasPaidCurrentCycle = false;
  });
  
  // Move to next position in rotation
  this.currentPayoutPosition = (this.currentPayoutPosition + 1) % this.members.length;
  
  // Calculate next dates
  this.calculateNextDates();
  
  // Check if we've completed all cycles
  if (this.currentCycle >= this.totalCycles) {
    this.isActive = false;
    this.endDate = new Date();
  }
  
  return {
    success: true,
    payoutMemberId: payoutMember.userId,
    payoutAmount,
    newCycle: this.currentCycle,
    isCompleted: !this.isActive
  };
};

const SavingsGroup = mongoose.model<ISavingsGroup>('SavingsGroup', SavingsGroupSchema);

export default SavingsGroup;
