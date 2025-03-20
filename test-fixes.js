const axios = require('axios');
const readline = require('readline');

// Configuration
const API_URL = 'http://localhost:3000'; // Update with your API URL
let authToken = '';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt for input
const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

// Helper function for API calls
const apiCall = async (method, endpoint, data = null, auth = true) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (auth && authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers,
      data: data ? data : undefined
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    return null;
  }
};

// Register a test user
const registerUser = async () => {
  const userData = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'Password123!',
    phone: '1234567890'
  };
  
  console.log('Registering test user...');
  const result = await apiCall('post', '/auth/register', userData, false);
  
  if (result && result.token) {
    authToken = result.token;
    console.log('User registered successfully!');
    console.log('Email:', userData.email);
    return userData;
  } else {
    console.error('Failed to register user');
    return null;
  }
};

// Test wallet funding
const testWalletFunding = async () => {
  console.log('\nTesting wallet funding...');
  const amount = 50000; // 50,000 NGN
  
  const result = await apiCall('post', '/wallet/test-fund', { amount });
  
  if (result && result.message === 'Wallet funded successfully') {
    console.log('Wallet funded successfully!');
    console.log('New balance:', result.newBalance);
    console.log('Reference:', result.reference);
    return result;
  } else {
    console.error('Failed to fund wallet');
    return null;
  }
};

// Test transaction filtering
const testTransactionFiltering = async () => {
  console.log('\nTesting transaction filtering...');
  
  // Test with no filters
  console.log('Getting all transactions...');
  const allTransactions = await apiCall('get', '/transactions');
  
  if (allTransactions && allTransactions.transactions) {
    console.log(`Found ${allTransactions.transactions.length} transactions`);
    
    // Test with type filter
    console.log('Getting funding transactions...');
    const fundingTransactions = await apiCall('get', '/transactions?type=funding');
    
    if (fundingTransactions && fundingTransactions.transactions) {
      console.log(`Found ${fundingTransactions.transactions.length} funding transactions`);
      
      // Test transaction details
      if (fundingTransactions.transactions.length > 0) {
        const reference = fundingTransactions.transactions[0].reference;
        console.log(`Getting details for transaction ${reference}...`);
        
        const transactionDetails = await apiCall('get', `/transactions/${reference}`);
        
        if (transactionDetails && transactionDetails.transaction) {
          console.log('Transaction details retrieved successfully!');
          return true;
        } else {
          console.error('Failed to get transaction details');
        }
      }
    } else {
      console.error('Failed to get funding transactions');
    }
  } else {
    console.error('Failed to get transactions');
  }
  
  return false;
};

// Main function
const main = async () => {
  try {
    // Register a test user
    const user = await registerUser();
    if (!user) process.exit(1);
    
    // Fund the wallet
    const fundingResult = await testWalletFunding();
    if (!fundingResult) process.exit(1);
    
    // Test transaction filtering
    const filteringResult = await testTransactionFiltering();
    
    if (filteringResult) {
      console.log('\n✅ All tests passed successfully!');
    } else {
      console.log('\n❌ Some tests failed');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
};

// Run the main function
main();
