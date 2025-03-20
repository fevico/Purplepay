/**
 * Script to complete a pending wallet funding
 * 
 * This script completes a pending funding transaction by simulating
 * a payment gateway callback.
 * 
 * Run with: node complete-funding.js <reference>
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
let authToken = '';

// Get reference from command line arguments
const reference = process.argv[2];

if (!reference) {
  console.error('Please provide a reference as a command line argument');
  console.error('Usage: node complete-funding.js <reference>');
  process.exit(1);
}

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

// Complete funding by simulating payment gateway callback
const completeFunding = async (reference) => {
  try {
    console.log(`Completing funding for reference: ${reference}`);
    
    // Try different endpoints that might handle payment completion
    
    // Try the payment verification endpoint
    try {
      const verifyResponse = await api.post('/payment/verify', {
        reference
      });
      
      logResult('Verify Payment', true, verifyResponse.data);
      return true;
    } catch (verifyError) {
      console.log('Payment verification failed, trying callback endpoint...');
      
      // Try the payment callback endpoint
      try {
        const callbackResponse = await api.post('/payment/callback', {
          reference,
          status: 'success',
          message: 'Payment was successful'
        });
        
        logResult('Payment Callback', true, callbackResponse.data);
        return true;
      } catch (callbackError) {
        // Try the test completion endpoint
        console.log('Payment callback failed, trying test completion endpoint...');
        
        try {
          const testResponse = await api.post('/wallet/test-complete-funding', {
            reference
          });
          
          logResult('Test Complete Funding', true, testResponse.data);
          return true;
        } catch (testError) {
          // If all methods fail, try a direct wallet update
          console.log('Test completion failed, trying direct wallet update...');
          
          try {
            const directResponse = await api.post('/wallet/direct-fund', {
              reference,
              amount: 50000, // Assuming this is the amount
              status: 'completed'
            });
            
            logResult('Direct Wallet Update', true, directResponse.data);
            return true;
          } catch (directError) {
            logResult('All Completion Methods', false, null, {
              response: {
                data: 'No suitable completion endpoint found. You may need to create one.'
              }
            });
            return false;
          }
        }
      }
    }
  } catch (error) {
    logResult('Complete Funding', false, null, error);
    return false;
  }
};

// Run the script
const run = async () => {
  console.log(`🚀 Starting Funding Completion Script for reference: ${reference}`);
  
  // Get initial wallet details
  if (await login()) {
    const initialWallet = await getWalletDetails();
    
    if (initialWallet) {
      console.log(`Initial balance: ${initialWallet.balance} NGN`);
      
      // Complete the funding
      await completeFunding(reference);
      
      // Check updated balance
      const updatedWallet = await getWalletDetails();
      if (updatedWallet) {
        console.log(`\nUpdated balance: ${updatedWallet.balance} NGN`);
        console.log(`Difference: ${updatedWallet.balance - initialWallet.balance} NGN`);
      }
    }
  }
  
  console.log('\n✨ Funding Completion Script Completed');
};

// Run the script
run().catch(error => {
  console.error('Script error:', error);
});
