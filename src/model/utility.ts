import { timeStamp } from "console";
import { ObjectId, Schema, model } from "mongoose";

interface Utility {
    subscriberAccountNumber: string;
    amount: number;
    billerId: number;
    utilityName: string;
    utilityType: string;
    utilityStatus: string;
    utilityReferenceId: string;
    code: string;
    message: string;
    submittedAt: string;
    finalStatusAvailabilityAt: string;
    id: number;
    userId: ObjectId
}

const utilitySchema = new Schema<Utility>({
    subscriberAccountNumber: { type: String },
    amount: { type: Number, required: true },
    billerId: { type: Number },
    utilityName: { type: String },
    utilityType: { type: String },
    utilityStatus: { type: String, required: true },
    utilityReferenceId: { type: String, required: true },
    code: { type: String, required: true }, 
    message: { type: String, required: true },
    id: { type: Number, required: true },
    userId:{type: Schema.Types.ObjectId, ref: "User"}
}, {timestamps: true})

const utilityModel = model('Utility', utilitySchema)
export default utilityModel;