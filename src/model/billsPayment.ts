import { ObjectId, Schema, model } from "mongoose";

interface billsPayment{
    name: string;
    amount: number;
    date: Date;
    status: string;
    category: "Airtime" | "Data" | "Electricity" | "Education" | "Cable Subscription";
    image: string;
    userId: ObjectId
    billType: string;
}

const billsPaymentSchema = new Schema<billsPayment>({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now()},
    status: { type: String },
    category: { type: String, required: true },
    image: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    billType: { type: String, required: true },
}, {timestamps: true})

const billsPaymentModel = model("BillsPayment", billsPaymentSchema)
export default billsPaymentModel;