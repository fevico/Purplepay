import mongoose, { Schema, Document } from "mongoose";

export interface IScheduledTransfer extends Document {
    userId: mongoose.Types.ObjectId;
    recipientId?: mongoose.Types.ObjectId;
    recipientEmail: string;
    amount: number;
    currency: string;
    description: string;
    frequency: "one-time" | "daily" | "weekly" | "monthly";
    nextExecutionDate: Date;
    lastExecutionDate?: Date;
    executionCount: number;
    status: "active" | "paused" | "completed" | "failed";
    endDate?: Date;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

const scheduledTransferSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User" },
    recipientEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "NGN" },
    description: { type: String, default: "" },
    frequency: { 
        type: String, 
        enum: ["one-time", "daily", "weekly", "monthly"], 
        required: true 
    },
    nextExecutionDate: { type: Date, required: true },
    lastExecutionDate: { type: Date },
    executionCount: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ["active", "paused", "completed", "failed"], 
        default: "active" 
    },
    endDate: { type: Date },
    metadata: { type: Object, default: {} },
}, { timestamps: true });

export default mongoose.model<IScheduledTransfer>("ScheduledTransfer", scheduledTransferSchema);
