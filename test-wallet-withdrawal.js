const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
// Using the same auth token as in the funding test
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2Q5YTNiY2JiYzMxZmY1YmY2YzM5NGMiLCJpYXQiOjE3NDIzMTY1NTAsImV4cCI6MTc0MjMyMDE1MH0.vKZRtzHjFGpwmmiRltbaETB1onEhVairn_NtOn97FD0';
const WITHDRAWAL_AMOUNT = 500; // Amount to withdraw
const BANK_CODE = '058'; // Guaranty Trust Bank
const ACCOUNT_NUMBER = '0123456789';
const ACCOUNT_NAME = 'John Doe';

// Helper function to log with formatting
const log = (message, data = null) => {
  if (data) {
    console.log(`${message}`, data);
  } else {
    console.log(message);
  }
};

// Helper function to add a separator line
const addSeparator = () => {
  console.log('\n---------------------------------------------------\n');
};

// Main test function
async function testWalletWithdrawal() {
  console.log('\n=================================================');
  console.log('PURPLEPAY WALLET WITHDRAWAL TEST');
  console.log('=================================================\n');

  console.log('Starting wallet withdrawal tests...');
  console.log(`Using API URL: ${API_URL}`);

  try {
    // Set the authorization header for requests
    const config = {
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`
      }
    };

    // Step 1: Get wallet details before withdrawal
    log('Fetching wallet details...');
    const walletResponse = await axios.get(`${API_URL}/wallet/details`, config);
    log('Wallet details fetched successfully:', walletResponse.data);

    const walletId = walletResponse.data.wallet._id;
    const initialBalance = walletResponse.data.wallet.balance;

    log('\n--- Wallet Details Before Withdrawal ---');
    log(`Wallet ID: ${walletId}`);
    log(`Current Balance: ${initialBalance} NGN`);

    // Check if wallet has sufficient balance
    if (initialBalance < WITHDRAWAL_AMOUNT) {
      log(`\n⚠️ Insufficient balance for withdrawal. Current balance: ${initialBalance} NGN, Withdrawal amount: ${WITHDRAWAL_AMOUNT} NGN`);
      log('Please fund the wallet first using the test-wallet-funding.js script.');
      return;
    }

    // Step 2: Initiate withdrawal
    log(`\nInitiating withdrawal of ${WITHDRAWAL_AMOUNT} NGN to account ${ACCOUNT_NUMBER}...`);
    const withdrawalResponse = await axios.post(
      `${API_URL}/wallet/withdraw`,
      {
        amount: WITHDRAWAL_AMOUNT,
        accountNumber: ACCOUNT_NUMBER,
        bankCode: BANK_CODE,
        accountName: ACCOUNT_NAME,
        narration: 'Test withdrawal'
      },
      config
    );

    log('Withdrawal initiated successfully:', withdrawalResponse.data);

    const reference = withdrawalResponse.data.reference;
    const verificationCode = withdrawalResponse.data.verificationCode;

    // Step 3: Verify withdrawal with OTP
    log(`\nVerifying withdrawal with reference: ${reference}...`);
    const verificationResponse = await axios.post(
      `${API_URL}/wallet/verify-withdrawal`,
      {
        reference,
        verificationCode
      },
      config
    );

    log('Withdrawal verification successful:', verificationResponse.data);

    // Step 4: Check withdrawal status
    log(`\nChecking withdrawal status for reference: ${reference}...`);
    const statusResponse = await axios.get(
      `${API_URL}/wallet/withdrawal-status/${reference}`,
      config
    );

    log('Withdrawal status retrieved successfully:', statusResponse.data);

    // Step 5: Get wallet details after withdrawal
    log('\nFetching updated wallet details...');
    const updatedWalletResponse = await axios.get(`${API_URL}/wallet/details`, config);
    log('Updated wallet details fetched successfully:', updatedWalletResponse.data);

    const finalBalance = updatedWalletResponse.data.wallet.balance;

    log('\n--- Wallet Details After Withdrawal ---');
    log(`Wallet ID: ${walletId}`);
    log(`Updated Balance: ${finalBalance} NGN`);

    // Verify the balance was correctly updated
    const expectedBalance = initialBalance - WITHDRAWAL_AMOUNT;
    if (finalBalance === expectedBalance) {
      log(`\n✅ WALLET WITHDRAWAL TEST PASSED!`);
      log(`Balance correctly updated from ${initialBalance} to ${finalBalance} NGN`);
    } else {
      log(`\n❌ WALLET WITHDRAWAL TEST FAILED!`);
      log(`Balance not updated correctly. Expected: ${expectedBalance}, Actual: ${finalBalance}`);
    }

  } catch (error) {
    console.error('\n❌ ERROR DURING WALLET WITHDRAWAL TEST:');
    if (error.response) {
      console.error('Response error:', error.response.data);
      console.error('Status:', error.response.status);
    } else if (error.request) {
      console.error('Request error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
  }

  log(`\nTest completed at: ${new Date().toISOString()}`);
}

// Run the test
testWalletWithdrawal();
