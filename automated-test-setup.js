const axios = require('axios');
const fs = require('fs');
const { spawn, exec } = require('child_process');

// Configuration
const API_URL = 'http://localhost:9876';
const TEST_EMAIL = 'testuser@example.com';
const TEST_PASSWORD = 'Password123!';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const SERVER_START_TIMEOUT = 30000; // 30 seconds

// Helper function to handle API errors
function handleApiError(error) {
  if (error.response) {
    console.error('API Error Response:', {
      status: error.response.status,
      data: error.response.data
    });
    return {
      status: 'error',
      code: error.response.status,
      message: error.response.data?.message || 'API error',
      data: error.response.data
    };
  } else if (error.request) {
    console.error('No response received:', error.request._currentUrl || error.request);
    console.error('Error code:', error.code);
    return {
      status: 'error',
      code: error.code || 'NETWORK_ERROR',
      message: `No response received: ${error.code}`,
      request: error.request._currentUrl || error.request
    };
  } else {
    console.error('Error setting up request:', error.message);
    return {
      status: 'error',
      message: `Error setting up request: ${error.message}`
    };
  }
}

// Helper function for retrying API calls
async function retryApiCall(apiCall, retries = MAX_RETRIES) {
  try {
    return await apiCall();
  } catch (error) {
    if (retries <= 0) {
      return handleApiError(error);
    }
    
    console.log(`Request failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    
    return retryApiCall(apiCall, retries - 1);
  }
}

// Check if server is running
async function checkServerStatus() {
  console.log('\n=== Checking Server Status ===');
  
  try {
    const response = await retryApiCall(() => 
      axios.get(`${API_URL}/health`, { timeout: 5000 })
    );
    
    if (response.status === 'error') {
      console.log('❌ Server health check failed:');
      console.log(response);
      return false;
    }
    
    console.log('✅ Server is running!');
    console.log('Health check response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Server is not running or health endpoint is not available');
    return false;
  }
}

// Start the mock server
async function startMockServer() {
  console.log('\n=== Starting Mock Server ===');
  
  return new Promise((resolve) => {
    console.log('Starting server...');
    
    const server = spawn('node', ['mock-server.js'], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'pipe'
    });
    
    server.stdout.on('data', (data) => {
      console.log(`Server output: ${data}`);
    });
    
    server.stderr.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });
    
    console.log(`Server process started with PID: ${server.pid}`);
    
    // Wait for server to start
    let elapsed = 0;
    const interval = 2000; // Check every 2 seconds
    
    const serverCheckInterval = setInterval(async () => {
      elapsed += interval;
      
      const isRunning = await checkServerStatus();
      
      if (isRunning) {
        clearInterval(serverCheckInterval);
        console.log('Server is now running!');
        resolve(true);
      } else if (elapsed >= SERVER_START_TIMEOUT) {
        clearInterval(serverCheckInterval);
        console.log('Server failed to start within the timeout period.');
        resolve(false);
      } else {
        console.log(`Waiting for server to start... (${elapsed / 1000}s)`);
      }
    }, interval);
    
    // Unref the child process so it doesn't keep the parent alive
    server.unref();
  });
}

// Create a new test user
async function createTestUser() {
  try {
    console.log('\n=== Creating Test User ===');
    console.log(`Creating user with email: ${TEST_EMAIL}`);
    
    const createResponse = await retryApiCall(() => 
      axios.post(`${API_URL}/auth/register`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: 'Test User'
      })
    );
    
    if (createResponse.status === 'error') {
      console.log('User creation failed:');
      console.log(createResponse);
      return null;
    }
    
    console.log('\n=== User Creation Response ===');
    console.log(JSON.stringify(createResponse.data, null, 2));
    
    // Verify the user if needed
    if (createResponse.data.token) {
      console.log('\n=== Verifying User ===');
      const verificationResponse = await retryApiCall(() => 
        axios.post(`${API_URL}/auth/verify`, {
          email: TEST_EMAIL,
          token: createResponse.data.token
        })
      );
      
      if (verificationResponse.status === 'error') {
        console.log('User verification failed:');
        console.log(verificationResponse);
      } else {
        console.log('Verification Response:');
        console.log(JSON.stringify(verificationResponse.data, null, 2));
      }
    }
    
    // Login with the new user
    const loginResponse = await retryApiCall(() => 
      axios.post(`${API_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    );
    
    if (loginResponse.status === 'error') {
      console.log('Login failed:');
      console.log(loginResponse);
      return null;
    }
    
    console.log('\n=== Login Response ===');
    console.log(JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.data.token) {
      console.log('\nJWT Token:');
      console.log('-------------------------------------------');
      console.log(loginResponse.data.token);
      console.log('-------------------------------------------');
      
      // Save token to file
      fs.writeFileSync('jwt-token.txt', loginResponse.data.token);
      console.log('\nToken has been saved to jwt-token.txt for easy access');
      
      return {
        token: loginResponse.data.token,
        email: TEST_EMAIL,
        userId: loginResponse.data.user?.id
      };
    } else {
      console.log('Login Failed:');
      console.log(JSON.stringify(loginResponse.data, null, 2));
      return null;
    }
  } catch (error) {
    console.error('Error creating test user:');
    handleApiError(error);
    return null;
  }
}

// Login with existing user
async function loginUser() {
  try {
    console.log('\n=== Logging in with existing user ===');
    console.log(`Logging in with email: ${TEST_EMAIL}`);
    
    const loginResponse = await retryApiCall(() => 
      axios.post(`${API_URL}/auth/login`, {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    );
    
    if (loginResponse.status === 'error') {
      console.log('Login failed:');
      console.log(loginResponse);
      return null;
    }
    
    if (loginResponse.data.token) {
      console.log('Login Successful!');
      console.log('JWT Token:');
      console.log('-------------------------------------------');
      console.log(loginResponse.data.token);
      console.log('-------------------------------------------');
      
      // Save token to file
      fs.writeFileSync('jwt-token.txt', loginResponse.data.token);
      console.log('\nToken has been saved to jwt-token.txt for easy access');
      
      return {
        token: loginResponse.data.token,
        email: TEST_EMAIL,
        userId: loginResponse.data.user?.id
      };
    } else {
      console.log('Login Failed:');
      console.log(JSON.stringify(loginResponse.data, null, 2));
      return null;
    }
  } catch (error) {
    console.log('Login failed, user might not exist or not be verified.');
    handleApiError(error);
    return null;
  }
}

// Setup wallet for the user
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
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
    );
    
    if (createWalletResponse.status === 'error') {
      console.log('Wallet creation failed:');
      console.log(createWalletResponse);
      return false;
    }
    
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
    
    if (walletResponse.status === 'error') {
      console.log('Wallet details check failed:');
      console.log(walletResponse);
      return false;
    }
    
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
    
    if (fundResponse.status === 'error') {
      console.log('Wallet funding failed:');
      console.log(fundResponse);
      return false;
    }
    
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
    
    if (updatedWalletResponse.status === 'error') {
      console.log('Updated wallet details check failed:');
      console.log(updatedWalletResponse);
      return false;
    }
    
    console.log('Updated Wallet Information:');
    console.log(JSON.stringify(updatedWalletResponse.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error setting up wallet:');
    handleApiError(error);
    return false;
  }
}

// Test the Bills Payment API
async function testBillsPayment(userInfo) {
  if (!userInfo || !userInfo.token) {
    console.log('No valid token available, cannot test Bills Payment API');
    return false;
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
    
    if (historyResponse.status === 'error') {
      console.log('Bill payment history check failed:');
      console.log(historyResponse);
      return false;
    }
    
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
    
    if (initiateResponse.status === 'error') {
      console.log('Bill payment initiation failed:');
      console.log(initiateResponse);
      return false;
    }
    
    console.log('Initiate Response:');
    console.log(JSON.stringify(initiateResponse.data, null, 2));
    
    if (!initiateResponse.data.reference) {
      console.log('No reference returned, cannot continue with processing');
      return false;
    }
    
    const reference = initiateResponse.data.reference;
    
    // 3. Process the bill payment
    console.log(`\n3. Processing bill payment with reference: ${reference}...`);
    const processResponse = await retryApiCall(() => 
      axios.post(`${API_URL}/billsPayment/process/${reference}`, {}, { headers })
    );
    
    if (processResponse.status === 'error') {
      console.log('Bill payment processing failed:');
      console.log(processResponse);
      return false;
    }
    
    console.log('Process Response:');
    console.log(JSON.stringify(processResponse.data, null, 2));
    
    // 4. Check the bill payment status
    console.log(`\n4. Checking bill payment status for reference: ${reference}...`);
    const statusResponse = await retryApiCall(() => 
      axios.get(`${API_URL}/billsPayment/status/${reference}`, { headers })
    );
    
    if (statusResponse.status === 'error') {
      console.log('Bill payment status check failed:');
      console.log(statusResponse);
      return false;
    }
    
    console.log('Status Response:');
    console.log(JSON.stringify(statusResponse.data, null, 2));
    
    console.log('\n=== Bills Payment API Testing Complete ===');
    return true;
  } catch (error) {
    console.error('Error testing Bills Payment API:');
    handleApiError(error);
    return false;
  }
}

// Generate a test report
function generateTestReport(results) {
  console.log('\n=== Generating Test Report ===');
  
  const report = {
    timestamp: new Date().toISOString(),
    serverStatus: results.serverStarted ? 'RUNNING' : 'NOT_RUNNING',
    userCreation: results.userCreated ? 'SUCCESS' : 'FAILED',
    walletSetup: results.walletSetup ? 'SUCCESS' : 'FAILED',
    billsPaymentTest: results.billsPaymentTested ? 'SUCCESS' : 'FAILED',
    overallStatus: (results.serverStarted && results.userCreated && results.walletSetup && results.billsPaymentTested) ? 'SUCCESS' : 'PARTIAL_SUCCESS'
  };
  
  console.log(JSON.stringify(report, null, 2));
  
  // Save report to file
  fs.writeFileSync('test-environment-report.json', JSON.stringify(report, null, 2));
  console.log('\nTest report saved to test-environment-report.json');
  
  return report;
}

// Main function
async function main() {
  try {
    console.log('=== Automated Test Environment Setup ===');
    console.log('This script will:');
    console.log('1. Start the mock server if not running');
    console.log('2. Create a test user or login with existing credentials');
    console.log('3. Set up a wallet for the user');
    console.log('4. Test the Bills Payment API');
    console.log('------------------------------------------------------');
    
    const results = {
      serverStarted: false,
      userCreated: false,
      walletSetup: false,
      billsPaymentTested: false
    };
    
    // Check if server is running
    let serverRunning = await checkServerStatus();
    
    // Start server if not running
    if (!serverRunning) {
      results.serverStarted = await startMockServer();
      if (!results.serverStarted) {
        console.log('Failed to start the server. Aborting test setup.');
        generateTestReport(results);
        return;
      }
    } else {
      results.serverStarted = true;
    }
    
    // Try to login first
    let userInfo = await loginUser();
    
    // If login fails, create a new user
    if (!userInfo) {
      console.log('Login failed, creating a new user...');
      userInfo = await createTestUser();
    }
    
    results.userCreated = !!userInfo;
    
    if (!results.userCreated) {
      console.log('Failed to create or login user. Aborting test setup.');
      generateTestReport(results);
      return;
    }
    
    // Setup wallet
    results.walletSetup = await setupWallet(userInfo);
    
    if (!results.walletSetup) {
      console.log('Failed to set up wallet. Continuing with bills payment test...');
    }
    
    // Test Bills Payment API
    results.billsPaymentTested = await testBillsPayment(userInfo);
    
    // Generate test report
    const report = generateTestReport(results);
    
    if (report.overallStatus === 'SUCCESS') {
      console.log('\n✅ Test environment setup completed successfully!');
      console.log('You can now run your tests against the mock server.');
    } else {
      console.log('\n⚠️ Test environment setup completed with some issues.');
      console.log('Please check the test report for details.');
    }
    
    console.log('\n=== Setup Completed ===');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
});
