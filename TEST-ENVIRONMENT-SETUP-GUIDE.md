# Test Environment Setup Guide

This guide explains how to set up a test environment for the Purplepay Bills Payment API, including server health checks, user creation, wallet setup, and API testing.

## Available Scripts

### 1. Server Starter

The `start-server.js` script helps you start the server with proper configuration.

```bash
node start-server.js
```

This script will:
- Check if the .env file exists and create a sample one if needed
- Install dependencies if they are missing
- Start the server in a detached process
- Save the server PID to a file for reference

### 2. Mock Server

The `mock-server.js` script provides a complete mock implementation of the Bills Payment API for testing without the actual server.

```bash
node mock-server.js
```

or

```bash
npm run mock-server
```

This script will:
- Start a mock server on port 9876
- Provide all the necessary API endpoints for testing
- Use an in-memory database for storing users, wallets, and transactions
- Persist data between restarts via a JSON file

### 3. Server Health Check

The `server-health-check.js` script checks the health of the server and its endpoints.

```bash
node server-health-check.js
```

This script will:
- Check if the server is running
- Verify the availability of authentication endpoints
- Verify the availability of wallet endpoints
- Verify the availability of bills payment endpoints
- Check MongoDB connection
- Generate a health report

The health report will be saved to `server-health-report.json`.

### 4. Auto-Create Test User

The `auto-create-test-user.js` script automates the creation of a test user and wallet.

```bash
node auto-create-test-user.js
```

This script will:
- Provide options to create a new user, login with an existing user, or use a test token
- Set up a wallet for the user
- Fund the wallet with test money
- Test the Bills Payment API

The JWT token will be saved to `jwt-token.txt` for easy access in future tests.

### 5. Setup Test Environment

The `setup-test-environment.js` script is a comprehensive solution that combines server health checking, user creation, and wallet setup.

```bash
node setup-test-environment.js
```

This script will:
- Check if the server is running and start it if needed
- Provide options to create a new user, login with an existing user, or use a test token
- Set up a wallet for the user
- Fund the wallet with test money
- Test the Bills Payment API
- Generate a test report

The test report will be saved to `test-environment-report.json`.

### 6. Automated Test Setup

The `automated-test-setup.js` script provides a fully automated test environment setup that works with the mock server.

```bash
node automated-test-setup.js
```

This script will:
- Check if the mock server is running
- Create a test user or login with existing credentials
- Set up a wallet for the user
- Fund the wallet with test money
- Test the Bills Payment API
- Generate a comprehensive test report

The test report will be saved to `test-environment-report.json`.

## Recommended Workflows

### With Actual Server

For testing with the actual server, follow this workflow:

1. Start the server using `start-server.js`
2. Check server health with `server-health-check.js`
3. Set up the test environment with `setup-test-environment.js`
4. Use the generated JWT token for further testing

### With Mock Server

For testing with the mock server, follow this workflow:

1. Start the mock server using `node mock-server.js`
2. Run the automated test setup using `node automated-test-setup.js`
3. Use the generated JWT token in `jwt-token.txt` for manual API testing
4. Check the test report in `test-environment-report.json`

## Common Issues and Solutions

### Server Not Running

If the server is not running, you can start it with:

```bash
node start-server.js
```

For the mock server:

```bash
node mock-server.js
```

### Authentication Failures

If you encounter authentication failures:

1. Check if the JWT_SECRET is set in your .env file
2. Verify that the user exists and is verified
3. Try creating a new user with the `auto-create-test-user.js` script
4. For the mock server, ensure you're using the correct credentials (default: testuser@example.com / password123)

### Wallet Setup Failures

If wallet setup fails:

1. Check if the user is authenticated
2. Verify that the wallet API endpoints are available
3. Check the MongoDB connection (for actual server) or mock database (for mock server)

### Bills Payment API Failures

If the Bills Payment API tests fail:

1. Verify that the user is authenticated
2. Check if the wallet has sufficient funds
3. Ensure that the Bills Payment API endpoints are available
4. For the mock server, check the console logs for any error messages

## Using the JWT Token for Testing

After running any of the scripts, a JWT token will be saved to `jwt-token.txt`. You can use this token for manual API testing:

```bash
# Example using curl
curl -X GET http://localhost:9876/billsPayment/history \
  -H "Authorization: Bearer $(cat jwt-token.txt)"
```

## Mock Server API Endpoints

The mock server provides the following endpoints:

### Authentication

- `POST /auth/register` - Register a new user
- `POST /auth/verify` - Verify a user's email
- `POST /auth/login` - Login and get a JWT token

### Wallet

- `POST /wallet/create` - Create a new wallet
- `GET /wallet/:id` - Get wallet details
- `POST /wallet/fund` - Fund a wallet (test endpoint)

### Bills Payment

- `POST /billsPayment/initiate` - Initiate a new bill payment
- `POST /billsPayment/process/:reference` - Process a pending bill payment
- `GET /billsPayment/status/:reference` - Get status of a bill payment
- `GET /billsPayment/history` - Get bill payment history

### Health

- `GET /health` - Get server health status

## Troubleshooting

If you encounter persistent issues:

1. Run the `server-health-check.js` script to identify specific problems
2. Check the server logs for error messages
3. Verify that all required environment variables are set
4. Ensure that MongoDB is running and accessible (for actual server)
5. For the mock server, check the console output for any error messages

## Next Steps

After setting up the test environment:

1. Review the test reports to identify any issues
2. Use the JWT token for further manual testing
3. Develop additional test cases for specific bill payment scenarios
4. Integrate the test scripts into your CI/CD pipeline
5. Compare results between the actual server and mock server to identify any discrepancies
