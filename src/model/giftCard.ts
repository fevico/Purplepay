import { ObjectId, Schema, model } from "mongoose"

interface GiftCards{
    recipientEmail: string
    recipientPhone: string
    customIdentifier: string
    transactionId: number
    totalFee: number
    amount: number
    senderName: string
    discount: number
    productId: number
    productName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    currencyCode: string
    brandId: number
    brandName: string
    countryCode: string
    status: string
    transactionCreatedTime: string
    userId: ObjectId
    createdAt: Date
}

const giftCardSchema = new Schema<GiftCards>({
    recipientEmail: { type: String, required: true },
    recipientPhone: { type: String, required: true },
    customIdentifier: { type: String, required: true },
    transactionId: { type: Number, required: true },
    totalFee: { type: Number, required: true },
    amount: { type: Number, required: true },
    discount: { type: Number, required: true },
    productId: { type: Number, required: true },
    senderName: { type: String },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    currencyCode: { type: String, required: true },
    brandId: { type: Number, required: true },
    brandName: { type: String, required: true },
    countryCode: { type: String, required: true },
    status: { type: String, required: true },
    transactionCreatedTime: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdAt: { type: Date, default: Date.now }
})

const giftCardModel = model("GiftCard", giftCardSchema)
export default giftCardModel
// {
    //     "transactionId": 31739,
    //     "amount": 17.83367,
    //     "discount": 0.44,
    //     "currencyCode": "CAD",
    //     "fee": 2.83,
    //     "smsFee": 0.28,
    //     "totalFee": 3.11,
    //     "preOrdered": false,
    //     "recipientEmail": "anyone@email.com",
    //     "recipientPhone": "34012345678",
    //     "customIdentifier": "obucks15",
    //     "status": "SUCCESSFUL",
    //     "transactionCreatedTime": "2024-06-19 07:27:07",
    //     "product": {
    //         "productId": 10,
    //         "productName": "App Store & iTunes Austria",
    //         "countryCode": "AT",
    //         "quantity": 2,
    //         "unitPrice": 5,
    //         "totalPrice": 10,
    //         "currencyCode": "EUR",
    //         "brand": {
    //             "brandId": 3,
    //             "brandName": "App Store & iTunes"
    //         }
    //     }
    // }