import mongoose, { Schema, Document } from "mongoose";

export interface ISecuritySettings extends Document {
    userId: mongoose.Types.ObjectId;
    highValueTransferThreshold: number;
    requireAdditionalAuthForHighValue: boolean;
    skipAuthForTrustedDevices: boolean;
    enableEmailNotifications: boolean;
    enableSmsNotifications: boolean;
    trustedDevices: {
        deviceId: string;
        deviceName: string;
        lastUsed: Date;
    }[];
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}

const securitySettingsSchema: Schema = new Schema({
    userId: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true,
        unique: true
    },
    highValueTransferThreshold: { 
        type: Number, 
        default: 100000 // 100,000 NGN
    },
    requireAdditionalAuthForHighValue: { 
        type: Boolean, 
        default: true 
    },
    skipAuthForTrustedDevices: {
        type: Boolean,
        default: false
    },
    enableEmailNotifications: { 
        type: Boolean, 
        default: true 
    },
    enableSmsNotifications: { 
        type: Boolean, 
        default: false 
    },
    trustedDevices: [{
        deviceId: { type: String, required: true },
        deviceName: { type: String, required: true },
        lastUsed: { type: Date, default: Date.now }
    }],
    lastUpdated: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

export default mongoose.model<ISecuritySettings>("SecuritySettings", securitySettingsSchema);
