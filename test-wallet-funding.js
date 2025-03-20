/**
 * Purplepay Wallet Funding Test Script
 * 
 * This script tests the wallet funding functionality of the Purplepay backend.
 * It includes:
 * 1. Creating a wallet (if needed)
 * 2. Funding the wallet with a specified amount
 * 3. Verifying the updated wallet balance
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

// Function to create a wallet (if needed)
async function createWallet() {
  try {
    console.log('Creating wallet...');
    const walletData = {
      email: `test${Date.now()}@example.com`,  // Use a unique email each time
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
    return response.data.createWallet;
  } catch (error) {
    console.error('Error creating wallet:');
    logError(error);
    return null;
  }
}

// Function to get wallet details
async function getWalletDetails() {
  try {
    console.log('Fetching wallet details...');
    const response = await axios.get(
      `${API_URL}/wallet/details`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    console.log('Wallet details fetched successfully:', response.data);
    return response.data.wallet;
  } catch (error) {
    console.error('Error fetching wallet details:');
    logError(error);
    return null;
  }
}

// Function to fund wallet
async function fundWallet(amount, paymentMethod = 'card') {
  try {
    console.log(`Funding wallet with ${amount} NGN using ${paymentMethod}...`);
    const fundingData = {
      amount,
      paymentMethod,
      currency: 'NGN',
      description: 'Wallet funding test'
    };
    
    const response = await axios.post(
      `${API_URL}/wallet/fund`,
      fundingData,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Wallet funding initiated successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error funding wallet:');
    logError(error);
    return null;
  }
}

// Function to verify wallet funding
async function verifyFunding(reference) {
  try {
    console.log(`Verifying funding with reference: ${reference}...`);
    const response = await axios.get(
      `${API_URL}/wallet/verify-funding/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    console.log('Funding verification successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error verifying funding:');
    logError(error);
    return null;
  }
}

// Main function to run tests
async function runTests() {
  try {
    console.log('\n=================================================');
    console.log('PURPLEPAY WALLET FUNDING TEST');
    console.log('=================================================\n');
    
    console.log('Starting wallet funding tests...');
    console.log('Using API URL:', API_URL);
    
    // Step 1: Get wallet details or create a wallet if needed
    let wallet = await getWalletDetails();
    
    if (!wallet) {
      console.log('No wallet found. Creating a new wallet...');
      wallet = await createWallet();
      
      if (!wallet) {
        throw new Error('Failed to create wallet. Cannot proceed with funding test.');
      }
    }
    
    console.log('\n--- Wallet Details Before Funding ---');
    console.log('Wallet ID:', wallet._id);
    console.log('Current Balance:', wallet.balance, 'NGN');
    
    // Step 2: Fund the wallet
    const fundingAmount = 1000; // 1000 NGN
    const fundingResult = await fundWallet(fundingAmount);
    
    if (!fundingResult) {
      throw new Error('Wallet funding failed. Test aborted.');
    }
    
    // Step 3: Verify the funding
    const reference = fundingResult.reference;
    const verificationResult = await verifyFunding(reference);
    
    if (!verificationResult) {
      throw new Error('Funding verification failed. Test aborted.');
    }
    
    // Step 4: Get updated wallet details
    const updatedWallet = await getWalletDetails();
    
    if (!updatedWallet) {
      throw new Error('Failed to fetch updated wallet details. Test aborted.');
    }
    
    console.log('\n--- Wallet Details After Funding ---');
    console.log('Wallet ID:', updatedWallet._id);
    console.log('Updated Balance:', updatedWallet.balance, 'NGN');
    
    // Step 5: Verify the balance was updated correctly
    const expectedBalance = wallet.balance + fundingAmount;
    const actualBalance = updatedWallet.balance;
    
    if (actualBalance === expectedBalance) {
      console.log('\n✅ WALLET FUNDING TEST PASSED!');
      console.log(`Balance correctly updated from ${wallet.balance} to ${actualBalance} NGN`);
    } else {
      console.log('\n❌ WALLET FUNDING TEST FAILED!');
      console.log(`Expected balance: ${expectedBalance} NGN, Actual balance: ${actualBalance} NGN`);
    }
    
    console.log('\nTest completed at:', new Date().toISOString());
  } catch (error) {
    console.error('\nTest failed with an unexpected error:', error.message);
  }
}

// Run the tests
runTests();
