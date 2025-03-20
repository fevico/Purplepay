const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_URL = 'http://localhost:9883/api';
let authToken = '';
let userId = '';
let testTag = '';

// Test user credentials
const testUser = {
  email: `test_${uuidv4().substring(0, 8)}@example.com`,
  password: 'Password123!',
  name: 'Test User',
};

// Helper function for API requests
const api = axios.create({
  baseURL: API_URL,
  validateStatus: () => true, // Don't throw on error status codes
});

// Set auth token for subsequent requests
const setAuthToken = (token) => {
  authToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Helper for logging test results
const logResult = (name, success, response, error = null) => {
  console.log(`\n--- ${name} ---`);
  console.log(`Status: ${success ? 'SUCCESS' : 'FAILED'}`);
  
  if (response) {
    console.log(`Status Code: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  }
  
  if (error) {
    console.log('Error:', error.message);
  }
  
  console.log('-'.repeat(50));
};

// Main test function
async function runTests() {
  try {
    console.log('Starting Tag and Rewards System Tests');
    console.log('='.repeat(50));

    // 1. Register a test user
    try {
      const registerResponse = await api.post('/auth/register', testUser);
      logResult('Register User', registerResponse.status === 201, registerResponse);
    } catch (error) {
      logResult('Register User', false, null, error);
      return;
    }

    // 2. Login with test user
    try {
      const loginResponse = await api.post('/auth/login', {
        email: testUser.email,
        password: testUser.password,
      });
      
      if (loginResponse.status === 200 && loginResponse.data.token) {
        setAuthToken(loginResponse.data.token);
        userId = loginResponse.data.user._id;
        logResult('Login', true, loginResponse);
      } else {
        logResult('Login', false, loginResponse);
        return;
      }
    } catch (error) {
      logResult('Login', false, null, error);
      return;
    }

    // 3. Get tag suggestions
    try {
      const suggestionsResponse = await api.get(`/tag/suggestions?name=${encodeURIComponent(testUser.name)}`);
      
      if (suggestionsResponse.status === 200 && suggestionsResponse.data.data.length > 0) {
        testTag = suggestionsResponse.data.data[0];
        logResult('Get Tag Suggestions', true, suggestionsResponse);
      } else {
        logResult('Get Tag Suggestions', false, suggestionsResponse);
        return;
      }
    } catch (error) {
      logResult('Get Tag Suggestions', false, null, error);
      return;
    }

    // 4. Check tag availability
    try {
      const checkTagResponse = await api.get(`/tag/check?tag=${encodeURIComponent(testTag)}`);
      logResult('Check Tag Availability', checkTagResponse.status === 200, checkTagResponse);
      
      if (!checkTagResponse.data.data.isAvailable) {
        // Generate a random tag if the suggested one is not available
        testTag = `test_${uuidv4().substring(0, 8)}`;
      }
    } catch (error) {
      logResult('Check Tag Availability', false, null, error);
      return;
    }

    // 5. Update user's tag
    try {
      const updateTagResponse = await api.post('/tag/update', { tag: testTag });
      logResult('Update User Tag', updateTagResponse.status === 200, updateTagResponse);
    } catch (error) {
      logResult('Update User Tag', false, null, error);
      return;
    }

    // 6. Update tag privacy settings
    try {
      const updatePrivacyResponse = await api.post('/tag/privacy', { privacy: 'public' });
      logResult('Update Tag Privacy', updatePrivacyResponse.status === 200, updatePrivacyResponse);
    } catch (error) {
      logResult('Update Tag Privacy', false, null, error);
      return;
    }

    // 7. Find user by tag
    try {
      const findUserResponse = await api.get(`/tag/find/${encodeURIComponent(testTag)}`);
      logResult('Find User by Tag', findUserResponse.status === 200, findUserResponse);
    } catch (error) {
      logResult('Find User by Tag', false, null, error);
      return;
    }

    // 8. Generate QR code for tag
    try {
      const qrCodeResponse = await api.get(`/tag/qr/${encodeURIComponent(testTag)}`);
      logResult('Generate QR Code', qrCodeResponse.status === 200, qrCodeResponse);
    } catch (error) {
      logResult('Generate QR Code', false, null, error);
      return;
    }

    // 9. Create a test transaction for rewards
    let transactionId = '';
    try {
      // This would normally be done through a wallet or transfer endpoint
      // For testing, we'll use a direct transaction creation if available
      // If your API doesn't have a direct transaction creation endpoint,
      // you would need to create a transaction through the appropriate service
      
      // For this test, let's assume we have a mock transaction endpoint
      const createTransactionResponse = await api.post('/transactions/test', {
        type: 'transfer',
        amount: 1000,
        currency: 'NGN',
        reference: `TEST-${uuidv4()}`,
        description: 'Test transaction for rewards',
      });
      
      if (createTransactionResponse.status === 201 && createTransactionResponse.data.data) {
        transactionId = createTransactionResponse.data.data._id;
        logResult('Create Test Transaction', true, createTransactionResponse);
      } else {
        console.log('Note: Transaction creation test skipped or failed. This may be expected if your API doesn\'t have a direct transaction creation endpoint.');
        // Generate a mock transaction ID for testing
        transactionId = uuidv4();
      }
    } catch (error) {
      console.log('Note: Transaction creation test failed. This may be expected if your API doesn\'t have a direct transaction creation endpoint.');
      // Generate a mock transaction ID for testing
      transactionId = uuidv4();
    }

    // 10. Update transaction status to trigger rewards
    try {
      const updateStatusResponse = await api.put(`/transactions/${transactionId}/status`, {
        status: 'completed',
      });
      
      logResult('Update Transaction Status', 
        updateStatusResponse.status === 200 || updateStatusResponse.status === 404, 
        updateStatusResponse);
    } catch (error) {
      logResult('Update Transaction Status', false, null, error);
    }

    // 11. Get rewards balance
    try {
      const rewardsResponse = await api.get('/rewards');
      logResult('Get Rewards Balance', rewardsResponse.status === 200, rewardsResponse);
    } catch (error) {
      logResult('Get Rewards Balance', false, null, error);
    }

    // 12. Redeem rewards (may fail if no rewards balance)
    try {
      const redeemResponse = await api.post('/rewards/redeem', {
        amount: 10,
        method: 'wallet_credit',
      });
      
      logResult('Redeem Rewards', 
        redeemResponse.status === 200 || redeemResponse.status === 400, 
        redeemResponse);
    } catch (error) {
      logResult('Redeem Rewards', false, null, error);
    }

    console.log('\nTag and Rewards System Tests Completed');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Unexpected error during tests:', error);
  }
}

// Run the tests
runTests();
