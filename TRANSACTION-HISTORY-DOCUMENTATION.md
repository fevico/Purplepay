# Purplepay Transaction History Documentation

## Overview

The transaction history functionality allows users to view and filter their wallet transactions. It provides endpoints for retrieving transaction history with various filtering options, getting transaction details by reference, and generating transaction summaries.

## Database Model

### Transaction Model

The transaction model stores all wallet transactions, including funding, withdrawals, and transfers.

**Schema:**

```typescript
const transactionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    type: {
      type: String,
      enum: ["funding", "withdrawal", "transfer"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "NGN",
    },
    reference: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    description: {
      type: String,
      default: "",
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);
```

## API Endpoints

### 1. Get Transaction History

**Endpoint:** `GET /transactions`

**Description:** Retrieves a paginated list of transactions for the authenticated user with various filtering options.

**Authentication:** JWT token required

**Query Parameters:**
- `type` (optional): Filter by transaction type (funding, withdrawal, transfer)
- `status` (optional): Filter by transaction status (pending, completed, failed)
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of transactions per page (default: 10)
- `sortBy` (optional): Field to sort by (default: createdAt)
- `sortOrder` (optional): Sort order (asc or desc, default: desc)

**Response:**
```json
{
  "message": "Transaction history retrieved successfully",
  "data": [
    {
      "_id": "67d9b2bc6e0a0f2d9b9a1234",
      "userId": "67d9a3bcbbc31ff5bf6c394c",
      "walletId": "67d9a496a95846d60749f873",
      "type": "funding",
      "amount": 500,
      "currency": "NGN",
      "reference": "FUND_1742319244433_85849",
      "status": "completed",
      "description": "Test funding for transaction history",
      "metadata": {
        "paymentMethod": "card",
        "paymentUrl": "http://localhost:9876/payment/process/FUND_1742319244433_85849"
      },
      "createdAt": "2025-03-18T17:34:04.456Z",
      "updatedAt": "2025-03-18T17:34:04.604Z"
    },
    {
      "_id": "67d9b2bc6e0a0f2d9b9a5678",
      "userId": "67d9a3bcbbc31ff5bf6c394c",
      "walletId": "67d9a496a95846d60749f873",
      "type": "withdrawal",
      "amount": 200,
      "currency": "NGN",
      "reference": "WITHDRAW_1742319244636_375717",
      "status": "completed",
      "description": "Test withdrawal for transaction history",
      "metadata": {
        "accountNumber": "0123456789",
        "bankCode": "058",
        "accountName": "Test User",
        "verificationCode": "848772"
      },
      "createdAt": "2025-03-18T17:34:04.636Z",
      "updatedAt": "2025-03-18T17:34:04.789Z"
    }
  ],
  "pagination": {
    "total": 2,
    "totalPages": 1,
    "currentPage": 1,
    "limit": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### 2. Get Transaction Details

**Endpoint:** `GET /transactions/:reference`

**Description:** Retrieves details of a specific transaction by its reference.

**Authentication:** JWT token required

**URL Parameters:**
- `reference`: The unique reference of the transaction

**Response:**
```json
{
  "message": "Transaction details retrieved successfully",
  "data": {
    "_id": "67d9b2bc6e0a0f2d9b9a1234",
    "userId": "67d9a3bcbbc31ff5bf6c394c",
    "walletId": "67d9a496a95846d60749f873",
    "type": "funding",
    "amount": 500,
    "currency": "NGN",
    "reference": "FUND_1742319244433_85849",
    "status": "completed",
    "description": "Test funding for transaction history",
    "metadata": {
      "paymentMethod": "card",
      "paymentUrl": "http://localhost:9876/payment/process/FUND_1742319244433_85849"
    },
    "createdAt": "2025-03-18T17:34:04.456Z",
    "updatedAt": "2025-03-18T17:34:04.604Z"
  }
}
```

### 3. Get Transaction Summary

**Endpoint:** `GET /transactions/summary`

**Description:** Retrieves a summary of transactions for the authenticated user, including counts and amounts by type and status.

**Authentication:** JWT token required

**Query Parameters:**
- `period` (optional): Time period for the summary (all, today, week, month, year, default: all)

**Response:**
```json
{
  "message": "Transaction summary retrieved successfully",
  "data": {
    "counts": {
      "total": 2,
      "funding": 1,
      "withdrawal": 1,
      "transfer": 0,
      "pending": 0,
      "completed": 2,
      "failed": 0
    },
    "amounts": {
      "funding": 500,
      "withdrawal": 200,
      "transfer": 0,
      "net": 300
    },
    "period": "all"
  }
}
```

## Integration with Wallet Functionality

The transaction history functionality is integrated with the wallet funding and withdrawal functionality. When a user funds or withdraws from their wallet, a transaction record is created and updated throughout the process.

### Funding Flow:

1. User initiates a wallet funding transaction
2. A transaction record is created with status "pending"
3. When the funding is verified, the transaction status is updated to "completed"
4. The wallet balance is updated

### Withdrawal Flow:

1. User initiates a wallet withdrawal transaction
2. A transaction record is created with status "pending"
3. User verifies the withdrawal using a verification code
4. When the withdrawal is verified, the transaction status is updated to "completed"
5. The wallet balance is updated

## Implementation Details

### Controller Functions:

1. **getTransactionHistory**: Retrieves a paginated list of transactions with filtering options
2. **getTransactionDetails**: Retrieves details of a specific transaction by reference
3. **getTransactionSummary**: Generates a summary of transactions by type and status

### Routes:

1. **GET /transactions**: Retrieves transaction history with filtering options
2. **GET /transactions/:reference**: Retrieves transaction details by reference
3. **GET /transactions/summary**: Retrieves transaction summary

## Security Considerations

- All transaction endpoints require authentication using JWT tokens
- Users can only access their own transactions
- Sensitive information like verification codes is stored in the metadata but not exposed in the API responses

## Future Enhancements

1. **Transaction Export**: Add functionality to export transaction history as CSV or PDF
2. **Transaction Categories**: Add support for categorizing transactions for better reporting
3. **Transaction Search**: Add full-text search functionality for transaction descriptions
4. **Transaction Notifications**: Send notifications for new transactions
5. **Transaction Dispute**: Add functionality to dispute transactions

## Conclusion

The transaction history functionality provides a comprehensive solution for tracking and analyzing wallet transactions. It allows users to view their transaction history, filter transactions by type and status, and generate transaction summaries.
