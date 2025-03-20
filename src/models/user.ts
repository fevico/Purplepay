import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IBvnData {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  phoneNumber: string;
  gender: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  verified: boolean;
  phoneNumber?: string;
  dateOfBirth?: Date;
  profileImage?: string;
  createdAt: Date;
  updatedAt: Date;
  bvn?: string;
  bvnVerified: boolean;
  bvnVerificationDate?: Date;
  bvnData?: IBvnData;
  tag?: string;
  tagPrivacy?: 'public' | 'friends' | 'private';
  profilePicture?: string;
  transactionPin?: string;
  verifyTransactionPin(pin: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    verified: {
      type: Boolean,
      default: false
    },
    phoneNumber: {
      type: String,
      trim: true
    },
    dateOfBirth: {
      type: Date
    },
    profileImage: {
      type: String
    },
    bvn: {
      type: String,
      trim: true
    },
    bvnVerified: {
      type: Boolean,
      default: false
    },
    bvnVerificationDate: {
      type: Date
    },
    bvnData: {
      firstName: String,
      lastName: String,
      middleName: String,
      dateOfBirth: String,
      phoneNumber: String,
      gender: String
    },
    tag: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/^[a-zA-Z0-9_]{3,20}$/, 'Tag must be 3-20 alphanumeric characters or underscores']
    },
    tagPrivacy: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'public'
    },
    profilePicture: {
      type: String
    },
    transactionPin: {
      type: String,
      minlength: [4, 'Transaction PIN must be at least 4 characters']
    }
  },
  {
    timestamps: true
  }
);

// Method to verify transaction PIN
UserSchema.methods.verifyTransactionPin = async function(pin: string): Promise<boolean> {
  try {
    if (!this.transactionPin) return false;
    return await bcrypt.compare(pin, this.transactionPin);
  } catch (error) {
    return false;
  }
};

// This is just an interface definition file, so we don't actually create the model
// The actual model is defined elsewhere in the codebase
export default mongoose.model<IUser>('User', UserSchema);
