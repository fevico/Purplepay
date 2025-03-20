import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  type: "funding" | "withdrawal" | "transfer" | "bill_payment" | "other";
  amount: number;
  currency: string;
  reference: string;
  status: "pending" | "completed" | "failed";
  description: string;
  metadata: {
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    type: {
      type: String,
      enum: ["funding", "withdrawal", "transfer", "bill_payment", "other"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    description: {
      type: String,
      default: "",
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
transactionSchema.index({ userId: 1 });
transactionSchema.index({ walletId: 1 });
transactionSchema.index({ reference: 1 }, { unique: true });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: 1 });

// Check if model already exists to prevent "OverwriteModelError"
const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", transactionSchema);

export default Transaction;
