const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2Q5YTNiY2JiYzMxZmY1YmY2YzM5NGMiLCJpYXQiOjE3NDIzMTY1NTAsImV4cCI6MTc0MjMyMDE1MH0.vKZRtzHjFGpwmmiRltbaETB1onEhVairn_NtOn97FD0'; // Using the same auth token as in the withdrawal test

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

// Helper function to log section headers
const logSection = (title) => {
  console.log('\n=================================================');
  console.log(title);
  console.log('=================================================\n');
};

// Test the transaction history functionality
async function testTransactionHistory() {
  logSection('PURPLEPAY TRANSACTION HISTORY TEST');
  console.log('Starting transaction history tests...');
  console.log(`Using API URL: ${API_URL}`);

  try {
    // Step 1: Create a new funding transaction
    logSection('STEP 1: Create a new funding transaction');
    const fundingAmount = 500;
    console.log(`Initiating wallet funding of ${formatCurrency(fundingAmount)}...`);
    
    const fundingResponse = await api.post('/wallet/fund', {
      amount: fundingAmount,
      paymentMethod: 'card',
      currency: 'NGN',
      description: 'Test funding for transaction history'
    });
    
    console.log('Funding initiated successfully:', fundingResponse.data);
    const fundingReference = fundingResponse.data.reference;
    
    // Step 2: Verify the funding transaction
    logSection('STEP 2: Verify the funding transaction');
    console.log(`Verifying funding with reference: ${fundingReference}...`);
    
    const verifyFundingResponse = await api.get(`/wallet/verify-funding/${fundingReference}`);
    console.log('Funding verification successful:', verifyFundingResponse.data);
    
    // Step 3: Create a withdrawal transaction
    logSection('STEP 3: Create a withdrawal transaction');
    const withdrawalAmount = 200;
    console.log(`Initiating withdrawal of ${formatCurrency(withdrawalAmount)}...`);
    
    const withdrawalResponse = await api.post('/wallet/withdraw', {
      amount: withdrawalAmount,
      accountNumber: '0123456789',
      bankCode: '058',
      accountName: 'Test User',
      narration: 'Test withdrawal for transaction history'
    });
    
    console.log('Withdrawal initiated successfully:', withdrawalResponse.data);
    const withdrawalReference = withdrawalResponse.data.reference;
    const verificationCode = withdrawalResponse.data.verificationCode;
    
    // Step 4: Verify the withdrawal transaction
    logSection('STEP 4: Verify the withdrawal transaction');
    console.log(`Verifying withdrawal with reference: ${withdrawalReference}...`);
    
    const verifyWithdrawalResponse = await api.post('/wallet/verify-withdrawal', {
      reference: withdrawalReference,
      verificationCode
    });
    
    console.log('Withdrawal verification successful:', verifyWithdrawalResponse.data);
    
    // Step 5: Get all transactions
    logSection('STEP 5: Get all transactions');
    console.log('Fetching all transactions...');
    
    const transactionsResponse = await api.get('/transactions');
    console.log('Transactions retrieved successfully!');
    console.log(`Total transactions: ${transactionsResponse.data.pagination.total}`);
    console.log('Transaction list:', JSON.stringify(transactionsResponse.data.data, null, 2));
    
    // Step 6: Get transactions filtered by type
    logSection('STEP 6: Get transactions filtered by type');
    console.log('Fetching funding transactions...');
    
    const fundingTransactionsResponse = await api.get('/transactions?type=funding');
    console.log('Funding transactions retrieved successfully!');
    console.log(`Total funding transactions: ${fundingTransactionsResponse.data.pagination.total}`);
    
    console.log('Fetching withdrawal transactions...');
    const withdrawalTransactionsResponse = await api.get('/transactions?type=withdrawal');
    console.log('Withdrawal transactions retrieved successfully!');
    console.log(`Total withdrawal transactions: ${withdrawalTransactionsResponse.data.pagination.total}`);
    
    // Step 7: Get transaction details by reference
    logSection('STEP 7: Get transaction details by reference');
    console.log(`Fetching details for funding transaction with reference: ${fundingReference}...`);
    
    const fundingDetailsResponse = await api.get(`/transactions/${fundingReference}`);
    console.log('Funding transaction details retrieved successfully!');
    console.log('Funding transaction details:', JSON.stringify(fundingDetailsResponse.data.data, null, 2));
    
    // Step 8: Get transaction summary
    logSection('STEP 8: Get transaction summary');
    console.log('Fetching transaction summary...');
    
    const summaryResponse = await api.get('/transactions/summary');
    console.log('Transaction summary retrieved successfully!');
    console.log('Transaction summary:', JSON.stringify(summaryResponse.data.data, null, 2));
    
    logSection('TEST RESULTS');
    console.log('✅ TRANSACTION HISTORY TEST PASSED!');
    console.log(`Successfully created and retrieved transactions of different types.`);
    console.log(`Successfully filtered transactions by type and retrieved transaction details.`);
    console.log(`Successfully generated transaction summary.`);
    
  } catch (error) {
    console.error('❌ TEST FAILED!');
    console.error('Error details:', error.response ? error.response.data : error.message);
  }
  
  console.log(`\nTest completed at: ${new Date().toISOString()}`);
}

// Run the test
testTransactionHistory();
