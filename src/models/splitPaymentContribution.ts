import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user';
import { ISplitPaymentGroup } from './splitPaymentGroup';

export interface ISplitPaymentContribution extends Document {
  group: mongoose.Types.ObjectId | ISplitPaymentGroup;
  contributor: mongoose.Types.ObjectId | IUser;
  amount: number;
  transactionId: string;
  status: 'pending' | 'completed' | 'failed';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SplitPaymentContributionSchema: Schema = new Schema(
  {
    group: {
      type: Schema.Types.ObjectId,
      ref: 'SplitPaymentGroup',
      required: [true, 'Group is required']
    },
    contributor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Contributor is required']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be at least 0.01']
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [200, 'Notes cannot exceed 200 characters']
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for faster queries
SplitPaymentContributionSchema.index({ group: 1, contributor: 1 });
SplitPaymentContributionSchema.index({ transactionId: 1 }, { unique: true });

export default mongoose.model<ISplitPaymentContribution>('SplitPaymentContribution', SplitPaymentContributionSchema);
