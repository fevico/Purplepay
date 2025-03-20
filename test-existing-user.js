/**
 * Purplepay Wallet Functionality Test Script for Existing User
 * 
 * This script tests the wallet functionality using an existing user account.
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2Q5YTNiY2JiYzMxZmY1YmY2YzM5NGMiLCJpYXQiOjE3NDIzMTY1NTAsImV4cCI6MTc0MjMyMDE1MH0.vKZRtzHjFGpwmmiRltbaETB1onEhVairn_NtOn97FD0';

// Function to create a wallet
async function createWallet() {
  try {
    console.log('Creating wallet...');
    const walletData = {
      email: 'test6@example.com',  // Use a new email each time
      account_name: 'Test User',
      phone: '1234567890'
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
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error message:', error.message);
    }
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
    return response.data;
  } catch (error) {
    console.error('Error fetching bank list:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error message:', error.message);
    }
    return null;
  }
}

// Function to get account details
async function getAccountDetails() {
  try {
    console.log('Getting account details...');
    const accountData = {
      accountNumber: '0123456789',
      sortCode: '000014'  // Access Bank sort code
    };
    
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
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received');
    } else {
      console.error('Error message:', error.message);
    }
    return null;
  }
}

// Main function to run tests
async function runTests() {
  try {
    console.log('\n=================================================');
    console.log('PURPLEPAY WALLET FUNCTIONALITY TEST SCRIPT');
    console.log('=================================================\n');
    
    console.log('Starting wallet tests with existing user...');
    console.log('Using API URL:', API_URL);
    console.log('Using AUTH_TOKEN:', AUTH_TOKEN.substring(0, 10) + '...');
    
    // Step 1: Create a wallet
    console.log('\n--- Testing Create Wallet API ---');
    const wallet = await createWallet();
    
    // Step 2: Fetch bank list
    console.log('\n--- Testing Bank List API ---');
    const banks = await fetchBankList();
    
    // Step 3: Get account details
    console.log('\n--- Testing Account Details API ---');
    const accountDetails = await getAccountDetails();
    
    console.log('\nAll tests completed!');
    console.log('\nSummary:');
    console.log('1. Wallet creation: ' + (wallet ? 'SUCCESS' : 'FAILED'));
    console.log('2. Bank list retrieval: ' + (banks ? 'SUCCESS' : 'FAILED'));
    console.log('3. Account details retrieval: ' + (accountDetails ? 'SUCCESS' : 'FAILED'));
  } catch (error) {
    console.error('\nTest failed:', error.message);
  }
}

// Run the tests
runTests();
