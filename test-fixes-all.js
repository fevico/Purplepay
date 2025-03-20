const axios = require('axios');
const readline = require('readline');

// Configuration
const API_URL = 'http://localhost:9876'; // Update with your API URL
let authToken = '';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt for input
const prompt = (question) => new Promise((resolve) => rl.question(question, resolve));

// Helper function for API calls
const apiCall = async (method, endpoint, data = null, auth = true) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (auth && authToken) {
      headers.Authorization = `Bearer ${authToken}`; // Corrected the Authorization header
    }
    
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers,
      data: data ? data : undefined
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API Error (${method.toUpperCase()} ${endpoint}):`, 
      error.response ? error.response.data : error.message);
    return null;
  }
};

// Register a test user
const registerUser = async () => {
  const userData = {
    email: `test${Date.now()}@example.com`,
    password: 'Password123!'
  };
  
  console.log('Registering test user...');
  const result = await apiCall('post', '/auth/create', userData, false);
  
  if (result && result.token) {
    authToken = result.token;
    console.log('✅ User registered successfully!');
    console.log('Email:', userData.email);
    return userData;
  } else {
    console.error('❌ Failed to register user');
    return null;
  }
};

// Test wallet funding
const testWalletFunding = async () => {
  console.log('\n💰 Testing wallet funding...');
  
  // Test wallet funding
  console.log('Funding wallet with 50,000 NGN...');
  const fundingResult = await apiCall('post', '/wallet/test-fund', { amount: 50000 });
  
  if (fundingResult && fundingResult.message === 'Wallet funded successfully') {
    console.log('✅ Wallet funded successfully!');
    console.log('New balance:', fundingResult.newBalance);
    console.log('Reference:', fundingResult.reference);
    return fundingResult;
  } else {
    console.error('❌ Failed to fund wallet');
    return null;
  }
};

// Test transaction filtering
const testTransactionFiltering = async () => {
  console.log('\n🔍 Testing transaction filtering...');
  
  // Test with no filters
  console.log('Getting all transactions...');
  const allTransactions = await apiCall('get', '/transactions');
  
  if (allTransactions && allTransactions.transactions) {
    console.log(`✅ Found ${allTransactions.transactions.length} transactions`);
    
    // Test with type filter
    console.log('Getting funding transactions...');
    const fundingTransactions = await apiCall('get', '/transactions?type=funding');
    
    if (fundingTransactions && fundingTransactions.transactions) {
      console.log(`✅ Found ${fundingTransactions.transactions.length} funding transactions`);
      
      // Test transaction details
      if (fundingTransactions.transactions.length > 0) {
        const reference = fundingTransactions.transactions[0].reference;
        console.log(`Getting details for transaction ${reference}...`);
        
        const transactionDetails = await apiCall('get', `/transactions/${reference}`);
        
        if (transactionDetails && transactionDetails.transaction) {
          console.log('✅ Transaction details retrieved successfully!');
          return true;
        } else {
          console.error('❌ Failed to get transaction details');
        }
      }
    } else {
      console.error('❌ Failed to get funding transactions');
    }
  } else {
    console.error('❌ Failed to get transactions');
  }
  
  return false;
};

// Test wallet transfer
const testWalletTransfer = async (recipientEmail) => {
  console.log('\n💸 Testing wallet transfer...');
  
  // Initiate transfer
  console.log('Initiating transfer of 1,000 NGN...');
  const transferResult = await apiCall('post', '/wallet/transfer', {
    recipientEmail,
    amount: 1000,
    description: 'Test transfer'
  });
  
  if (transferResult && transferResult.reference) {
    console.log('✅ Transfer initiated successfully!');
    console.log('Reference:', transferResult.reference);
    console.log('Verification code:', transferResult.verificationCode);
    
    // Verify transfer
    console.log('Verifying transfer...');
    const verifyResult = await apiCall('post', '/wallet/verify-transfer', {
      reference: transferResult.reference,
      verificationCode: transferResult.verificationCode
    });
    
    if (verifyResult && verifyResult.message === 'Transfer completed successfully') {
      console.log('✅ Transfer verified successfully!');
      console.log('New balance:', verifyResult.balance);
      return true;
    } else {
      console.error('❌ Failed to verify transfer');
    }
  } else {
    console.error('❌ Failed to initiate transfer');
  }
  
  return false;
};

// Test notifications
const testNotifications = async () => {
  console.log('\n🔔 Testing notifications...');
  
  // Get notifications
  console.log('Getting notifications...');
  const notifications = await apiCall('get', '/notifications');
  
  if (notifications && notifications.notifications) {
    console.log(`✅ Found ${notifications.notifications.length} notifications`);
    
    if (notifications.notifications.length > 0) {
      // Mark notification as read
      const notificationId = notifications.notifications[0]._id;
      console.log(`Marking notification ${notificationId} as read...`);
      
      const markResult = await apiCall('put', `/notifications/${notificationId}/read`);
      
      if (markResult && markResult.message === 'Notification marked as read') {
        console.log('✅ Notification marked as read successfully!');
        return true;
      } else {
        console.error('❌ Failed to mark notification as read');
      }
    }
  } else {
    console.error('❌ Failed to get notifications');
  }
  
  return false;
};

// Main function
const main = async () => {
  try {
    // Register a test user
    const user = await registerUser();
    if (!user) {
      console.log('\nSkipping tests due to registration failure.');
      rl.close();
      return;
    }
    
    // Register a second user for transfers
    console.log('\nRegistering a second user for transfers...');
    const secondUser = await registerUser();
    
    // Fund the wallet
    const fundingResult = await testWalletFunding();
    if (!fundingResult) {
      console.log('\nSkipping remaining tests due to funding failure.');
      rl.close();
      return;
    }
    
    // Test transaction filtering
    const filteringResult = await testTransactionFiltering();
    
    // Test wallet transfer if second user was registered
    let transferResult = false;
    if (secondUser) {
      transferResult = await testWalletTransfer(secondUser.email);
    }
    
    // Test notifications
    const notificationsResult = await testNotifications();
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log('User Registration:', user ? '✅ Passed' : '❌ Failed');
    console.log('Wallet Funding:', fundingResult ? '✅ Passed' : '❌ Failed');
    console.log('Transaction Filtering:', filteringResult ? '✅ Passed' : '❌ Failed');
    
    if (secondUser) {
      console.log('Wallet Transfer:', transferResult ? '✅ Passed' : '❌ Failed');
    }
    
    console.log('Notifications:', notificationsResult ? '✅ Passed' : '❌ Failed');
    
    const allPassed = user && fundingResult && filteringResult && 
                     (!secondUser || transferResult) && notificationsResult;
    
    if (allPassed) {
      console.log('\n✅ All tests passed successfully!');
    } else {
      console.log('\n❌ Some tests failed');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    rl.close();
  }
};

// Run the main function
main();
