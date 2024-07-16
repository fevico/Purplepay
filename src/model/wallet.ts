import { ObjectId, Schema, model } from "mongoose";

interface Wallet {
  balance: number;
  bankName: string;
  accountName: string;
  accountNumber: number;
  userId: ObjectId;
  createdAt: Date; 
}

const walletSchema = new Schema<Wallet>({
    balance: { type: Number, default: 0},
    accountName: { type: String},
    accountNumber: { type: Number},
    bankName: { type: String},
    userId: { type:Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now }
}, {timestamps: true} )

const walletModel = model('Wallet', walletSchema)

export default walletModel