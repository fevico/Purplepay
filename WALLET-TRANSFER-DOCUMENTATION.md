# Wallet-to-Wallet Transfer Documentation

This document outlines the wallet-to-wallet transfer functionality implemented in the Purplepay backend, which allows users to transfer funds between wallets with proper recipient validation and transfer limits.

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Transfer Flow](#transfer-flow)
4. [Transfer Limits](#transfer-limits)
5. [Security Considerations](#security-considerations)
6. [Error Handling](#error-handling)
7. [Integration with Transaction History](#integration-with-transaction-history)
8. [Testing](#testing)
9. [Future Enhancements](#future-enhancements)

## Overview

The wallet-to-wallet transfer functionality enables users to transfer funds from their wallet to another user's wallet within the Purplepay platform. The implementation includes:

- Recipient validation to ensure the recipient exists and has a wallet
- Transfer limits to prevent excessive transfers
- Two-step verification process with OTP to confirm transfers
- Transaction records for both sender and recipient
- Status tracking for transfers

## API Endpoints

### 1. Initiate Transfer

**Endpoint:** `POST /wallet/transfer`

**Authentication:** Required (JWT Token)

**Request Body:**
```json
{
  "recipientEmail": "recipient@example.com",
  "amount": 1000,
  "description": "Payment for services"
}
```

**Response:**
```json
{
  "message": "Transfer initiated successfully",
  "reference": "TRANSFER_1742316550123_123456",
  "amount": 1000,
  "recipientEmail": "recipient@example.com",
  "status": "pending",
  "verificationCode": "123456"
}
```

### 2. Verify Transfer

**Endpoint:** `POST /wallet/verify-transfer`

**Authentication:** Required (JWT Token)

**Request Body:**
```json
{
  "reference": "TRANSFER_1742316550123_123456",
  "verificationCode": "123456"
}
```

**Response:**
```json
{
  "message": "Transfer successful",
  "reference": "TRANSFER_1742316550123_123456",
  "amount": 1000,
  "recipientEmail": "recipient@example.com",
  "status": "completed",
  "newBalance": 5000
}
```

### 3. Get Transfer Status

**Endpoint:** `GET /wallet/transfer-status/:reference`

**Authentication:** Required (JWT Token)

**Response:**
```json
{
  "reference": "TRANSFER_1742316550123_123456",
  "amount": 1000,
  "recipientEmail": "recipient@example.com",
  "status": "completed",
  "createdAt": "2025-03-18T12:35:50.123Z",
  "completedAt": "2025-03-18T12:36:10.456Z"
}
```

## Transfer Flow

The wallet-to-wallet transfer follows a two-step verification process:

1. **Initiation Phase:**
   - User provides recipient email, amount, and optional description
   - System validates recipient existence and wallet availability
   - System checks transfer limits and sender's balance
   - System generates a unique reference and verification code (OTP)
   - A pending transaction record is created
   - The reference and verification code are returned to the user

2. **Verification Phase:**
   - User provides the reference and verification code
   - System validates the verification code
   - System checks the sender's balance again (to ensure it hasn't changed)
   - System transfers the funds from sender to recipient
   - System updates the transaction status to "completed"
   - System creates a corresponding transaction record for the recipient
   - The updated wallet balance is returned to the user

3. **Test Mode:**
   - For testing purposes, the system supports transfers to non-existent recipients
   - In test mode, the sender's balance is still deducted
   - The transaction is marked as completed, but no recipient transaction is created
   - This mode is indicated by a `testMode: true` flag in the response
   - This feature should be disabled in production environments

## Transfer Limits

The following transfer limits are implemented:

- **Minimum Transfer Amount:** 100 NGN per transaction
- **Maximum Transfer Amount:** 500,000 NGN per transaction
- **Daily Transfer Limit:** 1,000,000 NGN per day

These limits can be adjusted in the configuration as needed.

## Security Considerations

1. **Authentication:** All transfer endpoints require JWT authentication.
2. **Verification Code:** A 6-digit verification code (OTP) is required to complete the transfer.
3. **Double Validation:** The system validates the recipient and sender's balance twice (at initiation and verification).
4. **Transaction Records:** Complete transaction records are maintained for audit purposes.
5. **Error Handling:** Comprehensive error handling prevents unauthorized or invalid transfers.

## Error Handling

The API handles various error scenarios, including:

- Recipient not found
- Recipient wallet not found
- Insufficient balance
- Transfer limits exceeded
- Invalid verification code
- Transaction already processed
- Self-transfer attempt

Each error returns an appropriate HTTP status code and descriptive error message.

## Integration with Transaction History

The wallet-to-wallet transfer functionality integrates with the transaction history system:

1. When a transfer is initiated, a transaction record with status "pending" is created for the sender.
2. When a transfer is verified, the transaction status is updated to "completed" for the sender.
3. A new transaction record with status "completed" is created for the recipient.
4. Both transactions are linked via the reference in the metadata.
5. All transfers can be queried through the transaction history endpoints.

## Testing

A test script (`test-wallet-transfer.js`) is provided to test the wallet-to-wallet transfer functionality. The script:

1. Fetches the sender's wallet details before the transfer
2. Initiates a transfer to a recipient
3. Verifies the transfer using the verification code
4. Checks the transfer status
5. Fetches the sender's wallet details after the transfer
6. Verifies that the wallet balance has been updated correctly

## Future Enhancements

1. **Favorite Recipients:** Allow users to save and manage favorite recipients for quick transfers.
2. **Scheduled Transfers:** Enable users to schedule recurring transfers.
3. **Batch Transfers:** Allow users to transfer to multiple recipients in a single operation.
4. **Transfer Notifications:** Send notifications to both sender and recipient when a transfer is completed.
5. **Transfer Cancellation:** Allow users to cancel pending transfers before verification.
6. **Transfer Templates:** Enable users to save transfer templates for common payment scenarios.
7. **Enhanced Security:** Implement additional security measures such as device verification or biometric authentication for high-value transfers.
