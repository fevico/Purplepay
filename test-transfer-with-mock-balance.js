/**
 * Test script for wallet transfers with a mock balance
 * 
 * This script tests wallet transfers by mocking the balance check
 * 
 * Run with: node test-transfer-with-mock-balance.js
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
let authToken = '';
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

// Helper to log results
const logResult = (name, success, data = null, error = null) => {
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
    logResult('Login', true, { token: authToken.substring(0, 15) + '...' });
    return true;
  } catch (error) {
    logResult('Login', false, null, error);
    return false;
  }
};

// Get wallet details
const getWalletDetails = async () => {
  try {
    console.log('Getting wallet details...');
    const response = await api.get('/wallet/details');
    logResult('Get Wallet Details', true, response.data);
    return response.data.wallet;
  } catch (error) {
    logResult('Get Wallet Details', false, null, error);
    return null;
  }
};

// Test transfer with test mode
const testTransferWithTestMode = async () => {
  console.log('\n=== Testing Transfer with Test Mode ===');
  
  try {
    console.log('Initiating transfer with test mode...');
    const response = await api.post('/wallet/transfer', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 1000,
      description: 'Test mode transfer',
      testMode: true // Enable test mode
    });
    
    transferReference = response.data.reference;
    verificationCode = response.data.verificationCode;
    
    logResult('Initiate Transfer', true, { 
      reference: transferReference, 
      verificationCode 
    });
    
    return true;
  } catch (error) {
    logResult('Initiate Transfer', false, null, error);
    return false;
  }
};

// Verify transfer
const verifyTransfer = async () => {
  try {
    console.log('Verifying transfer...');
    const response = await api.post('/wallet/verify-transfer', {
      reference: transferReference,
      verificationCode
    });
    
    logResult('Verify Transfer', true, response.data);
    return true;
  } catch (error) {
    logResult('Verify Transfer', false, null, error);
    return false;
  }
};

// Check transfer status
const checkTransferStatus = async () => {
  try {
    console.log('Checking transfer status...');
    const response = await api.get(`/wallet/transfer-status/${transferReference}`);
    
    logResult('Transfer Status', true, response.data);
    return true;
  } catch (error) {
    logResult('Transfer Status', false, null, error);
    return false;
  }
};

// Test favorite recipient functionality
const testFavoriteRecipient = async () => {
  console.log('\n=== Testing Favorite Recipient Functionality ===');
  
  // Add favorite recipient
  try {
    console.log('Adding favorite recipient...');
    const response = await api.post('/wallet/favorite-recipients', TEST_RECIPIENT);
    
    const favoriteId = response.data.favoriteRecipient?.id;
    logResult('Add Favorite Recipient', true, response.data);
    
    // Get favorite recipients
    try {
      console.log('Getting favorite recipients...');
      const getResponse = await api.get('/wallet/favorite-recipients');
      
      logResult('Get Favorite Recipients', true, getResponse.data);
      
      // Transfer to favorite recipient
      if (getResponse.data.favoriteRecipients && getResponse.data.favoriteRecipients.length > 0) {
        const favorite = getResponse.data.favoriteRecipients[0];
        
        try {
          console.log('Transferring to favorite recipient...');
          const transferResponse = await api.post('/wallet/transfer', {
            recipientEmail: favorite.recipientEmail,
            amount: 1000,
            description: 'Transfer to favorite recipient',
            testMode: true // Enable test mode
          });
          
          transferReference = transferResponse.data.reference;
          verificationCode = transferResponse.data.verificationCode;
          
          logResult('Transfer to Favorite', true, { 
            reference: transferReference, 
            verificationCode 
          });
          
          // Verify the transfer
          await verifyTransfer();
          
          // Check if favorite recipient transfer count increased
          try {
            const updatedGetResponse = await api.get('/wallet/favorite-recipients');
            const updatedFavorite = updatedGetResponse.data.favoriteRecipients.find(
              f => f.id === favorite.id
            );
            
            if (updatedFavorite) {
              logResult('Favorite Transfer Count', true, {
                before: favorite.transferCount || 0,
                after: updatedFavorite.transferCount || 0
              });
            }
          } catch (countError) {
            logResult('Favorite Transfer Count', false, null, countError);
          }
        } catch (transferError) {
          logResult('Transfer to Favorite', false, null, transferError);
        }
      }
      
      // Clean up - delete favorite recipient
      if (favoriteId) {
        try {
          console.log('Deleting favorite recipient...');
          const deleteResponse = await api.delete(`/wallet/favorite-recipients/${favoriteId}`);
          
          logResult('Delete Favorite Recipient', true, deleteResponse.data);
        } catch (deleteError) {
          logResult('Delete Favorite Recipient', false, null, deleteError);
        }
      }
    } catch (getError) {
      logResult('Get Favorite Recipients', false, null, getError);
    }
  } catch (error) {
    logResult('Add Favorite Recipient', false, null, error);
  }
};

// Test scheduled transfer functionality
const testScheduledTransfer = async () => {
  console.log('\n=== Testing Scheduled Transfer Functionality ===');
  
  // Create a future date for the scheduled transfer
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 1);
  
  // Create scheduled transfer
  try {
    console.log('Creating scheduled transfer...');
    const response = await api.post('/wallet/scheduled-transfers', {
      recipientEmail: TEST_RECIPIENT.recipientEmail,
      amount: 1000,
      description: 'Scheduled transfer test',
      frequency: 'one-time',
      nextExecutionDate: futureDate.toISOString(),
      testMode: true // Enable test mode if supported
    });
    
    const scheduledId = response.data.scheduledTransfer?.id;
    logResult('Create Scheduled Transfer', true, response.data);
    
    // Get scheduled transfers
    try {
      console.log('Getting scheduled transfers...');
      const getResponse = await api.get('/wallet/scheduled-transfers');
      
      logResult('Get Scheduled Transfers', true, getResponse.data);
      
      // Clean up - delete scheduled transfer
      if (scheduledId) {
        try {
          console.log('Deleting scheduled transfer...');
          const deleteResponse = await api.delete(`/wallet/scheduled-transfers/${scheduledId}`);
          
          logResult('Delete Scheduled Transfer', true, deleteResponse.data);
        } catch (deleteError) {
          logResult('Delete Scheduled Transfer', false, null, deleteError);
        }
      }
    } catch (getError) {
      logResult('Get Scheduled Transfers', false, null, getError);
    }
  } catch (error) {
    logResult('Create Scheduled Transfer', false, null, error);
  }
};

// Test notifications related to transfers
const testTransferNotifications = async () => {
  console.log('\n=== Testing Transfer Notifications ===');
  
  // Get initial notifications
  try {
    console.log('Getting initial notifications...');
    const initialResponse = await api.get('/notifications');
    const initialCount = initialResponse.data.notifications.length;
    
    logResult('Initial Notifications', true, {
      count: initialCount,
      sample: initialResponse.data.notifications.slice(0, 2) // Show just the first couple
    });
    
    // Make a transfer to generate notifications
    if (await testTransferWithTestMode() && await verifyTransfer()) {
      // Wait a moment for notifications to be created
      console.log('Waiting for notifications to be created...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get updated notifications
      try {
        console.log('Getting updated notifications...');
        const updatedResponse = await api.get('/notifications');
        const updatedCount = updatedResponse.data.notifications.length;
        
        // Find transfer-related notifications
        const transferNotifications = updatedResponse.data.notifications.filter(
          n => n.title?.includes('Transfer') || n.message?.includes('transfer')
        );
        
        logResult('Transfer Notifications', true, {
          initialCount,
          updatedCount,
          difference: updatedCount - initialCount,
          transferNotifications: transferNotifications.slice(0, 2) // Show just the first couple
        });
        
        // Mark a notification as read if available
        if (transferNotifications.length > 0) {
          try {
            console.log('Marking notification as read...');
            const markResponse = await api.put(`/notifications/${transferNotifications[0].id}/read`);
            
            logResult('Mark Notification Read', true, markResponse.data);
          } catch (markError) {
            logResult('Mark Notification Read', false, null, markError);
          }
        }
      } catch (updatedError) {
        logResult('Updated Notifications', false, null, updatedError);
      }
    }
  } catch (error) {
    logResult('Initial Notifications', false, null, error);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting Purplepay Transfer Tests with Test Mode');
  
  if (await login() && await getWalletDetails()) {
    await testTransferWithTestMode();
    await verifyTransfer();
    await checkTransferStatus();
    await testFavoriteRecipient();
    await testScheduledTransfer();
    await testTransferNotifications();
  }
  
  console.log('\n✨ Transfer Tests Completed');
};

// Run the tests
runTests().catch(error => {
  console.error('Script error:', error);
});
