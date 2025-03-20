const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const API_URL = 'http://localhost:9876'; // Change this to your API URL
let TOKEN = ''; // Will be set by user input

// Headers with authentication
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
});

// Utility function to prompt user
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Test functions
async function getWalletBalance() {
  try {
    console.log('\n=== Checking Wallet Balance ===');
    
    const response = await axios.get(`${API_URL}/wallet`, { 
      headers: getHeaders() 
    });
    
    console.log('Wallet Information:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error getting wallet balance:', error.response?.data || error.message);
    return null;
  }
}

async function fundWallet() {
  try {
    console.log('\n=== Funding Wallet ===');
    
    const amount = await prompt('Enter amount to fund (e.g., 10000): ');
    
    const response = await axios.post(`${API_URL}/wallet/fund`, {
      amount: Number(amount),
      currency: 'NGN'
    }, { 
      headers: getHeaders() 
    });
    
    console.log('Funding Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error funding wallet:', error.response?.data || error.message);
    return null;
  }
}

// Main function
async function setupWallet() {
  try {
    TOKEN = await prompt('Enter your JWT token: ');
    
    if (!TOKEN) {
      console.log('Token is required. Please run login-test.js to get a token.');
      return;
    }
    
    // Check wallet balance
    const walletInfo = await getWalletBalance();
    
    if (!walletInfo || !walletInfo.wallet) {
      console.log('Could not retrieve wallet information. Please check your token.');
      return;
    }
    
    // Ask if user wants to fund wallet
    const shouldFund = await prompt('Do you want to fund your wallet? (y/n): ');
    
    if (shouldFund.toLowerCase() === 'y') {
      await fundWallet();
      
      // Check updated balance
      await getWalletBalance();
    }
    
    console.log('\n=== Wallet Setup Complete ===');
    console.log('You can now run test-bills-payment.js to test the Bills Payment API');
    
  } catch (error) {
    console.error('Error setting up wallet:', error);
  } finally {
    rl.close();
  }
}

// Run the setup
setupWallet().catch(error => {
  console.error('Error running setup:', error);
  rl.close();
});
