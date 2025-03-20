/**
 * Test script for Purplepay edge cases and integration scenarios
 * 
 * Run with: node test-edge-cases.js
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
let authToken = '';
let userId = '';
let walletId = '';

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

// Test edge cases for favorite recipients
const testFavoriteRecipientsEdgeCases = async () => {
  console.log('\n=== Testing Favorite Recipients Edge Cases ===');
  
  // Test with invalid email format
  try {
    const response = await api.post('/wallet/favorite-recipients', {
      recipientEmail: 'invalid-email',
      nickname: 'Invalid Email Test'
    });
    logTest('Invalid Email Format', false, response.data);
  } catch (error) {
    logTest('Invalid Email Format', true, null, error);
  }
  
  // Test with non-existent recipient
  try {
    const response = await api.post('/wallet/favorite-recipients', {
      recipientEmail: 'nonexistent@example.com',
      nickname: 'Non-existent Recipient'
    });
    logTest('Non-existent Recipient', false, response.data);
  } catch (error) {
    logTest('Non-existent Recipient', true, null, error);
  }
  
  // Test with special characters in nickname
  try {
    const response = await api.post('/wallet/favorite-recipients', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      nickname: 'Special Ch@r$%^&*()_+'
    });
    logTest('Special Characters in Nickname', true, response.data);
    
    // Clean up
    if (response.data.favoriteRecipient?.id) {
      await api.delete(`/wallet/favorite-recipients/${response.data.favoriteRecipient.id}`);
    }
  } catch (error) {
    logTest('Special Characters in Nickname', false, null, error);
  }
  
  // Test adding duplicate recipient
  try {
    // First add a recipient
    const firstResponse = await api.post('/wallet/favorite-recipients', TEST_RECIPIENT);
    const favoriteId = firstResponse.data.favoriteRecipient?.id;
    
    // Try to add the same recipient again
    try {
      const duplicateResponse = await api.post('/wallet/favorite-recipients', TEST_RECIPIENT);
      logTest('Duplicate Recipient', false, duplicateResponse.data);
    } catch (error) {
      logTest('Duplicate Recipient', true, null, error);
    }
    
    // Clean up
    if (favoriteId) {
      await api.delete(`/wallet/favorite-recipients/${favoriteId}`);
    }
  } catch (error) {
    logTest('Duplicate Recipient Setup', false, null, error);
  }
};

// Test edge cases for transfers
const testTransferEdgeCases = async () => {
  console.log('\n=== Testing Transfer Edge Cases ===');
  
  // Test transfer with negative amount
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
  
  // Test transfer with zero amount
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
  
  // Test transfer with amount below minimum
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
  
  // Test transfer with very large amount (likely to exceed balance)
  try {
    const response = await api.post('/wallet/transfer', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 10000000,
      description: 'Very large amount test'
    });
    logTest('Very Large Transfer Amount', false, response.data);
  } catch (error) {
    logTest('Very Large Transfer Amount', true, null, error);
  }
};

// Test edge cases for scheduled transfers
const testScheduledTransferEdgeCases = async () => {
  console.log('\n=== Testing Scheduled Transfer Edge Cases ===');
  
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  
  // Test scheduled transfer with past date
  try {
    const response = await api.post('/wallet/scheduled-transfers', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 1000,
      description: 'Past date test',
      frequency: 'one-time',
      nextExecutionDate: pastDate.toISOString(),
      endDate: null
    });
    logTest('Past Execution Date', false, response.data);
  } catch (error) {
    logTest('Past Execution Date', true, null, error);
  }
  
  // Test scheduled transfer with end date before next execution date
  const futureDate1 = new Date();
  futureDate1.setDate(futureDate1.getDate() + 10);
  
  const futureDate2 = new Date();
  futureDate2.setDate(futureDate2.getDate() + 5);
  
  try {
    const response = await api.post('/wallet/scheduled-transfers', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 1000,
      description: 'Invalid date range test',
      frequency: 'weekly',
      nextExecutionDate: futureDate1.toISOString(),
      endDate: futureDate2.toISOString()
    });
    logTest('End Date Before Next Execution Date', false, response.data);
  } catch (error) {
    logTest('End Date Before Next Execution Date', true, null, error);
  }
  
  // Test invalid frequency
  try {
    const response = await api.post('/wallet/scheduled-transfers', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 1000,
      description: 'Invalid frequency test',
      frequency: 'invalid-frequency',
      nextExecutionDate: futureDate1.toISOString(),
      endDate: null
    });
    logTest('Invalid Frequency', false, response.data);
  } catch (error) {
    logTest('Invalid Frequency', true, null, error);
  }
};

// Test integration between wallet and notifications
const testWalletNotificationIntegration = async () => {
  console.log('\n=== Testing Wallet and Notification Integration ===');
  
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
  
  // Perform a security settings update (should create a notification)
  try {
    await api.put('/security/settings', {
      highValueTransferThreshold: 200000,
      requireAdditionalAuthForHighValue: true,
      enableEmailNotifications: true,
      enableSmsNotifications: false
    });
    
    // Check for new notification
    setTimeout(async () => {
      try {
        const updatedNotificationsResponse = await api.get('/notifications');
        const newCount = updatedNotificationsResponse.data.notifications.length;
        
        if (newCount > initialCount) {
          logTest('Security Update Notification', true, { 
            initialCount, 
            newCount, 
            difference: newCount - initialCount 
          });
        } else {
          logTest('Security Update Notification', false, { 
            message: 'No new notifications created', 
            initialCount, 
            newCount 
          });
        }
      } catch (error) {
        logTest('Security Update Notification Check', false, null, error);
      }
    }, 1000); // Wait a second for the notification to be created
  } catch (error) {
    logTest('Security Update', false, null, error);
  }
};

// Test high-value transfer threshold
const testHighValueTransferThreshold = async () => {
  console.log('\n=== Testing High-Value Transfer Threshold ===');
  
  // Get current security settings
  let threshold = 0;
  try {
    const securityResponse = await api.get('/security/settings');
    threshold = securityResponse.data.securitySettings.highValueTransferThreshold;
    logTest('Get Security Settings', true, { threshold });
  } catch (error) {
    logTest('Get Security Settings', false, null, error);
    return;
  }
  
  // Test transfer just below threshold
  if (threshold > 0) {
    const belowThresholdAmount = threshold - 100;
    
    try {
      const response = await api.post('/wallet/transfer', {
        recipientEmail: TEST_RECIPIENT.recipientEmail,
        amount: belowThresholdAmount,
        description: 'Below threshold test'
      });
      logTest('Transfer Below Threshold', true, response.data);
    } catch (error) {
      logTest('Transfer Below Threshold', false, null, error);
    }
  }
  
  // Test transfer just above threshold
  if (threshold > 0) {
    const aboveThresholdAmount = threshold + 100;
    
    try {
      const response = await api.post('/wallet/transfer', {
        recipientEmail: TEST_RECIPIENT.recipientEmail,
        amount: aboveThresholdAmount,
        description: 'Above threshold test'
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
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting Purplepay Edge Case Tests');
  
  if (await login() && await getWalletDetails()) {
    await testFavoriteRecipientsEdgeCases();
    await testTransferEdgeCases();
    await testScheduledTransferEdgeCases();
    await testWalletNotificationIntegration();
    await testHighValueTransferThreshold();
  }
  
  console.log('\n✨ Edge Case Tests completed');
};

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
});
