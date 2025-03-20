const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876'; // Update with your API URL
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // Replace with a valid auth token

// Helper function for API calls
const apiCall = async (method, endpoint, data = null, auth = true) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (auth && AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }
    
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers,
      data: data ? data : undefined
    };
    
    const response = await axios(config);
    console.log(`✅ ${method.toUpperCase()} ${endpoint} - Success`);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${endpoint} - Failed:`, 
      error.response ? error.response.data : error.message);
    return null;
  }
};

// Test wallet funding
const testWalletFunding = async () => {
  console.log('\n💰 Testing wallet funding...');
  
  // Test wallet funding
  console.log('\nFunding wallet with 50,000 NGN...');
  const fundingResult = await apiCall('post', '/wallet/test-fund', { amount: 50000 });
  
  if (fundingResult && fundingResult.message === 'Wallet funded successfully') {
    console.log('Wallet funded successfully!');
    console.log('New balance:', fundingResult.newBalance);
    console.log('Reference:', fundingResult.reference);
    
    // Check wallet balance
    console.log('\nChecking wallet balance...');
    const walletDetails = await apiCall('get', '/wallet');
    
    if (walletDetails) {
      console.log('Wallet balance:', walletDetails.balance);
      
      // Check transaction history for the funding
      console.log('\nChecking transaction history for funding...');
      const transactions = await apiCall('get', '/transactions?type=funding');
      
      if (transactions && transactions.transactions) {
        console.log(`Found ${transactions.transactions.length} funding transactions`);
        
        if (transactions.transactions.length > 0) {
          const latestFunding = transactions.transactions[0];
          console.log('Latest funding transaction:', latestFunding);
          
          // Check notifications
          console.log('\nChecking notifications...');
          const notifications = await apiCall('get', '/notifications');
          
          if (notifications && notifications.notifications) {
            console.log(`Found ${notifications.notifications.length} notifications`);
            return true;
          }
        }
      }
    }
  }
  
  return false;
};

// Main function
const main = async () => {
  try {
    // Test wallet funding
    const fundingResult = await testWalletFunding();
    
    if (fundingResult) {
      console.log('\n✅ All wallet funding tests passed successfully!');
    } else {
      console.log('\n❌ Some wallet funding tests failed');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the main function
main();
