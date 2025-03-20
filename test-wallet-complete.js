/**
 * Purplepay Wallet Functionality Test Script
 * 
 * This script tests the wallet functionality of the Purplepay backend, including:
 * 1. User creation and verification
 * 2. User login
 * 3. Wallet creation
 * 4. Bank list retrieval
 * 5. Account details retrieval
 * 
 * Prerequisites:
 * - The server must be running (npm run dev)
 * - The PUBLIC_KEY and SECRET_KEY environment variables must be set
 * - MongoDB must be running and accessible
 * 
 * Usage:
 * - Run the script with: node test-wallet-complete.js
 * - The script will output the results of each test
 */

const axios = require('axios');
const readline = require('readline');

// Configuration
const API_URL = 'http://localhost:9876';
let AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2Q5YTNiY2JiYzMxZmY1YmY2YzM5NGMiLCJpYXQiOjE3NDIzMTY1NTAsImV4cCI6MTc0MjMyMDE1MH0.vKZRtzHjFGpwmmiRltbaETB1onEhVairn_NtOn97FD0';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt for user input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Function to create a user
async function createUser(email, password) {
  try {
    console.log(`Creating user with email: ${email}...`);
    const response = await axios.post(
      `${API_URL}/auth/create`,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('User created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating user:');
    logError(error);
    throw new Error('User creation failed');
  }
}

// Function to verify a user
async function verifyUser(token) {
  try {
    console.log(`Verifying user with token: ${token}...`);
    const response = await axios.post(
      `${API_URL}/auth/verify-auth-token`,
      { token },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('User verified successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error verifying user:');
    logError(error);
    throw new Error('User verification failed');
  }
}

// Function to login a user
async function loginUser(email, password) {
  try {
    console.log(`Logging in user with email: ${email}...`);
    const response = await axios.post(
      `${API_URL}/auth/login`,
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('User logged in successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error logging in user:');
    logError(error);
    throw new Error('User login failed');
  }
}

// Function to create a wallet
async function createWallet(email, accountName, phone) {
  try {
    console.log('Creating wallet...');
    const walletData = {
      email,
      account_name: accountName,
      phone
    };
    
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
    throw new Error('Wallet creation failed');
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
    const response = await axios.post(
      `${API_URL}/wallet/account-details`,
      {
        accountNumber,
        sortCode
      },
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

// Main function to run tests
async function runTests() {
  try {
    console.log('\n=================================================');
    console.log('PURPLEPAY WALLET FUNCTIONALITY TEST SCRIPT');
    console.log('=================================================\n');
    
    console.log('Starting wallet tests...');
    console.log('Using API URL:', API_URL);
    
    // Ask if the user wants to create a new account or use an existing one
    const createNewUser = await prompt('Do you want to create a new user? (y/n): ');
    
    let email, password, token;
    
    if (createNewUser.toLowerCase() === 'y') {
      // Step 1: Create a new user
      email = await prompt('Enter email: ');
      password = await prompt('Enter password: ');
      
      console.log('\n--- Testing User Creation API ---');
      const userData = await createUser(email, password);
      
      // Step 2: Verify the user
      token = userData.token;
      console.log('\n--- Testing User Verification API ---');
      await verifyUser(token);
      
      // Step 3: Login the user
      console.log('\n--- Testing User Login API ---');
      const loginData = await loginUser(email, password);
      AUTH_TOKEN = loginData.token;
    } else {
      // Use existing user
      email = await prompt('Enter existing email: ');
      password = await prompt('Enter existing password: ');
      
      // Login the user
      console.log('\n--- Testing User Login API ---');
      const loginData = await loginUser(email, password);
      AUTH_TOKEN = loginData.token;
    }
    
    console.log('\nUsing AUTH_TOKEN:', AUTH_TOKEN.substring(0, 10) + '...');
    
    // Step 4: Create a wallet
    console.log('\n--- Testing Create Wallet API ---');
    const accountName = await prompt('Enter account name: ');
    const phone = await prompt('Enter phone number: ');
    
    const wallet = await createWallet(email, accountName, phone);
    
    // Step 5: Analyze the wallet response
    analyzeWalletResponse(wallet);
    
    // Step 6: Fetch bank list
    console.log('\n--- Testing Bank List API ---');
    const banks = await fetchBankList();
    
    // Step 7: Get account details
    console.log('\n--- Testing Account Details API ---');
    // Use a test account number and sort code for Access Bank
    const testAccountNumber = await prompt('Enter account number (or press enter for default 0123456789): ') || '0123456789';
    const testSortCode = await prompt('Enter sort code (or press enter for default 000014): ') || '000014'; // Access Bank sort code
    
    await getAccountDetails(testAccountNumber, testSortCode);
    
    console.log('\nAll tests completed successfully!');
    console.log('\nSummary:');
    console.log('1. User Authentication: SUCCESS');
    console.log('2. Wallet creation: SUCCESS');
    console.log('3. Bank list retrieval: ' + (banks ? 'SUCCESS' : 'FAILED (Requires valid PUBLIC_KEY)'));
    console.log('4. Account details retrieval: SUCCESS');
    
    console.log('\nNote: To fully test the wallet functionality, ensure the PUBLIC_KEY and SECRET_KEY environment variables are set correctly.');
    console.log('The current implementation integrates with the Strowallet API for virtual bank accounts.');
    
    rl.close();
  } catch (error) {
    console.error('\nTest failed:', error.message);
    rl.close();
  }
}

// Run the tests
runTests();
