# Purplepay Wallet Functionality Testing

This document provides an overview of the wallet functionality in the Purplepay backend and the results of our testing.

## Overview

The Purplepay backend provides a wallet system that allows users to:
- Create a virtual bank account
- View a list of supported banks
- Verify account details
- (Future functionality: Transfer funds between accounts)

The wallet functionality integrates with the Strowallet API for virtual bank accounts and transactions.

## API Endpoints

### 1. Create Wallet
- **Endpoint**: `POST /wallet/create`
- **Authentication**: JWT token required
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "account_name": "User Name",
    "phone": "1234567890"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Wallet created successfully",
    "createWallet": {
      "balance": 0,
      "userId": "user_id",
      "_id": "wallet_id",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  }
  ```

### 2. Fetch Bank List
- **Endpoint**: `GET /wallet/bank-list`
- **Authentication**: JWT token required
- **Response**:
  ```json
  {
    "banks": [
      {
        "code": "000014",
        "name": "ACCESS BANK"
      },
      // More banks...
    ]
  }
  ```

### 3. Get Account Details
- **Endpoint**: `POST /wallet/account-details`
- **Authentication**: JWT token required
- **Request Body**:
  ```json
  {
    "accountNumber": "0123456789",
    "sortCode": "000014"
  }
  ```
- **Response**:
  ```json
  {
    "accountDetails": {
      "status": true,
      "account": {
        "bankCode": "000014",
        "accountName": "Account Holder Name",
        "accountNumber": "0123456789"
      }
    }
  }
  ```

## Testing Process

We created a comprehensive test script (`test-wallet-complete.js`) that tests all aspects of the wallet functionality:

1. **User Authentication Flow**:
   - Creating a user account
   - Verifying the user account
   - Logging in to obtain a JWT token

2. **Wallet Creation**:
   - Creating a wallet for the authenticated user
   - Verifying the wallet properties

3. **Bank List Retrieval**:
   - Fetching the list of supported banks
   - Verifying the response format

4. **Account Details Retrieval**:
   - Fetching account details for a given account number and sort code
   - Verifying the response format

## Test Results

All tests passed successfully after setting the correct API keys and updating the endpoints to match the expected request formats.

### Key Findings:

1. **Environment Variables**:
   - The wallet functionality requires both `PUBLIC_KEY` and `SECRET_KEY` environment variables to be set.
   - These keys are used to authenticate with the Strowallet API.

2. **Data Model**:
   - The wallet model includes fields for balance, bankName, accountName, accountNumber, and userId.
   - The wallet is linked to a user via the userId field.

3. **Error Handling**:
   - The API returns appropriate error messages when required parameters are missing.
   - The API validates that a wallet exists before allowing bank list or account details retrieval.

4. **API Integration**:
   - The wallet creation process makes a POST request to `https://strowallet.com/api/virtual-bank/paga`.
   - The bank list and account details endpoints also integrate with the Strowallet API.

## Running the Tests

To run the tests:

1. Ensure the server is running:
   ```
   npm run dev
   ```

2. Set the environment variables:
   ```
   PUBLIC_KEY=your_public_key
   SECRET_KEY=your_secret_key
   ```

3. Run the test script:
   ```
   node test-wallet-complete.js
   ```

4. Follow the prompts to create a new user or use an existing one.

## Conclusion

The wallet functionality of the Purplepay backend is working as expected. The integration with the Strowallet API is successful, and all endpoints are functioning correctly when provided with the proper API keys and request formats.

Future enhancements could include:
- Adding support for wallet-to-wallet transfers
- Implementing transaction history
- Adding support for multiple currencies
- Enhancing security with two-factor authentication for transactions
