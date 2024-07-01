import { ObjectId, Schema, model } from "mongoose";

interface Wallet {
  balance: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userId: ObjectId;
  status: string;
  accountName: string
  accountNumber: number
  bankName: string
  customerId: string;
  createdAt: Date; 
}

const walletSchema = new Schema<Wallet>({
    balance: { type: Number, default: 0 }, 
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    userId: { type:Schema.Types.ObjectId, ref: "User" },
    status: { type: String},
    accountName: { type: String},
    accountNumber: { type: Number},
    bankName: { type: String},
    customerId: {type: String},
    createdAt: { type: Date, default: Date.now }
}, {timestamps: true} )

const walletModel = model('Wallet', walletSchema)

export default walletModel