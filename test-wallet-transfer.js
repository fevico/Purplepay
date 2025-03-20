const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
// Using the same auth token as in the withdrawal test
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2Q5YTNiY2JiYzMxZmY1YmY2YzM5NGMiLCJpYXQiOjE3NDIzMTY1NTAsImV4cCI6MTc0MjMyMDE1MH0.vKZRtzHjFGpwmmiRltbaETB1onEhVairn_NtOn97FD0';
const TRANSFER_AMOUNT = 200; // Amount to transfer
// For testing purposes, we'll use a mock recipient email
// In a real scenario, this would be an actual user's email
const RECIPIENT_EMAIL = 'test@example.com';

// Axios instance with authorization header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
};

// Helper function to add a separator line
const addSeparator = () => {
  console.log('\n=================================================\n');
};

// Main test function
async function testWalletTransfer() {
  console.log('\n=================================================');
  console.log('PURPLEPAY WALLET TRANSFER TEST');
  console.log('=================================================\n');

  console.log('Starting wallet transfer tests...');
  console.log(`Using API URL: ${API_URL}`);

  try {
    // Step 1: Get wallet details before transfer
    console.log('\nFetching wallet details before transfer...');
    const walletResponse = await api.get('/wallet/details');
    console.log('Wallet details fetched successfully:', walletResponse.data);

    const walletId = walletResponse.data.wallet._id;
    const initialBalance = walletResponse.data.wallet.balance;

    console.log('\n--- Wallet Details Before Transfer ---');
    console.log(`Wallet ID: ${walletId}`);
    console.log(`Current Balance: ${initialBalance} NGN`);

    // Step 2: Initiate wallet transfer
    console.log(`\nInitiating transfer of ${TRANSFER_AMOUNT} NGN to ${RECIPIENT_EMAIL}...`);
    const transferResponse = await api.post('/wallet/transfer', {
      recipientEmail: RECIPIENT_EMAIL,
      amount: TRANSFER_AMOUNT,
      description: 'Test wallet transfer'
    });
    console.log('Transfer initiated successfully:', transferResponse.data);

    const reference = transferResponse.data.reference;
    const verificationCode = transferResponse.data.verificationCode;

    // Step 3: Verify wallet transfer
    console.log(`\nVerifying transfer with reference: ${reference}...`);
    const verifyResponse = await api.post('/wallet/verify-transfer', {
      reference,
      verificationCode
    });
    console.log('Transfer verification successful:', verifyResponse.data);

    // Step 4: Check transfer status
    console.log(`\nChecking transfer status for reference: ${reference}...`);
    const statusResponse = await api.get(`/wallet/transfer-status/${reference}`);
    console.log('Transfer status retrieved successfully:', statusResponse.data);

    // Step 5: Get updated wallet details
    console.log('\nFetching updated wallet details...');
    const updatedWalletResponse = await api.get('/wallet/details');
    console.log('Updated wallet details fetched successfully:', updatedWalletResponse.data);

    const updatedBalance = updatedWalletResponse.data.wallet.balance;

    console.log('\n--- Wallet Details After Transfer ---');
    console.log(`Wallet ID: ${walletId}`);
    console.log(`Updated Balance: ${updatedBalance} NGN`);

    // Step 6: Check transaction history for the transfer
    console.log('\nChecking transaction history for the transfer...');
    const transactionsResponse = await api.get('/transactions?type=transfer');
    console.log('Transaction history retrieved successfully!');
    console.log(`Total transfer transactions: ${transactionsResponse.data.pagination.total}`);

    // Verify the test results
    if (initialBalance - TRANSFER_AMOUNT === updatedBalance) {
      console.log('\n✅ WALLET TRANSFER TEST PASSED!');
      console.log(`Balance correctly updated from ${initialBalance} to ${updatedBalance} NGN`);
    } else {
      console.log('\n❌ WALLET TRANSFER TEST FAILED!');
      console.log(`Balance not updated correctly. Expected: ${initialBalance - TRANSFER_AMOUNT}, Actual: ${updatedBalance}`);
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error details:', error.response ? error.response.data : error.message);
  }

  console.log(`\nTest completed at: ${new Date().toISOString()}`);
}

// Run the test
testWalletTransfer();
