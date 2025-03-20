import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user';
import { ISplitPaymentGroup } from './splitPaymentGroup';

export interface ISplitPaymentTransaction extends Document {
  group: mongoose.Types.ObjectId | ISplitPaymentGroup;
  initiator: mongoose.Types.ObjectId | IUser;
  amount: number;
  transactionId: string;
  paymentMethod: 'virtual_card' | 'bank_transfer' | 'bill_payment';
  recipient: string;
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  cardTransactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  approvals: Array<mongoose.Types.ObjectId | IUser>;
  requiresApproval: boolean;
  minApprovals: number;
}

const SplitPaymentTransactionSchema: Schema = new Schema(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: 'SplitPaymentGroup',
      required: [true, 'Group is required']
    },
    initiator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Initiator is required']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be at least 0.01']
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      trim: true,
      unique: true
    },
    paymentMethod: {
      type: String,
      enum: ['virtual_card', 'bank_transfer', 'bill_payment'],
      required: [true, 'Payment method is required']
    },
    recipient: {
      type: String,
      required: [true, 'Recipient is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    cardTransactionId: {
      type: String,
      trim: true
    },
    approvals: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    requiresApproval: {
      type: Boolean,
      default: false
    },
    minApprovals: {
      type: Number,
      default: 1,
      min: [1, 'Minimum approvals must be at least 1']
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for faster queries
SplitPaymentTransactionSchema.index({ group: 1 });
SplitPaymentTransactionSchema.index({ transactionId: 1 }, { unique: true });

export default mongoose.model<ISplitPaymentTransaction>('SplitPaymentTransaction', SplitPaymentTransactionSchema);
