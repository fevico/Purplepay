import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    type: "transfer" | "funding" | "withdrawal" | "security" | "system";
    title: string;
    message: string;
    reference?: string;
    isRead: boolean;
    metadata: any;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { 
        type: String, 
        enum: ["transfer", "funding", "withdrawal", "security", "system"], 
        required: true 
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    reference: { type: String },
    isRead: { type: Boolean, default: false },
    metadata: { type: Object, default: {} },
}, { timestamps: true });

// Create index on userId and createdAt for efficient querying
notificationSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<INotification>("Notification", notificationSchema);
