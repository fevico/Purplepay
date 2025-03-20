# How to Test the Fixes

This guide explains how to test the fixes implemented for the Purplepay backend wallet functionality.

## Prerequisites

1. Make sure MongoDB is running
2. Ensure all environment variables are properly set

## Step 1: Start the Server

```bash
npm run dev
```

This will start the server in development mode with hot reloading.

## Step 2: Run the Comprehensive Test Script

```bash
node test-fixes-all.js
```

This script will:
1. Register test users
2. Fund a wallet using the new test endpoint
3. Test transaction filtering with the fixed response structure
4. Test wallet transfers between users
5. Test the notification system

## Step 3: Test Individual Components

If you want to test specific components separately:

### Test Transaction Filtering

```bash
node test-transaction-filtering.js
```

Note: You'll need to update the `AUTH_TOKEN` in the script with a valid token.

### Test Wallet Funding

```bash
node test-wallet-funding-fix.js
```

Note: You'll need to update the `AUTH_TOKEN` in the script with a valid token.

## Step 4: Manual Testing

You can also test the endpoints manually using tools like Postman or cURL:

### Fund a Wallet for Testing

```bash
curl -X POST http://localhost:3000/wallet/test-fund \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"amount": 50000}'
```

### Get Transaction History

```bash
curl -X GET http://localhost:3000/transactions \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Get Transaction Details

```bash
curl -X GET http://localhost:3000/transactions/YOUR_TRANSACTION_REFERENCE \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

## Troubleshooting

If you encounter any issues:

1. Check the server logs for error messages
2. Verify that MongoDB is running and accessible
3. Ensure your auth token is valid and not expired
4. Check that all required environment variables are set

## Next Steps

After verifying that all fixes are working correctly, you can:

1. Run the complete wallet test suite to test all functionality
2. Continue development and enhancement of the wallet features
3. Implement any remaining features from the test plan

For a detailed explanation of all the fixes implemented, see the `FIXES-IMPLEMENTED.md` file.
