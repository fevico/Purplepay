/**
 * Comprehensive test suite for Purplepay wallet functionality
 * 
 * This script tests all aspects of the wallet functionality:
 * - Favorite recipients
 * - Scheduled transfers
 * - Notifications
 * - Security settings
 * - Wallet transfers
 * - Transaction history
 * 
 * Run with: node wallet-test-suite.js [test-group]
 * 
 * Available test groups:
 * - all: Run all tests (default)
 * - favorites: Test favorite recipients functionality
 * - scheduled: Test scheduled transfers functionality
 * - notifications: Test notification system
 * - security: Test security features
 * - transfers: Test wallet transfers
 * - transactions: Test transaction history
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
let authToken = '';
let userId = '';
let walletId = '';
let transferReference = '';
let verificationCode = '';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123'
};

// Test recipient
const TEST_RECIPIENT = {
  recipientEmail: 'recipient@example.com',
  nickname: 'Test Recipient'
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
    console.log('Attempting to login...');
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
    console.log('Getting wallet details...');
    const response = await api.get('/wallet/details');
    walletId = response.data.wallet._id;
    logTest('Get Wallet Details', true, response.data);
    return response.data.wallet;
  } catch (error) {
    logTest('Get Wallet Details', false, null, error);
    return null;
  }
};

// Test favorite recipients functionality
const testFavoriteRecipients = async () => {
  console.log('\n=== Testing Favorite Recipients Functionality ===');
  let favoriteId = null;
  
  // Add favorite recipient
  try {
    const response = await api.post('/wallet/favorite-recipients', TEST_RECIPIENT);
    favoriteId = response.data.favoriteRecipient?.id;
    logTest('Add Favorite Recipient', true, response.data);
  } catch (error) {
    logTest('Add Favorite Recipient', false, null, error);
    return;
  }
  
  // Get favorite recipients
  try {
    const response = await api.get('/wallet/favorite-recipients');
    logTest('Get Favorite Recipients', true, response.data);
  } catch (error) {
    logTest('Get Favorite Recipients', false, null, error);
  }
  
  // Update favorite recipient
  if (favoriteId) {
    try {
      const response = await api.put(`/wallet/favorite-recipients/${favoriteId}`, {
        nickname: 'Updated Nickname'
      });
      logTest('Update Favorite Recipient', true, response.data);
    } catch (error) {
      logTest('Update Favorite Recipient', false, null, error);
    }
  }
  
  // Delete favorite recipient
  if (favoriteId) {
    try {
      const response = await api.delete(`/wallet/favorite-recipients/${favoriteId}`);
      logTest('Delete Favorite Recipient', true, response.data);
    } catch (error) {
      logTest('Delete Favorite Recipient', false, null, error);
    }
  }
  
  // Test edge cases
  console.log('\n--- Testing Favorite Recipients Edge Cases ---');
  
  // Invalid email format
  try {
    const response = await api.post('/wallet/favorite-recipients', {
      recipientEmail: 'invalid-email',
      nickname: 'Invalid Email Test'
    });
    logTest('Invalid Email Format', false, response.data);
  } catch (error) {
    logTest('Invalid Email Format', true, null, error);
  }
  
  // Duplicate recipient
  try {
    // First add a recipient
    const firstResponse = await api.post('/wallet/favorite-recipients', TEST_RECIPIENT);
    const newFavoriteId = firstResponse.data.favoriteRecipient?.id;
    
    // Try to add the same recipient again
    try {
      const duplicateResponse = await api.post('/wallet/favorite-recipients', TEST_RECIPIENT);
      logTest('Duplicate Recipient', false, duplicateResponse.data);
    } catch (error) {
      logTest('Duplicate Recipient', true, null, error);
    }
    
    // Clean up
    if (newFavoriteId) {
      await api.delete(`/wallet/favorite-recipients/${newFavoriteId}`);
    }
  } catch (error) {
    logTest('Duplicate Recipient Setup', false, null, error);
  }
};

// Test scheduled transfers functionality
const testScheduledTransfers = async () => {
  console.log('\n=== Testing Scheduled Transfers Functionality ===');
  let scheduledId = null;
  
  // Create a future date for the scheduled transfer
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  
  // Create scheduled transfer
  try {
    const response = await api.post('/wallet/scheduled-transfers', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 1000,
      description: 'Scheduled transfer test',
      frequency: 'one-time',
      nextExecutionDate: futureDate.toISOString(),
      testMode: true // Enable test mode if supported
    });
    
    scheduledId = response.data.scheduledTransfer?.id;
    logTest('Create Scheduled Transfer', true, response.data);
  } catch (error) {
    logTest('Create Scheduled Transfer', false, null, error);
    return;
  }
  
  // Get scheduled transfers
  try {
    const response = await api.get('/wallet/scheduled-transfers');
    logTest('Get Scheduled Transfers', true, response.data);
  } catch (error) {
    logTest('Get Scheduled Transfers', false, null, error);
  }
  
  // Update scheduled transfer
  if (scheduledId) {
    try {
      const updatedDate = new Date();
      updatedDate.setDate(updatedDate.getDate() + 2);
      
      const response = await api.put(`/wallet/scheduled-transfers/${scheduledId}`, {
        description: 'Updated scheduled transfer',
        nextExecutionDate: updatedDate.toISOString()
      });
      
      logTest('Update Scheduled Transfer', true, response.data);
    } catch (error) {
      logTest('Update Scheduled Transfer', false, null, error);
    }
  }
  
  // Delete scheduled transfer
  if (scheduledId) {
    try {
      const response = await api.delete(`/wallet/scheduled-transfers/${scheduledId}`);
      logTest('Delete Scheduled Transfer', true, response.data);
    } catch (error) {
      logTest('Delete Scheduled Transfer', false, null, error);
    }
  }
  
  // Test edge cases
  console.log('\n--- Testing Scheduled Transfers Edge Cases ---');
  
  // Past execution date
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  
  try {
    const response = await api.post('/wallet/scheduled-transfers', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 1000,
      description: 'Past date test',
      frequency: 'one-time',
      nextExecutionDate: pastDate.toISOString()
    });
    
    logTest('Past Execution Date', false, response.data);
  } catch (error) {
    logTest('Past Execution Date', true, null, error);
  }
  
  // Invalid frequency
  try {
    const response = await api.post('/wallet/scheduled-transfers', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 1000,
      description: 'Invalid frequency test',
      frequency: 'invalid-frequency',
      nextExecutionDate: futureDate.toISOString()
    });
    
    logTest('Invalid Frequency', false, response.data);
  } catch (error) {
    logTest('Invalid Frequency', true, null, error);
  }
};

// Test notification system
const testNotifications = async () => {
  console.log('\n=== Testing Notification System ===');
  
  // Get notifications
  try {
    const response = await api.get('/notifications');
    logTest('Get Notifications', true, response.data);
    
    // If we have notifications, test marking as read and deleting
    if (response.data.notifications && response.data.notifications.length > 0) {
      const notification = response.data.notifications[0];
      
      // Mark as read
      try {
        const markResponse = await api.put(`/notifications/${notification.id}/read`);
        logTest('Mark Notification Read', true, markResponse.data);
      } catch (error) {
        logTest('Mark Notification Read', false, null, error);
      }
      
      // Delete notification
      try {
        const deleteResponse = await api.delete(`/notifications/${notification.id}`);
        logTest('Delete Notification', true, deleteResponse.data);
      } catch (error) {
        logTest('Delete Notification', false, null, error);
      }
    }
  } catch (error) {
    logTest('Get Notifications', false, null, error);
  }
  
  // Generate a notification by updating security settings
  try {
    const securityResponse = await api.get('/security/settings');
    const currentSettings = securityResponse.data.securitySettings;
    
    // Toggle a setting to generate a notification
    const updateResponse = await api.put('/security/settings', {
      ...currentSettings,
      enableEmailNotifications: !currentSettings.enableEmailNotifications
    });
    
    logTest('Update Security Settings', true, updateResponse.data);
    
    // Wait a moment for the notification to be created
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for new notifications
    const newNotificationsResponse = await api.get('/notifications');
    logTest('New Notifications', true, newNotificationsResponse.data);
  } catch (error) {
    logTest('Generate Notification', false, null, error);
  }
};

// Test security features
const testSecurityFeatures = async () => {
  console.log('\n=== Testing Security Features ===');
  
  // Get security settings
  try {
    const response = await api.get('/security/settings');
    logTest('Get Security Settings', true, response.data);
    
    // Update security settings
    try {
      const currentSettings = response.data.securitySettings;
      
      const updateResponse = await api.put('/security/settings', {
        ...currentSettings,
        highValueTransferThreshold: 200000,
        requireAdditionalAuthForHighValue: true
      });
      
      logTest('Update Security Settings', true, updateResponse.data);
    } catch (error) {
      logTest('Update Security Settings', false, null, error);
    }
  } catch (error) {
    logTest('Get Security Settings', false, null, error);
  }
  
  // Test high-value transfer threshold
  console.log('\n--- Testing High-Value Transfer Threshold ---');
  
  try {
    const securityResponse = await api.get('/security/settings');
    const threshold = securityResponse.data.securitySettings.highValueTransferThreshold;
    
    if (threshold > 0) {
      // Test transfer just below threshold
      const belowThresholdAmount = threshold - 100;
      
      try {
        const response = await api.post('/wallet/transfer', {
          recipientEmail: TEST_RECIPIENT.recipientEmail,
          amount: belowThresholdAmount,
          description: 'Below threshold test',
          testMode: true
        });
        
        logTest('Transfer Below Threshold', true, response.data);
      } catch (error) {
        logTest('Transfer Below Threshold', false, null, error);
      }
      
      // Test transfer just above threshold
      const aboveThresholdAmount = threshold + 100;
      
      try {
        const response = await api.post('/wallet/transfer', {
          recipientEmail: TEST_RECIPIENT.recipientEmail,
          amount: aboveThresholdAmount,
          description: 'Above threshold test',
          testMode: true
        });
        
        logTest('Transfer Above Threshold', true, response.data);
      } catch (error) {
        // This might fail if additional authentication is required
        // which is actually the expected behavior
        if (error.response?.data?.message?.includes('authentication')) {
          logTest('Transfer Above Threshold', true, { 
            message: 'Additional authentication required as expected',
            error: error.response.data
          });
        } else {
          logTest('Transfer Above Threshold', false, null, error);
        }
      }
    } else {
      logTest('High-Value Threshold', false, { 
        message: 'Threshold is zero or not set' 
      });
    }
  } catch (error) {
    logTest('High-Value Threshold Test', false, null, error);
  }
};

// Test wallet transfers
const testWalletTransfers = async () => {
  console.log('\n=== Testing Wallet Transfers ===');
  
  // Initiate a transfer
  try {
    const response = await api.post('/wallet/transfer', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 1000,
      description: 'Test transfer',
      testMode: true
    });
    
    transferReference = response.data.reference;
    verificationCode = response.data.verificationCode;
    
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
      
      // Check transfer status
      try {
        const statusResponse = await api.get(`/wallet/transfer-status/${transferReference}`);
        logTest('Transfer Status', true, statusResponse.data);
      } catch (error) {
        logTest('Transfer Status', false, null, error);
      }
    } catch (error) {
      logTest('Verify Transfer', false, null, error);
    }
  } catch (error) {
    logTest('Initiate Transfer', false, null, error);
  }
  
  // Test edge cases
  console.log('\n--- Testing Transfer Edge Cases ---');
  
  // Negative amount
  try {
    const response = await api.post('/wallet/transfer', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: -100,
      description: 'Negative amount test'
    });
    
    logTest('Negative Transfer Amount', false, response.data);
  } catch (error) {
    logTest('Negative Transfer Amount', true, null, error);
  }
  
  // Zero amount
  try {
    const response = await api.post('/wallet/transfer', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 0,
      description: 'Zero amount test'
    });
    
    logTest('Zero Transfer Amount', false, response.data);
  } catch (error) {
    logTest('Zero Transfer Amount', true, null, error);
  }
  
  // Below minimum amount
  try {
    const response = await api.post('/wallet/transfer', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 50, // Assuming minimum is 100
      description: 'Below minimum test'
    });
    
    logTest('Below Minimum Transfer Amount', false, response.data);
  } catch (error) {
    logTest('Below Minimum Transfer Amount', true, null, error);
  }
};

// Test transaction history
const testTransactionHistory = async () => {
  console.log('\n=== Testing Transaction History ===');
  
  // Get transaction history
  try {
    const response = await api.get('/transactions');
    logTest('Get Transaction History', true, {
      count: response.data.transactions?.length || 0,
      sample: response.data.transactions?.slice(0, 2) || []
    });
  } catch (error) {
    logTest('Get Transaction History', false, null, error);
  }
  
  // Get transaction summary
  try {
    const response = await api.get('/transactions/summary');
    logTest('Get Transaction Summary', true, response.data);
  } catch (error) {
    logTest('Get Transaction Summary', false, null, error);
  }
  
  // Get transaction details
  if (transferReference) {
    try {
      const response = await api.get(`/transactions/${transferReference}`);
      logTest('Get Transaction Details', true, response.data);
    } catch (error) {
      logTest('Get Transaction Details', false, null, error);
    }
  }
  
  // Test filtering
  console.log('\n--- Testing Transaction Filtering ---');
  
  // Filter by type
  try {
    const response = await api.get('/transactions?type=transfer');
    logTest('Filter by Type', true, {
      count: response.data.transactions?.length || 0,
      sample: response.data.transactions?.slice(0, 2) || []
    });
  } catch (error) {
    logTest('Filter by Type', false, null, error);
  }
  
  // Filter by status
  try {
    const response = await api.get('/transactions?status=completed');
    logTest('Filter by Status', true, {
      count: response.data.transactions?.length || 0,
      sample: response.data.transactions?.slice(0, 2) || []
    });
  } catch (error) {
    logTest('Filter by Status', false, null, error);
  }
  
  // Filter by date range
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  try {
    const response = await api.get(`/transactions?startDate=${oneMonthAgo.toISOString()}`);
    logTest('Filter by Date Range', true, {
      count: response.data.transactions?.length || 0,
      sample: response.data.transactions?.slice(0, 2) || []
    });
  } catch (error) {
    logTest('Filter by Date Range', false, null, error);
  }
};

// Run tests based on command line argument
const runTests = async () => {
  const testGroup = process.argv[2] || 'all';
  
  console.log(`🚀 Starting Purplepay Wallet Tests - Group: ${testGroup}`);
  
  if (await login() && await getWalletDetails()) {
    if (testGroup === 'all' || testGroup === 'favorites') {
      await testFavoriteRecipients();
    }
    
    if (testGroup === 'all' || testGroup === 'scheduled') {
      await testScheduledTransfers();
    }
    
    if (testGroup === 'all' || testGroup === 'notifications') {
      await testNotifications();
    }
    
    if (testGroup === 'all' || testGroup === 'security') {
      await testSecurityFeatures();
    }
    
    if (testGroup === 'all' || testGroup === 'transfers') {
      await testWalletTransfers();
    }
    
    if (testGroup === 'all' || testGroup === 'transactions') {
      await testTransactionHistory();
    }
  }
  
  console.log(`\n✨ Wallet Tests Completed - Group: ${testGroup}`);
};

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
});
