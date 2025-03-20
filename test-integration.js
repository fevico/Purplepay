/**
 * Test script for Purplepay integration testing
 * 
 * This script tests the integration between:
 * - Wallet transfers
 * - Transaction history
 * - Notifications
 * 
 * Run with: node test-integration.js
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
let authToken = '';
let userId = '';
let walletId = '';
let transferReference = '';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123'
};

// Test recipient
const TEST_RECIPIENT = {
  recipientEmail: 'recipient@example.com',
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

// Helper to log test results
const logTest = (name, success, data = null, error = null) => {
  console.log(`\n----- ${name} -----`);
  if (success) {
    console.log('✅ SUCCESS');
    if (data) console.log('Data:', JSON.stringify(data, null, 2));
  } else {
    console.log('❌ FAILED');
    if (error) {
      console.log('Error:', error.response?.data || error.message);
      console.log('Status:', error.response?.status);
      if (error.response?.config) {
        console.log('Request URL:', error.response.config.url);
        console.log('Request Method:', error.response.config.method);
        console.log('Request Data:', JSON.stringify(error.response.config.data, null, 2));
      }
    }
  }
};

// Login and get auth token
const login = async () => {
  try {
    const response = await api.post('/auth/login', TEST_USER);
    setAuthToken(response.data.token);
    logTest('Login', true, { token: authToken.substring(0, 15) + '...' });
    return true;
  } catch (error) {
    logTest('Login', false, null, error);
    return false;
  }
};

// Get wallet details
const getWalletDetails = async () => {
  try {
    const response = await api.get('/wallet/details');
    walletId = response.data.wallet.id;
    logTest('Get Wallet Details', true, response.data);
    return true;
  } catch (error) {
    logTest('Get Wallet Details', false, null, error);
    return false;
  }
};

// Test integration between wallet transfers and transactions
const testWalletTransferTransactionIntegration = async () => {
  console.log('\n=== Testing Wallet Transfer and Transaction Integration ===');
  
  // Initiate a transfer
  try {
    const transferResponse = await api.post('/wallet/transfer', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 1000,
      description: 'Integration test transfer'
    });
    
    transferReference = transferResponse.data.reference;
    const verificationCode = transferResponse.data.verificationCode;
    
    logTest('Initiate Transfer', true, { 
      reference: transferReference, 
      verificationCode 
    });
    
    // Verify the transfer
    try {
      const verifyResponse = await api.post('/wallet/verify-transfer', {
        reference: transferReference,
        verificationCode
      });
      
      logTest('Verify Transfer', true, verifyResponse.data);
      
      // Check transaction history for the transfer
      setTimeout(async () => {
        try {
          const transactionResponse = await api.get('/transactions');
          
          // Find the transaction with our reference
          const transaction = transactionResponse.data.transactions.find(
            t => t.reference === transferReference
          );
          
          if (transaction) {
            logTest('Transaction Created', true, transaction);
          } else {
            logTest('Transaction Created', false, { 
              message: 'Transaction not found in history',
              reference: transferReference
            });
          }
        } catch (error) {
          logTest('Check Transaction History', false, null, error);
        }
      }, 1000); // Wait a second for the transaction to be recorded
    } catch (error) {
      logTest('Verify Transfer', false, null, error);
    }
  } catch (error) {
    logTest('Initiate Transfer', false, null, error);
  }
};

// Test integration between wallet transfers and notifications
const testWalletTransferNotificationIntegration = async () => {
  console.log('\n=== Testing Wallet Transfer and Notification Integration ===');
  
  // Get initial notification count
  let initialCount = 0;
  try {
    const notificationsResponse = await api.get('/notifications');
    initialCount = notificationsResponse.data.notifications.length;
    logTest('Get Initial Notifications', true, { count: initialCount });
  } catch (error) {
    logTest('Get Initial Notifications', false, null, error);
    return;
  }
  
  // Initiate a transfer
  try {
    const transferResponse = await api.post('/wallet/transfer', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 1000,
      description: 'Notification test transfer'
    });
    
    const reference = transferResponse.data.reference;
    const verificationCode = transferResponse.data.verificationCode;
    
    logTest('Initiate Transfer', true, { reference, verificationCode });
    
    // Verify the transfer
    try {
      const verifyResponse = await api.post('/wallet/verify-transfer', {
        reference,
        verificationCode
      });
      
      logTest('Verify Transfer', true, verifyResponse.data);
      
      // Check for new notifications
      setTimeout(async () => {
        try {
          const updatedNotificationsResponse = await api.get('/notifications');
          const newCount = updatedNotificationsResponse.data.notifications.length;
          
          if (newCount > initialCount) {
            // Find transfer-related notifications
            const transferNotifications = updatedNotificationsResponse.data.notifications.filter(
              n => n.title?.includes('Transfer') || n.message?.includes('transfer')
            );
            
            logTest('Transfer Notification', true, { 
              initialCount, 
              newCount, 
              difference: newCount - initialCount,
              transferNotifications: transferNotifications.slice(0, 2) // Show just the first couple
            });
          } else {
            logTest('Transfer Notification', false, { 
              message: 'No new notifications created', 
              initialCount, 
              newCount 
            });
          }
        } catch (error) {
          logTest('Check Notifications', false, null, error);
        }
      }, 1000); // Wait a second for the notification to be created
    } catch (error) {
      logTest('Verify Transfer', false, null, error);
    }
  } catch (error) {
    logTest('Initiate Transfer', false, null, error);
  }
};

// Test transaction summary functionality
const testTransactionSummary = async () => {
  console.log('\n=== Testing Transaction Summary ===');
  
  try {
    // Get summary for all time
    const allTimeResponse = await api.get('/transactions/summary?period=all');
    logTest('All Time Transaction Summary', true, allTimeResponse.data);
    
    // Get summary for today
    const todayResponse = await api.get('/transactions/summary?period=today');
    logTest('Today Transaction Summary', true, todayResponse.data);
    
    // Get summary for specific transaction type
    const transferResponse = await api.get('/transactions/summary?period=all&type=transfer');
    logTest('Transfer Transaction Summary', true, transferResponse.data);
  } catch (error) {
    logTest('Transaction Summary', false, null, error);
  }
};

// Test transaction filtering
const testTransactionFiltering = async () => {
  console.log('\n=== Testing Transaction Filtering ===');
  
  try {
    // Filter by transaction type
    const typeResponse = await api.get('/transactions?type=transfer');
    logTest('Filter by Type', true, {
      count: typeResponse.data.transactions.length,
      sample: typeResponse.data.transactions.slice(0, 2) // Show just the first couple
    });
    
    // Filter by status
    const statusResponse = await api.get('/transactions?status=completed');
    logTest('Filter by Status', true, {
      count: statusResponse.data.transactions.length,
      sample: statusResponse.data.transactions.slice(0, 2) // Show just the first couple
    });
    
    // Filter by date range
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const dateRangeResponse = await api.get(`/transactions?startDate=${oneMonthAgo.toISOString()}`);
    logTest('Filter by Date Range', true, {
      count: dateRangeResponse.data.transactions.length,
      sample: dateRangeResponse.data.transactions.slice(0, 2) // Show just the first couple
    });
  } catch (error) {
    logTest('Transaction Filtering', false, null, error);
  }
};

// Test transaction details
const testTransactionDetails = async () => {
  console.log('\n=== Testing Transaction Details ===');
  
  if (!transferReference) {
    logTest('Transaction Details', false, { 
      message: 'No transfer reference available from previous tests' 
    });
    return;
  }
  
  try {
    const detailsResponse = await api.get(`/transactions/${transferReference}`);
    logTest('Transaction Details', true, detailsResponse.data);
  } catch (error) {
    logTest('Transaction Details', false, null, error);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting Purplepay Integration Tests');
  
  if (await login() && await getWalletDetails()) {
    await testWalletTransferTransactionIntegration();
    await testWalletTransferNotificationIntegration();
    await testTransactionSummary();
    await testTransactionFiltering();
    await testTransactionDetails();
  }
  
  console.log('\n✨ Integration Tests completed');
};

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
});
