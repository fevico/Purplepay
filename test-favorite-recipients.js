/**
 * Test script for Purplepay favorite recipients functionality
 * 
 * Run with: node test-favorite-recipients.js
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
let authToken = '';
let userId = '';
let favoriteRecipientId = '';

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

// Register a test recipient
const registerTestRecipient = async () => {
  try {
    const response = await api.post('/auth/create', {
      email: TEST_RECIPIENT.recipientEmail,
      password: 'Password123'
    });
    const recipientId = response.data.id;
    const verificationToken = response.data.token;
    logTest('Register Test Recipient', true, { recipientId, email: TEST_RECIPIENT.recipientEmail });
    
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

// Test favorite recipients
const testFavoriteRecipients = async () => {
  try {
    // Debug: Test the test endpoint
    console.log('\n----- Testing Test Endpoint -----');
    try {
      const testResponse = await api.post('/wallet/test-endpoint', TEST_RECIPIENT);
      console.log('Test Endpoint - Success:', testResponse.data);
    } catch (error) {
      console.log('Test Endpoint - Error:', error.response?.status, error.response?.data);
      console.log('Request headers:', error.response?.config?.headers);
      console.log('Request data:', error.response?.config?.data);
    }
    
    // Debug: Print all available wallet routes
    console.log('\n----- Checking Available Routes -----');
    try {
      const routesResponse = await api.get('/wallet');
      console.log('Routes response:', routesResponse.data);
    } catch (error) {
      console.log('Routes error:', error.response?.status, error.response?.data);
    }
    
    // Debug: Try with different URL formats
    console.log('\n----- Trying Different URL Formats -----');
    
    try {
      const response1 = await api.post('/wallet/favorite-recipients', TEST_RECIPIENT);
      console.log('Format 1 (/wallet/favorite-recipients) - Success:', response1.data);
    } catch (error) {
      console.log('Format 1 (/wallet/favorite-recipients) - Error:', error.response?.status, error.response?.data);
      console.log('Request headers:', error.response?.config?.headers);
      console.log('Request data:', error.response?.config?.data);
    }
    
    // Debug: Try with a direct Axios request instead of using the api instance
    console.log('\n----- Trying Direct Axios Request -----');
    try {
      const directResponse = await axios({
        method: 'post',
        url: `${API_URL}/wallet/favorite-recipients`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        data: TEST_RECIPIENT
      });
      console.log('Direct Axios - Success:', directResponse.data);
    } catch (error) {
      console.log('Direct Axios - Error:', error.response?.status, error.response?.data);
      console.log('Request headers:', error.response?.config?.headers);
      console.log('Request data:', error.response?.config?.data);
    }
    
    // Debug: Try with a different content type
    console.log('\n----- Trying Different Content Type -----');
    try {
      const formResponse = await axios({
        method: 'post',
        url: `${API_URL}/wallet/favorite-recipients`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${authToken}`
        },
        data: new URLSearchParams(TEST_RECIPIENT).toString()
      });
      console.log('Form Content Type - Success:', formResponse.data);
    } catch (error) {
      console.log('Form Content Type - Error:', error.response?.status, error.response?.data);
      console.log('Request headers:', error.response?.config?.headers);
      console.log('Request data:', error.response?.config?.data);
    }
    
    // Get favorite recipients
    try {
      const getResponse = await api.get('/wallet/favorite-recipients');
      logTest('Get Favorite Recipients', true, getResponse.data);
    } catch (error) {
      logTest('Get Favorite Recipients', false, null, error);
    }

    return true;
  } catch (error) {
    logTest('Favorite Recipients Test', false, null, error);
    return false;
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting Purplepay Favorite Recipients Tests');
  
  // First register the test recipient
  await registerTestRecipient();
  
  if (await login()) {
    await testFavoriteRecipients();
  }
  
  console.log('\n✨ Tests completed');
};

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
});
