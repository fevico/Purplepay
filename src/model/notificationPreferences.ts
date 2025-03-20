import mongoose, { Schema, Document } from "mongoose";

export interface INotificationPreferences extends Document {
    userId: mongoose.Types.ObjectId;
    channels: {
        inApp: boolean;
        email: boolean;
        sms: boolean;
    };
    preferences: {
        transfers: boolean;
        funding: boolean;
        withdrawal: boolean;
        security: boolean;
        system: boolean;
        scheduledTransfers: boolean;
        highValueTransfers: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}

const notificationPreferencesSchema: Schema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        unique: true
    },
    channels: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false }
    },
    preferences: {
        transfers: { type: Boolean, default: true },
        funding: { type: Boolean, default: true },
        withdrawal: { type: Boolean, default: true },
        security: { type: Boolean, default: true },
        system: { type: Boolean, default: true },
        scheduledTransfers: { type: Boolean, default: true },
        highValueTransfers: { type: Boolean, default: true }
    }
}, { timestamps: true });

export default mongoose.model<INotificationPreferences>("NotificationPreferences", notificationPreferencesSchema);
