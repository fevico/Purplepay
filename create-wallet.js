const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:9876';
const TOKEN_FILE = path.join(__dirname, 'jwt-token.txt');

// Read the JWT token from file
const getToken = () => {
  try {
    return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  } catch (error) {
    console.error('Error reading token file:', error.message);
    return null;
  }
};

// Create a wallet for the user
const createWallet = async () => {
  const token = getToken();
  if (!token) {
    console.error('No token found. Please login first.');
    return;
  }

  try {
    console.log('Creating wallet...');
    const response = await axios.post(
      `${API_URL}/wallet/create`,
      { email: 'test@mycom' },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('Wallet creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating wallet:', error.response?.data || error.message);
    return null;
  }
};

// Test fund the wallet
const testFundWallet = async () => {
  const token = getToken();
  if (!token) {
    console.error('No token found. Please login first.');
    return;
  }

  try {
    console.log('Testing wallet funding...');
    const response = await axios.post(
      `${API_URL}/wallet/test-fund`,
      { amount: 10000 },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('Wallet funding response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error funding wallet:', error.response?.data || error.message);
    return null;
  }
};

// Get wallet details
const getWalletDetails = async () => {
  const token = getToken();
  if (!token) {
    console.error('No token found. Please login first.');
    return;
  }

  try {
    console.log('Getting wallet details...');
    const response = await axios.get(
      `${API_URL}/wallet/details`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('Wallet details:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error getting wallet details:', error.response?.data || error.message);
    return null;
  }
};

// Main function
const main = async () => {
  console.log('=== Wallet Operations ===');
  
  // Create wallet
  await createWallet();
  
  // Get wallet details
  await getWalletDetails();
  
  // Test fund wallet
  await testFundWallet();
  
  // Get updated wallet details
  await getWalletDetails();
  
  console.log('=== All Operations Completed ===');
};

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
});
