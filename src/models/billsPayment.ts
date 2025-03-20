import mongoose, { Document, Schema } from 'mongoose';

export interface IBillsPayment extends Document {
  userId: mongoose.Types.ObjectId;
  walletId: mongoose.Types.ObjectId;
  billType: string;
  provider: string;
  customerReference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  transactionId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const billsPaymentSchema = new Schema<IBillsPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    billType: {
      type: String,
      required: true,
      enum: ['electricity', 'water', 'internet', 'tv', 'education', 'tax', 'other'],
    },
    provider: {
      type: String,
      required: true,
    },
    customerReference: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'NGN',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for faster queries
billsPaymentSchema.index({ userId: 1 });
billsPaymentSchema.index({ reference: 1 }, { unique: true });
billsPaymentSchema.index({ customerReference: 1 });
billsPaymentSchema.index({ status: 1 });
billsPaymentSchema.index({ createdAt: 1 });

export default mongoose.model<IBillsPayment>('BillsPayment', billsPaymentSchema);
