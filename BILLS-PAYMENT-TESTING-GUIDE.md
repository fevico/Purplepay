# Bills Payment API Testing Guide

This guide will walk you through testing the Bills Payment API using the provided test scripts.

## Prerequisites

1. Node.js installed on your system
2. The Purplepay backend server running locally
3. A registered user account in the system

## Testing Steps

Follow these steps to test the Bills Payment API:

### Step 1: Start the Server

If the server is not already running, start it with:

```bash
npm run dev
```

The server should start on http://localhost:9876.

### Step 2: Check Server Health

Before proceeding with testing, check if the server is responding correctly:

```bash
node health-check.js
```

This will test various endpoints and report on their status. If the server is healthy, you can proceed with testing.

### Step 3: Create a Test User

You can create a test user with the following script:

```bash
node create-test-user.js
```

Enter an email and password when prompted. The script will:
- Create a new user
- Verify the user
- Log in and save the JWT token to jwt-token.txt

Alternatively, use the automated script that also sets up a wallet:

```bash
node auto-create-test-user.js
```

This script will:
- Create a test user
- Verify the user
- Create a wallet
- Fund the wallet with test funds
- Check the wallet balance

### Step 4: Set Up Your Wallet

If you didn't use the auto-create-test-user.js script, you can set up your wallet:

```bash
node create-wallet.js
```

This will:
- Create a wallet for your user
- Check the wallet balance
- Fund the wallet with test funds
- Verify the updated balance

### Step 5: Test the Bills Payment API

Now you're ready to test the Bills Payment API:

1. Run the bills payment test script:
   ```bash
   node test-bills-payment.js
   ```

2. Paste your JWT token when prompted.

3. Choose from the available test options:
   - Option 1: Initiate Bill Payment
   - Option 2: Process Bill Payment
   - Option 3: Get Bill Payment Status
   - Option 4: Get Bill Payment History
   - Option 5: Run All Tests
   - Option 0: Exit

## Test Scenarios

Here are some recommended test scenarios:

### Scenario 1: Complete Bill Payment Flow

1. Initiate a bill payment
2. Process the payment
3. Check the payment status
4. View the payment in the history

### Scenario 2: Different Bill Types

Test different bill types with appropriate providers:

- Electricity: IKEDC, EKEDC, AEDC
- Internet: MTN, Airtel, Glo
- TV: DSTV, GOTV, StarTimes
- Water: Lagos Water Corporation

### Scenario 3: Error Handling

Test error scenarios:

1. Insufficient wallet balance
2. Invalid customer reference
3. Non-existent bill payment reference
4. Already processed bill payment

### Scenario 4: Robust Testing

For more comprehensive testing with retry mechanisms:

```bash
node robust-test.js
```

This script handles connection issues gracefully and tests:
- Wallet creation
- Wallet funding
- Bill payment history retrieval
- With automatic retries on failure

## Troubleshooting

If you encounter issues during testing:

1. **Authentication Errors**:
   - Ensure your JWT token is valid and not expired
   - Check that you're including the token correctly

2. **Wallet Issues**:
   - Verify your wallet exists and has sufficient balance
   - Check for any restrictions on your wallet

3. **API Errors**:
   - Check the server logs for detailed error information
   - Verify that all required fields are provided in the requests

4. **Connection Issues**:
   - Ensure the server is running with `node health-check.js`
   - Try restarting the server with `npm run dev`
   - Check for "Unauthorized" errors in the server logs
   - Verify that the port (9876) is not being used by another application

## Interpreting Test Results

For each API call, the test scripts will show:

1. The request data being sent
2. The response received from the API
3. Any error messages if the request fails

Pay attention to:

- Success/failure status
- Error messages
- Bill payment reference numbers
- Transaction IDs
- Payment status changes

## Next Steps

After testing, you may want to:

1. Implement additional bill types or providers
2. Add more comprehensive error handling
3. Optimize the API for performance
4. Enhance the user experience with better notifications

## Support

If you encounter any issues that you cannot resolve, please contact the development team for assistance.
