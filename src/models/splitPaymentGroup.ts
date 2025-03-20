import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './user';

export interface ISplitPaymentGroup extends Document {
  name: string;
  description?: string;
  creator: mongoose.Types.ObjectId | IUser;
  members: Array<mongoose.Types.ObjectId | IUser>;
  virtualAccountId?: string;
  cardId?: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  inviteCode: string;
  paymentPurpose?: string;
  targetAmount?: number;
  dueDate?: Date;
}

const SplitPaymentGroupSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required']
    },
    members: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    virtualAccountId: {
      type: String,
      trim: true
    },
    cardId: {
      type: String,
      trim: true
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    inviteCode: {
      type: String,
      unique: true,
      required: [true, 'Invite code is required']
    },
    paymentPurpose: {
      type: String,
      trim: true,
      maxlength: [200, 'Payment purpose cannot exceed 200 characters']
    },
    targetAmount: {
      type: Number,
      min: [0, 'Target amount cannot be negative']
    },
    dueDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Create a unique index on the invite code
SplitPaymentGroupSchema.index({ inviteCode: 1 }, { unique: true });

export default mongoose.model<ISplitPaymentGroup>('SplitPaymentGroup', SplitPaymentGroupSchema);
