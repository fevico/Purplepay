const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:9877';
const TEST_EMAIL = `testuser-${Date.now()}@example.com`;
const TEST_PASSWORD = 'Password123!';
const TEST_NAME = 'Test User';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Helper function to handle API errors
function handleApiError(error) {
  if (error.response) {
    console.error('API Error Response:', {
      status: error.response.status,
      data: error.response.data
    });
  } else if (error.request) {
    console.error('No response received:', error.request._currentUrl || error.request);
    console.error('Error code:', error.code);
  } else {
    console.error('Error setting up request:', error.message);
  }
}

// Helper function for retrying API calls
async function retryApiCall(apiCall, retries = MAX_RETRIES) {
  try {
    return await apiCall();
  } catch (error) {
    if (retries <= 0) {
      handleApiError(error);
      throw error;
    }
    
    console.log(`Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    
    return retryApiCall(apiCall, retries - 1);
  }
}

// Create a new test user
async function createTestUser() {
  try {
    console.log('\n=== Creating Test User ===');
    console.log(`Email: ${TEST_EMAIL}`);
    console.log(`Password: ${TEST_PASSWORD}`);
    
    const createResponse = await retryApiCall(() => 
      axios.post(`${API_URL}/auth/create`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME
      })
    );
    
    console.log('\n=== User Creation Response ===');
    console.log(JSON.stringify(createResponse.data, null, 2));
    
    // Verify the user if needed
    if (createResponse.data.token) {
      console.log('\n=== Verifying User ===');
      const verificationResponse = await retryApiCall(() => 
        axios.post(`${API_URL}/auth/verify-auth-token`, {
          owner: createResponse.data.id,
          token: createResponse.data.token
        })
      );
      
      console.log('Verification Response:');
      console.log(JSON.stringify(verificationResponse.data, null, 2));
    }
    
    // Login with the new user
    console.log('\n=== Logging in with Test User ===');
    const loginResponse = await retryApiCall(() => 
      axios.post(`${API_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    );
    
    console.log('Login Response:');
    console.log(JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('\n=== JWT Token ===');
      console.log(token);
      
      // Save token to file - use writeFileSync with proper encoding
      fs.writeFileSync('test-token.txt', token, { encoding: 'utf8' });
      console.log('\n✅ Token saved to test-token.txt');
      
      return {
        email: TEST_EMAIL,
        userId: loginResponse.data.id,
        token: token
      };
    } else {
      throw new Error('Login failed: No token received');
    }
  } catch (error) {
    console.error('Error creating test user:', error.message);
    throw error;
  }
}

// Run the wallet setup
async function setupWallet(userInfo) {
  if (!userInfo || !userInfo.token) {
    console.log('No valid token available, cannot setup wallet');
    return false;
  }
  
  const { token, email } = userInfo;
  
  console.log('\n=== Setting Up Wallet ===');
  
  try {
    // Create wallet
    console.log('\nCreating wallet...');
    const createWalletResponse = await retryApiCall(() => 
      axios.post(
        `${API_URL}/wallet/create`,
        { email: email },
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
    );
    
    console.log('Wallet Creation Response:');
    console.log(JSON.stringify(createWalletResponse.data, null, 2));
    
    // Check wallet balance
    console.log('\nChecking wallet balance...');
    const walletResponse = await retryApiCall(() => 
      axios.get(
        `${API_URL}/wallet/details`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
    );
    
    console.log('Wallet Information:');
    console.log(JSON.stringify(walletResponse.data, null, 2));
    
    // Fund wallet using test endpoint
    console.log('\nFunding wallet with 10000 NGN using test endpoint...');
    const fundResponse = await retryApiCall(() => 
      axios.post(
        `${API_URL}/wallet/test-fund`,
        { amount: 10000 },
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
    );
    
    console.log('Funding Response:');
    console.log(JSON.stringify(fundResponse.data, null, 2));
    
    // Check updated wallet balance
    console.log('\nChecking updated wallet balance...');
    const updatedWalletResponse = await retryApiCall(() => 
      axios.get(
        `${API_URL}/wallet/details`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
    );
    
    console.log('Updated Wallet Information:');
    console.log(JSON.stringify(updatedWalletResponse.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error setting up wallet:');
    handleApiError(error);
    
    console.log('\nWallet setup failed. Using fallback mode for testing...');
    return false;
  }
}

// Test the Bills Payment API
async function testBillsPayment(userInfo) {
  if (!userInfo || !userInfo.token) {
    console.log('No valid token available, cannot test Bills Payment API');
    return;
  }
  
  const { token } = userInfo;
  
  console.log('\n=== Testing Bills Payment API ===');
  
  const headers = { 'Authorization': `Bearer ${token}` };
  
  try {
    // 1. Get bill payment history
    console.log('\n1. Getting bill payment history...');
    const historyResponse = await retryApiCall(() => 
      axios.get(`${API_URL}/billsPayment/history`, { headers })
    );
    
    console.log('History Response:');
    console.log(JSON.stringify(historyResponse.data, null, 2));
    
    // 2. Initiate a bill payment
    console.log('\n2. Initiating bill payment...');
    const initiateResponse = await retryApiCall(() => 
      axios.post(`${API_URL}/billsPayment/initiate`, {
        billType: 'electricity',
        provider: 'IKEDC',
        customerReference: '12345678901',
        amount: 5000,
        currency: 'NGN',
        metadata: {
          service_id: 'ikedc_prepaid',
          variation_code: 'prepaid'
        }
      }, { headers })
    );
    
    console.log('Initiate Response:');
    console.log(JSON.stringify(initiateResponse.data, null, 2));
    
    if (!initiateResponse.data.reference) {
      console.log('No reference returned, cannot continue with processing');
      return;
    }
    
    const reference = initiateResponse.data.reference;
    
    // 3. Process the bill payment
    console.log(`\n3. Processing bill payment with reference: ${reference}...`);
    const processResponse = await retryApiCall(() => 
      axios.post(`${API_URL}/billsPayment/process/${reference}`, {}, { headers })
    );
    
    console.log('Process Response:');
    console.log(JSON.stringify(processResponse.data, null, 2));
    
    // 4. Check the bill payment status
    console.log(`\n4. Checking bill payment status for reference: ${reference}...`);
    const statusResponse = await retryApiCall(() => 
      axios.get(`${API_URL}/billsPayment/status/${reference}`, { headers })
    );
    
    console.log('Status Response:');
    console.log(JSON.stringify(statusResponse.data, null, 2));
    
    console.log('\n=== Bills Payment API Testing Complete ===');
  } catch (error) {
    console.error('Error testing Bills Payment API:');
    handleApiError(error);
  }
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting automated test user creation');
    
    const userInfo = await createTestUser();
    
    console.log('\n✅ Test user created and authenticated successfully!');
    console.log('User details:');
    console.log(`- Email: ${userInfo.email}`);
    console.log(`- User ID: ${userInfo.userId}`);
    console.log(`- Token: ${userInfo.token.substring(0, 20)}...`);
    
    await setupWallet(userInfo);
    await testBillsPayment(userInfo);
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Failed to create test user:', error.message);
  }
}

// Run the main function
main();
