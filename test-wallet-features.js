/**
 * Test script for Purplepay wallet features
 * 
 * This script tests the following features:
 * 1. Favorite Recipients
 * 2. Scheduled Transfers
 * 3. Notifications
 * 4. Security Settings
 * 
 * Run with: node test-wallet-features.js
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
let authToken = '';
let userId = '';
let favoriteRecipientId = '';
let scheduledTransferId = '';
let notificationId = '';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'Password123'
};

// Test recipient
const TEST_RECIPIENT = {
  email: 'recipient@example.com',
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
      console.log('Headers:', JSON.stringify(error.response?.headers, null, 2));
      if (error.response?.config) {
        console.log('Request URL:', error.response.config.url);
        console.log('Request Method:', error.response.config.method);
        console.log('Request Headers:', JSON.stringify(error.response.config.headers, null, 2));
        console.log('Request Data:', JSON.stringify(error.response.config.data, null, 2));
      }
    }
  }
};

// Register a new user
const registerTestUser = async () => {
  try {
    const response = await api.post('/auth/create', TEST_USER);
    userId = response.data.id;
    const verificationToken = response.data.token;
    logTest('Register User', true, { userId, email: TEST_USER.email });
    
    // Verify the user
    const verifyResponse = await api.post('/auth/verify-auth-token', {
      owner: userId,
      token: verificationToken
    });
    logTest('Verify User', true, verifyResponse.data);
    
    return true;
  } catch (error) {
    if (error.response?.data?.message === "User already exist!") {
      logTest('Register User', true, { message: "User already exists, proceeding to login" });
      
      // If the user already exists, try to resend OTP and verify
      try {
        const resendResponse = await api.post('/auth/resend-otp', { email: TEST_USER.email });
        logTest('Resend OTP', true, resendResponse.data);
        
        // Verify with the new token
        const verifyResponse = await api.post('/auth/verify-auth-token', {
          owner: resendResponse.data.id,
          token: resendResponse.data.token
        });
        logTest('Verify User', true, verifyResponse.data);
      } catch (resendError) {
        logTest('Resend OTP', false, null, resendError);
        // If resend fails, it might be because the user is already verified
        // We'll continue and see if login works
      }
      
      return true;
    } else {
      logTest('Register User', false, null, error);
      return false;
    }
  }
};

// Register a test recipient
const registerTestRecipient = async () => {
  try {
    const response = await api.post('/auth/create', {
      email: 'recipient@example.com',
      password: 'Password123'
    });
    const recipientId = response.data.id;
    const verificationToken = response.data.token;
    logTest('Register Test Recipient', true, { recipientId, email: 'recipient@example.com' });
    
    // Verify the recipient
    const verifyResponse = await api.post('/auth/verify-auth-token', {
      owner: recipientId,
      token: verificationToken
    });
    logTest('Verify Test Recipient', true, verifyResponse.data);
    
    return true;
  } catch (error) {
    if (error.response?.data?.message === "User already exist!") {
      logTest('Register Test Recipient', true, { message: "Recipient already exists" });
      return true;
    } else {
      logTest('Register Test Recipient', false, null, error);
      return false;
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

// Create a wallet for testing
const createAndFundWallet = async () => {
  try {
    // Create wallet
    const createResponse = await api.post('/wallet/create', {
      email: TEST_USER.email,
      account_name: 'Test User',
      phone: '1234567890'
    });
    logTest('Create Wallet', true, createResponse.data);
    
    // For testing purposes, let's fund the wallet
    const fundResponse = await api.post('/wallet/fund', {
      amount: 10000, // 10,000 NGN
      reference: `TEST_FUND_${Date.now()}`
    });
    logTest('Fund Wallet', true, fundResponse.data);
    
    return true;
  } catch (error) {
    // If wallet already exists, consider it a success
    if (error.response?.data?.message?.includes("Wallet already exists")) {
      logTest('Create Wallet', true, { message: "Wallet already exists" });
      return true;
    } else {
      logTest('Create Wallet', false, null, error);
      return false;
    }
  }
};

// Test favorite recipients
const testFavoriteRecipients = async () => {
  try {
    // Add favorite recipient
    const addResponse = await api.post('/wallet/favorite-recipients', {
      recipientEmail: 'recipient@example.com',
      nickname: 'Test Recipient'
    });
    const favoriteRecipientId = addResponse.data.favoriteRecipient?.id;
    logTest('Add Favorite Recipient', true, addResponse.data);

    // Get favorite recipients
    const getResponse = await api.get('/wallet/favorite-recipients');
    logTest('Get Favorite Recipients', true, getResponse.data);

    if (favoriteRecipientId) {
      // Update favorite recipient
      const updateResponse = await api.put(`/wallet/favorite-recipients/${favoriteRecipientId}`, {
        nickname: 'Updated Recipient'
      });
      logTest('Update Favorite Recipient', true, updateResponse.data);

      // Delete favorite recipient
      const deleteResponse = await api.delete(`/wallet/favorite-recipients/${favoriteRecipientId}`);
      logTest('Delete Favorite Recipient', true, deleteResponse.data);
    }

    return true;
  } catch (error) {
    logTest('Favorite Recipients Test', false, null, error);
    return false;
  }
};

// Test scheduled transfers
const testScheduledTransfers = async () => {
  try {
    // Create scheduled transfer
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    
    const createResponse = await api.post('/wallet/scheduled-transfers', {
      recipientEmail: TEST_RECIPIENT.email,
      amount: 1000,
      frequency: 'monthly',
      startDate: tomorrow.toISOString(),
      endDate: endDate.toISOString()
    });
    scheduledTransferId = createResponse.data.scheduledTransfer.id;
    logTest('Create Scheduled Transfer', true, createResponse.data);

    // Get scheduled transfers
    const getResponse = await api.get('/wallet/scheduled-transfers');
    logTest('Get Scheduled Transfers', true, getResponse.data);

    // Update scheduled transfer
    const updateResponse = await api.put(`/wallet/scheduled-transfers/${scheduledTransferId}`, {
      amount: 1500,
      status: 'paused'
    });
    logTest('Update Scheduled Transfer', true, updateResponse.data);

    return true;
  } catch (error) {
    logTest('Scheduled Transfers Test', false, null, error);
    return false;
  }
};

// Test notifications
const testNotifications = async () => {
  try {
    // Get notifications
    const getResponse = await api.get('/notifications');
    if (getResponse.data.notifications.length > 0) {
      notificationId = getResponse.data.notifications[0].id;
    }
    logTest('Get Notifications', true, getResponse.data);

    if (notificationId) {
      // Mark notification as read
      const markResponse = await api.put(`/notifications/${notificationId}/read`);
      logTest('Mark Notification as Read', true, markResponse.data);
    }

    // Mark all notifications as read
    const markAllResponse = await api.put('/notifications/read-all');
    logTest('Mark All Notifications as Read', true, markAllResponse.data);

    return true;
  } catch (error) {
    logTest('Notifications Test', false, null, error);
    return false;
  }
};

// Test security settings
const testSecuritySettings = async () => {
  try {
    // Get security settings
    const getResponse = await api.get('/security/settings');
    logTest('Get Security Settings', true, getResponse.data);

    // Update security settings
    const updateResponse = await api.put('/security/settings', {
      highValueTransferThreshold: 150000,
      requireAdditionalAuthForHighValue: true,
      enableEmailNotifications: true,
      enableSmsNotifications: false
    });
    logTest('Update Security Settings', true, updateResponse.data);

    // Add trusted device
    const addDeviceResponse = await api.post('/security/trusted-devices', {
      deviceName: 'Test Device'
    });
    const deviceId = addDeviceResponse.data.device.deviceId;
    logTest('Add Trusted Device', true, addDeviceResponse.data);

    // Remove trusted device
    const removeDeviceResponse = await api.delete(`/security/trusted-devices/${deviceId}`);
    logTest('Remove Trusted Device', true, removeDeviceResponse.data);

    return true;
  } catch (error) {
    logTest('Security Settings Test', false, null, error);
    return false;
  }
};

// Cleanup - delete created resources
const cleanup = async () => {
  try {
    // Delete favorite recipient
    if (favoriteRecipientId) {
      const deleteRecipientResponse = await api.delete(`/wallet/favorite-recipients/${favoriteRecipientId}`);
      logTest('Delete Favorite Recipient', true, deleteRecipientResponse.data);
    }

    // Delete scheduled transfer
    if (scheduledTransferId) {
      const deleteTransferResponse = await api.delete(`/wallet/scheduled-transfers/${scheduledTransferId}`);
      logTest('Delete Scheduled Transfer', true, deleteTransferResponse.data);
    }

    // Delete notification
    if (notificationId) {
      const deleteNotificationResponse = await api.delete(`/notifications/${notificationId}`);
      logTest('Delete Notification', true, deleteNotificationResponse.data);
    }

    return true;
  } catch (error) {
    logTest('Cleanup', false, null, error);
    return false;
  }
};

// Run all tests
const runTests = async () => {
  console.log('🚀 Starting Purplepay Wallet Features Tests');
  
  // Register test users
  await registerTestUser();
  await registerTestRecipient();
  
  if (await login()) {
    // Create and fund wallet
    if (await createAndFundWallet()) {
      // Test favorite recipients
      await testFavoriteRecipients();
      
      // Test scheduled transfers
      await testScheduledTransfers();
      
      // Test notifications
      await testNotifications();
      
      // Test security settings
      await testSecuritySettings();
      
      // Cleanup
      await cleanup();
    }
  }
  
  console.log('\n✨ Tests completed');
};

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
});
