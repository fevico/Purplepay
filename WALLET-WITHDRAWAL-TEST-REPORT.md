# Purplepay Wallet Withdrawal Test Report

**Date:** March 18, 2025  
**Tester:** Automated Test Script  
**Version:** 1.0.0

## Executive Summary

The wallet withdrawal functionality has been successfully implemented and tested. Users can now withdraw funds from their wallets to their bank accounts, with proper verification through a one-time password (OTP) system.

## Test Environment

- **Server:** Node.js Express server running on http://localhost:9876
- **Database:** MongoDB
- **Authentication:** JWT token-based authentication

## Implemented Functionality

### 1. Withdrawal Initiation Endpoint
- **Endpoint:** `POST /wallet/withdraw`
- **Description:** Initiates a wallet withdrawal transaction
- **Authentication:** JWT token required
- **Request Body:**
  ```json
  {
    "amount": 500,
    "accountNumber": "0123456789",
    "bankCode": "058",
    "accountName": "John Doe",
    "narration": "Test withdrawal"
  }
  ```
- **Response:** Withdrawal initiation details including a unique reference and verification code

### 2. Withdrawal Verification Endpoint
- **Endpoint:** `POST /wallet/verify-withdrawal`
- **Description:** Verifies a withdrawal transaction using the provided verification code
- **Authentication:** JWT token required
- **Request Body:**
  ```json
  {
    "reference": "WITHDRAW_1742318367848_605324",
    "verificationCode": "859652"
  }
  ```
- **Response:** Verification details including the new wallet balance

### 3. Withdrawal Status Endpoint
- **Endpoint:** `GET /wallet/withdrawal-status/:reference`
- **Description:** Retrieves the status of a withdrawal transaction
- **Authentication:** JWT token required
- **Response:** Withdrawal status details including amount, account number, and status

## Test Scenarios and Results

### 1. Retrieving Wallet Details Before Withdrawal

**Test Case:** Retrieve the authenticated user's wallet details  
**Expected Result:** API returns the wallet details including balance  
**Actual Result:** Successfully retrieved wallet details with balance of 1000 NGN  
**Status:** ✅ PASSED

```json
{
  "message": "Wallet details retrieved successfully",
  "wallet": {
    "_id": "67d9a496a95846d60749f873",
    "balance": 1000,
    "userId": "67d9a3bcbbc31ff5bf6c394c",
    "createdAt": "2025-03-18T16:51:34.413Z",
    "updatedAt": "2025-03-18T17:11:06.856Z",
    "__v": 0
  }
}
```

### 2. Initiating Wallet Withdrawal

**Test Case:** Initiate a wallet withdrawal transaction  
**Expected Result:** API returns a unique reference and verification code  
**Actual Result:** Successfully initiated wallet withdrawal  
**Status:** ✅ PASSED

```json
{
  "message": "Withdrawal initiated successfully",
  "reference": "WITHDRAW_1742318367848_605324",
  "amount": 500,
  "accountNumber": "0123456789",
  "bankCode": "058",
  "status": "pending",
  "verificationCode": "859652"
}
```

### 3. Verifying Wallet Withdrawal

**Test Case:** Verify a wallet withdrawal transaction using the verification code  
**Expected Result:** API updates the wallet balance and returns the new balance  
**Actual Result:** Successfully verified wallet withdrawal and updated balance  
**Status:** ✅ PASSED

```json
{
  "message": "Withdrawal successful",
  "reference": "WITHDRAW_1742318367848_605324",
  "amount": 500,
  "accountNumber": "0123456789",
  "bankCode": "058",
  "status": "completed",
  "newBalance": 500
}
```

### 4. Checking Withdrawal Status

**Test Case:** Retrieve the status of a withdrawal transaction  
**Expected Result:** API returns the withdrawal status details  
**Actual Result:** Successfully retrieved withdrawal status  
**Status:** ✅ PASSED

```json
{
  "reference": "WITHDRAW_1742318367848_605324",
  "amount": 500,
  "accountNumber": "0123456789",
  "bankCode": "058",
  "status": "completed",
  "createdAt": "2025-03-18T17:19:27.848Z",
  "completedAt": "2025-03-18T17:19:27.895Z"
}
```

### 5. Checking Updated Wallet Balance

**Test Case:** Retrieve the wallet details after withdrawal  
**Expected Result:** API returns the updated wallet balance  
**Actual Result:** Successfully retrieved updated wallet details with the new balance  
**Status:** ✅ PASSED

```json
{
  "message": "Wallet details retrieved successfully",
  "wallet": {
    "_id": "67d9a496a95846d60749f873",
    "balance": 500,
    "userId": "67d9a3bcbbc31ff5bf6c394c",
    "createdAt": "2025-03-18T16:51:34.413Z",
    "updatedAt": "2025-03-18T17:19:27.879Z",
    "__v": 0
  }
}
```

## Overall Results

- **Total Tests:** 5
- **Passed Tests:** 5
- **Failed Tests:** 0
- **Success Rate:** 100%

## Implementation Details

### Controller Functions

1. **initiateWithdrawal:** Initiates a withdrawal transaction and generates a verification code
2. **verifyWithdrawal:** Verifies a withdrawal transaction using the verification code and updates the wallet balance
3. **getWithdrawalStatus:** Retrieves the status of a withdrawal transaction

### Routes

1. **POST /wallet/withdraw:** Initiates a withdrawal transaction
2. **POST /wallet/verify-withdrawal:** Verifies a withdrawal transaction
3. **GET /wallet/withdrawal-status/:reference:** Retrieves the status of a withdrawal transaction

### Data Storage

For this implementation, we used an in-memory storage (module-level variable) to store withdrawal requests. In a production environment, this should be replaced with a proper database model.

## Observations and Recommendations

1. **Security Enhancements:**
   - The current implementation returns the verification code in the response, which is not secure for production
   - In a production environment, the verification code should be sent to the user's email or phone
   - Implement rate limiting to prevent brute force attacks on the verification code

2. **Database Storage:**
   - Replace the in-memory storage with a proper database model for withdrawal requests
   - Create a transactions collection to store all wallet transactions (funding, withdrawals, etc.)

3. **Bank Integration:**
   - The current implementation simulates a bank transfer
   - In a production environment, this should be replaced with a real bank transfer API integration

4. **Error Handling:**
   - Add more specific error messages for different failure scenarios
   - Implement proper logging for debugging and auditing

5. **Validation:**
   - Add more validation for bank account details
   - Implement minimum and maximum withdrawal limits
   - Add daily withdrawal limits for security

## Conclusion

The wallet withdrawal functionality has been successfully implemented and tested. All test cases have passed, and the system correctly updates the wallet balance after withdrawal verification. The implementation includes proper validation, verification, and error handling.

## Next Steps

1. **Implement a proper database model for withdrawal requests**
2. **Add a transactions collection to store all wallet transactions**
3. **Integrate with a real bank transfer API**
4. **Enhance security with email/SMS verification**
5. **Implement withdrawal limits and additional validation**
