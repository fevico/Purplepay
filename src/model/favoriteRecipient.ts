import mongoose, { Schema, Document } from "mongoose";

export interface IFavoriteRecipient extends Document {
    userId: mongoose.Types.ObjectId;
    recipientId: mongoose.Types.ObjectId;
    recipientEmail: string;
    nickname: string;
    lastTransferDate?: Date;
    transferCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const favoriteRecipientSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientEmail: { type: String, required: true },
    nickname: { type: String, required: true },
    lastTransferDate: { type: Date },
    transferCount: { type: Number, default: 0 },
}, { timestamps: true });

// Create a compound index on userId and recipientId to ensure uniqueness
favoriteRecipientSchema.index({ userId: 1, recipientId: 1 }, { unique: true });

export default mongoose.model<IFavoriteRecipient>("FavoriteRecipient", favoriteRecipientSchema);
