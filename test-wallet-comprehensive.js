/**
 * Purplepay Wallet Functionality Comprehensive Test Script
 * 
 * This script tests all wallet functionality using an existing user account.
 * It includes detailed logging and error handling.
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2Q5YTNiY2JiYzMxZmY1YmY2YzM5NGMiLCJpYXQiOjE3NDIzMTY1NTAsImV4cCI6MTc0MjMyMDE1MH0.vKZRtzHjFGpwmmiRltbaETB1onEhVairn_NtOn97FD0';

// Helper function to log errors
function logError(error) {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    console.error('Response headers:', error.response.headers);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received:', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Error message:', error.message);
  }
}

// Function to create a wallet
async function createWallet() {
  try {
    console.log('Creating wallet...');
    const walletData = {
      email: `test${Date.now()}@example.com`,  // Use a unique email each time
      account_name: 'Test User',
      phone: '1234567890'
    };
    
    console.log('Request data:', walletData);
    
    const response = await axios.post(
      `${API_URL}/wallet/create`, 
      walletData,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Wallet created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating wallet:');
    logError(error);
    return null;
  }
}

// Function to fetch bank list
async function fetchBankList() {
  try {
    console.log('Fetching bank list...');
    const response = await axios.get(
      `${API_URL}/wallet/bank-list`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    console.log('Bank list fetched successfully. Found', response.data.banks.length, 'banks');
    console.log('First 5 banks:', response.data.banks.slice(0, 5));
    return response.data;
  } catch (error) {
    console.error('Error fetching bank list:');
    logError(error);
    return null;
  }
}

// Function to get account details
async function getAccountDetails(accountNumber, sortCode) {
  try {
    console.log(`Getting account details for account number: ${accountNumber}, sort code: ${sortCode}...`);
    const accountData = {
      accountNumber,
      sortCode
    };
    
    console.log('Request data:', accountData);
    
    const response = await axios.post(
      `${API_URL}/wallet/account-details`,
      accountData,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Account details fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching account details:');
    logError(error);
    return null;
  }
}

// Function to analyze wallet response
function analyzeWalletResponse(walletResponse) {
  console.log('\n--- Wallet Analysis ---');
  
  if (!walletResponse) {
    console.log('No wallet response to analyze');
    return;
  }
  
  const wallet = walletResponse.createWallet;
  
  if (!wallet) {
    console.log('No wallet data found in response');
    return;
  }
  
  console.log('Wallet ID:', wallet._id);
  console.log('User ID:', wallet.userId);
  console.log('Balance:', wallet.balance);
  console.log('Created At:', wallet.createdAt);
  
  // Check if the wallet has bank details
  if (wallet.bankName) {
    console.log('Bank Name:', wallet.bankName);
  } else {
    console.log('Bank Name: Not provided');
  }
  
  if (wallet.accountName) {
    console.log('Account Name:', wallet.accountName);
  } else {
    console.log('Account Name: Not provided');
  }
  
  if (wallet.accountNumber) {
    console.log('Account Number:', wallet.accountNumber);
  } else {
    console.log('Account Number: Not provided');
  }
}

// Main function to run tests
async function runTests() {
  try {
    console.log('\n=================================================');
    console.log('PURPLEPAY WALLET FUNCTIONALITY COMPREHENSIVE TEST');
    console.log('=================================================\n');
    
    console.log('Starting wallet tests with existing user...');
    console.log('Using API URL:', API_URL);
    console.log('Using AUTH_TOKEN:', AUTH_TOKEN.substring(0, 10) + '...');
    
    // Step 1: Create a wallet
    console.log('\n--- Testing Create Wallet API ---');
    const wallet = await createWallet();
    
    // Step 2: Analyze the wallet response
    if (wallet) {
      analyzeWalletResponse(wallet);
    }
    
    // Step 3: Fetch bank list
    console.log('\n--- Testing Bank List API ---');
    const banks = await fetchBankList();
    
    // Step 4: Get account details for Access Bank
    console.log('\n--- Testing Account Details API (Access Bank) ---');
    const accessBankDetails = await getAccountDetails('0123456789', '000014'); // Access Bank sort code
    
    // Step 5: Get account details for another bank (GTBank)
    console.log('\n--- Testing Account Details API (GTBank) ---');
    const gtBankDetails = await getAccountDetails('0123456789', '000013'); // GTBank sort code
    
    console.log('\n=================================================');
    console.log('TEST RESULTS SUMMARY');
    console.log('=================================================');
    console.log('1. Wallet creation: ' + (wallet ? 'SUCCESS' : 'FAILED'));
    console.log('2. Bank list retrieval: ' + (banks ? 'SUCCESS' : 'FAILED'));
    console.log('3. Account details (Access Bank): ' + (accessBankDetails ? 'SUCCESS' : 'FAILED'));
    console.log('4. Account details (GTBank): ' + (gtBankDetails ? 'SUCCESS' : 'FAILED'));
    
    // Calculate overall success rate
    const totalTests = 4;
    const passedTests = [wallet, banks, accessBankDetails, gtBankDetails].filter(Boolean).length;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log(`\nOverall Success Rate: ${successRate}% (${passedTests}/${totalTests} tests passed)`);
    
    if (successRate === 100) {
      console.log('\n✅ ALL TESTS PASSED SUCCESSFULLY!');
      console.log('The wallet functionality is working as expected.');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED');
      console.log('Please check the logs above for details on the failed tests.');
    }
    
    console.log('\nTest completed at:', new Date().toISOString());
  } catch (error) {
    console.error('\nTest failed with an unexpected error:', error.message);
  }
}

// Run the tests
runTests();
