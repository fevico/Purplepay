const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:9876';
const TOKEN_FILE = path.join(__dirname, 'jwt-token.txt');
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Read the JWT token from file
const getToken = () => {
  try {
    return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  } catch (error) {
    console.error('Error reading token file:', error.message);
    return null;
  }
};

// Helper function for retrying API calls
const retryApiCall = async (apiCall, retries = MAX_RETRIES) => {
  try {
    return await apiCall();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    
    console.log(`Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    
    return retryApiCall(apiCall, retries - 1);
  }
};

// Test the Bills Payment History endpoint
const testBillsPaymentHistory = async () => {
  const token = getToken();
  if (!token) {
    console.error('No token found. Please login first.');
    return;
  }

  console.log('\n=== Testing Bills Payment History ===');
  
  try {
    const response = await retryApiCall(() => 
      axios.get(`${API_URL}/billsPayment/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    );
    
    console.log('History Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error getting bill payment history:');
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('No response received. Server might be down.');
    } else {
      console.error('Error setting up request:', error.message);
    }
    return null;
  }
};

// Create a test wallet
const createTestWallet = async () => {
  const token = getToken();
  if (!token) {
    console.error('No token found. Please login first.');
    return;
  }

  console.log('\n=== Creating Test Wallet ===');
  
  try {
    const response = await retryApiCall(() => 
      axios.post(`${API_URL}/wallet/create`, 
        { email: 't@ttt.com' },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )
    );
    
    console.log('Wallet Creation Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error creating wallet:');
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('No response received. Server might be down.');
    } else {
      console.error('Error setting up request:', error.message);
    }
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

  console.log('\n=== Test Funding Wallet ===');
  
  try {
    const response = await retryApiCall(() => 
      axios.post(`${API_URL}/wallet/test-fund`, 
        { amount: 10000 },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      )
    );
    
    console.log('Wallet Funding Response:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error funding wallet:');
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('No response received. Server might be down.');
    } else {
      console.error('Error setting up request:', error.message);
    }
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

  console.log('\n=== Getting Wallet Details ===');
  
  try {
    const response = await retryApiCall(() => 
      axios.get(`${API_URL}/wallet/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    );
    
    console.log('Wallet Details:');
    console.log(JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error getting wallet details:');
    if (error.response) {
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('No response received. Server might be down.');
    } else {
      console.error('Error setting up request:', error.message);
    }
    return null;
  }
};

// Main function
const main = async () => {
  console.log('=== Robust Testing of Bills Payment API ===');
  
  // Test bills payment history
  await testBillsPaymentHistory();
  
  // Create wallet
  await createTestWallet();
  
  // Get wallet details
  await getWalletDetails();
  
  // Test fund wallet
  await testFundWallet();
  
  // Get updated wallet details
  await getWalletDetails();
  
  // Test bills payment history again
  await testBillsPaymentHistory();
  
  console.log('\n=== Testing Complete ===');
};

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
});
