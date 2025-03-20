import mongoose, { Schema, Document } from "mongoose";

export interface IReward extends Document {
  userId: mongoose.Types.ObjectId;
  transactionId: mongoose.Types.ObjectId;
  type: "transfer" | "bill_payment" | "card_usage" | "savings" | "referral";
  amount: number;
  status: "pending" | "credited" | "redeemed" | "expired";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRewardsBalance extends Document {
  userId: mongoose.Types.ObjectId;
  availableBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  nextTierProgress: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRewardsRedemption extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  method: "wallet_credit" | "bank_transfer" | "airtime" | "bill_payment" | "card_funding";
  status: "pending" | "completed" | "failed";
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}

const rewardSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
    },
    type: {
      type: String,
      enum: ["transfer", "bill_payment", "card_usage", "savings", "referral"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "credited", "redeemed", "expired"],
      default: "pending",
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    },
  },
  { timestamps: true }
);

const rewardsBalanceSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },
    lifetimeEarned: {
      type: Number,
      default: 0,
    },
    lifetimeRedeemed: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum"],
      default: "bronze",
    },
    nextTierProgress: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const rewardsRedemptionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ["wallet_credit", "bank_transfer", "airtime", "bill_payment", "card_funding"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const Reward = mongoose.model<IReward>("Reward", rewardSchema);
export const RewardsBalance = mongoose.model<IRewardsBalance>("RewardsBalance", rewardsBalanceSchema);
export const RewardsRedemption = mongoose.model<IRewardsRedemption>("RewardsRedemption", rewardsRedemptionSchema);
