/**
 * Script to fund a test wallet using the API
 * 
 * This script uses the API endpoints to register, login, and fund a wallet
 * 
 * Run with: node api-fund-wallet.js
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
let authToken = '';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123'
};

// Axios instance with auth header
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Set auth token for subsequent requests
const setAuthToken = (token) => {
  authToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Helper to log results
const logResult = (name, success, data = null, error = null) => {
  console.log(`\n----- ${name} -----`);
  if (success) {
    console.log('✅ SUCCESS');
    if (data) console.log('Data:', JSON.stringify(data, null, 2));
  } else {
    console.log('❌ FAILED');
    if (error) {
      console.log('Error:', error.response?.data || error.message);
      console.log('Status:', error.response?.status);
    }
  }
};

// Login and get auth token
const login = async () => {
  try {
    console.log('Attempting to login...');
    const response = await api.post('/auth/login', TEST_USER);
    setAuthToken(response.data.token);
    logResult('Login', true, { token: authToken.substring(0, 15) + '...' });
    return true;
  } catch (error) {
    logResult('Login', false, null, error);
    return false;
  }
};

// Get wallet details
const getWalletDetails = async () => {
  try {
    console.log('Getting wallet details...');
    const response = await api.get('/wallet/details');
    logResult('Get Wallet Details', true, response.data);
    return response.data.wallet;
  } catch (error) {
    logResult('Get Wallet Details', false, null, error);
    return null;
  }
};

// Fund wallet using the API
const fundWallet = async (amount) => {
  try {
    console.log(`Funding wallet with ${amount} NGN...`);
    
    // Check if there's a direct funding endpoint
    // If not, we'll use a mock funding endpoint or create one
    
    // Try the direct funding endpoint first
    try {
      const response = await api.post('/wallet/fund', {
        amount,
        currency: 'NGN',
        method: 'test'
      });
      
      logResult('Fund Wallet', true, response.data);
      return true;
    } catch (directError) {
      console.log('Direct funding failed, trying alternative method...');
      
      // Try the mock funding endpoint
      try {
        const mockResponse = await api.post('/wallet/mock-fund', {
          amount,
          currency: 'NGN'
        });
        
        logResult('Mock Fund Wallet', true, mockResponse.data);
        return true;
      } catch (mockError) {
        // If both methods fail, we'll need to check if there's a test endpoint
        console.log('Mock funding failed, checking for test endpoints...');
        
        try {
          const testResponse = await api.post('/wallet/test-fund', {
            amount,
            currency: 'NGN'
          });
          
          logResult('Test Fund Wallet', true, testResponse.data);
          return true;
        } catch (testError) {
          logResult('All Funding Methods', false, null, {
            response: {
              data: 'No suitable funding endpoint found. You may need to create one.'
            }
          });
          return false;
        }
      }
    }
  } catch (error) {
    logResult('Fund Wallet', false, null, error);
    return false;
  }
};

// Run the script
const run = async () => {
  console.log('🚀 Starting Wallet Funding Script');
  
  if (await login()) {
    const wallet = await getWalletDetails();
    
    if (wallet) {
      console.log(`Current balance: ${wallet.balance} NGN`);
      
      // Fund with 50,000 NGN
      const fundingAmount = 50000;
      await fundWallet(fundingAmount);
      
      // Check updated balance
      const updatedWallet = await getWalletDetails();
      if (updatedWallet) {
        console.log(`\nUpdated balance: ${updatedWallet.balance} NGN`);
        console.log(`Difference: ${updatedWallet.balance - wallet.balance} NGN`);
      }
    }
  }
  
  console.log('\n✨ Wallet Funding Script Completed');
};

// Run the script
run().catch(error => {
  console.error('Script error:', error);
});
