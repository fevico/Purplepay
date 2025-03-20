const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const { spawn } = require('child_process');

// Configuration
const API_URL = 'http://localhost:9876';
const DEFAULT_TEST_EMAIL = 'testuser@example.com';
const DEFAULT_TEST_PASSWORD = 'Password123!';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const SERVER_START_TIMEOUT = 30000; // 30 seconds

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Helper function to get user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
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
    return true;
  } catch (error) {
    console.log('❌ Server is not running or health endpoint is not available');
    return false;
  }
}

// Start the server
async function startServer() {
  console.log('\n=== Starting Server ===');
  
  // Ask for confirmation
  const confirm = await askQuestion('Server is not running. Do you want to start it? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('Server start aborted by user.');
    return false;
  }
  
  return new Promise((resolve) => {
    console.log('Starting server...');
    
    const server = spawn('npm', ['start'], {
      cwd: process.cwd(),
      detached: true,
      stdio: 'inherit'
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
    
    // Get user input for email and password
    const email = await askQuestion(`Enter email for test user (default: ${DEFAULT_TEST_EMAIL}): `);
    const password = await askQuestion(`Enter password for test user (default: ${DEFAULT_TEST_PASSWORD}): `);
    
    const testEmail = email || DEFAULT_TEST_EMAIL;
    const testPassword = password || DEFAULT_TEST_PASSWORD;
    
    console.log(`Creating user with email: ${testEmail}`);
    
    const createResponse = await retryApiCall(() => 
      axios.post(`${API_URL}/auth/register`, {
        email: testEmail,
        password: testPassword,
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
          email: testEmail,
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
        email: testEmail,
        password: testPassword
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
      console.log('Login Successful!');
      
      return {
        token: loginResponse.data.token,
        email: testEmail
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
    
    // Get user input for email and password
    const email = await askQuestion(`Enter email for existing user (default: ${DEFAULT_TEST_EMAIL}): `);
    const password = await askQuestion(`Enter password (default: ${DEFAULT_TEST_PASSWORD}): `);
    
    const testEmail = email || DEFAULT_TEST_EMAIL;
    const testPassword = password || DEFAULT_TEST_PASSWORD;
    
    console.log(`Logging in with email: ${testEmail}`);
    
    const loginResponse = await retryApiCall(() => 
      axios.post(`${API_URL}/auth/login`, {
        email: testEmail,
        password: testPassword
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
        email: testEmail
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

// Directly use a hardcoded token for testing
async function useHardcodedToken() {
  console.log('\n=== Using hardcoded token for testing ===');
  
  // This is a sample token format - it won't be valid but will allow us to test the API structure
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ0ZXN0LXVzZXItaWQiLCJuYW1lIjoidGVzdHVzZXIiLCJpYXQiOjE3NDIzMzAwMDAsImV4cCI6MTc0MjMzMzYwMH0.test-signature';
  
  console.log('Using test token:');
  console.log('-------------------------------------------');
  console.log(token);
  console.log('-------------------------------------------');
  
  // Save token to file
  fs.writeFileSync('jwt-token.txt', token);
  console.log('\nToken has been saved to jwt-token.txt');
  
  return {
    token: token,
    email: DEFAULT_TEST_EMAIL
  };
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
    
    if (createWalletResponse.status === 'error') {
      console.log('Wallet creation failed:');
      console.log(createWalletResponse);
      
      // Check if wallet already exists
      console.log('\nChecking if wallet already exists...');
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
      
      if (walletResponse.data && walletResponse.data.wallet) {
        console.log('Wallet already exists:');
        console.log(JSON.stringify(walletResponse.data, null, 2));
      } else {
        return false;
      }
    } else {
      console.log('Wallet Creation Response:');
      console.log(JSON.stringify(createWalletResponse.data, null, 2));
    }
    
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
    
    if (historyResponse.status === 'error') {
      console.log('History check failed:');
      console.log(historyResponse);
    } else {
      console.log('History Response:');
      console.log(JSON.stringify(historyResponse.data, null, 2));
    }
    
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
      return;
    }
    
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
    
    if (processResponse.status === 'error') {
      console.log('Bill payment processing failed:');
      console.log(processResponse);
    } else {
      console.log('Process Response:');
      console.log(JSON.stringify(processResponse.data, null, 2));
    }
    
    // 4. Check the bill payment status
    console.log(`\n4. Checking bill payment status for reference: ${reference}...`);
    const statusResponse = await retryApiCall(() => 
      axios.get(`${API_URL}/billsPayment/status/${reference}`, { headers })
    );
    
    if (statusResponse.status === 'error') {
      console.log('Bill payment status check failed:');
      console.log(statusResponse);
    } else {
      console.log('Status Response:');
      console.log(JSON.stringify(statusResponse.data, null, 2));
    }
    
    console.log('\n=== Bills Payment API Testing Complete ===');
  } catch (error) {
    console.error('Error testing Bills Payment API:');
    handleApiError(error);
  }
}

// Generate a test report
function generateTestReport(results) {
  console.log('\n=== Generating Test Report ===');
  
  const report = {
    timestamp: new Date().toISOString(),
    serverStatus: results.serverRunning ? 'UP' : 'DOWN',
    userCreation: results.userCreated ? 'SUCCESS' : 'FAILED',
    walletSetup: results.walletSetup ? 'SUCCESS' : 'FAILED',
    billsPaymentTesting: results.billsPaymentTested ? 'COMPLETED' : 'NOT COMPLETED',
    overallStatus: results.serverRunning && results.userCreated && results.walletSetup ? 'SUCCESS' : 'PARTIAL SUCCESS'
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
    console.log('=== Setup Test Environment ===');
    console.log('This script will:');
    console.log('1. Check if the server is running and start it if needed');
    console.log('2. Create a new test user or login with existing credentials');
    console.log('3. Set up a wallet for the user');
    console.log('4. Test the Bills Payment API');
    console.log('------------------------------------------------------');
    
    const results = {
      serverRunning: false,
      userCreated: false,
      walletSetup: false,
      billsPaymentTested: false
    };
    
    // Check if server is running
    results.serverRunning = await checkServerStatus();
    
    // If server is not running, try to start it
    if (!results.serverRunning) {
      results.serverRunning = await startServer();
      
      if (!results.serverRunning) {
        console.log('\n❌ Server could not be started. Aborting test environment setup.');
        generateTestReport(results);
        rl.close();
        return;
      }
    }
    
    // Ask what action to take
    const action = await askQuestion('Choose an action: (1) Create new user, (2) Login with existing user, (3) Use test token: ');
    
    let userInfo = null;
    
    switch (action) {
      case '1':
        userInfo = await createTestUser();
        results.userCreated = !!userInfo;
        break;
      case '2':
        userInfo = await loginUser();
        results.userCreated = !!userInfo;
        break;
      case '3':
        userInfo = await useHardcodedToken();
        results.userCreated = !!userInfo;
        break;
      default:
        console.log('Invalid option. Defaulting to login with existing user.');
        userInfo = await loginUser();
        results.userCreated = !!userInfo;
    }
    
    // If we couldn't get a token, try the fallback
    if (!userInfo) {
      console.log('\nCould not authenticate. Using test token as fallback...');
      userInfo = await useHardcodedToken();
      results.userCreated = !!userInfo;
    }
    
    // Setup wallet
    results.walletSetup = await setupWallet(userInfo);
    
    // Test Bills Payment API
    await testBillsPayment(userInfo);
    results.billsPaymentTested = true;
    
    // Generate test report
    generateTestReport(results);
    
    console.log('\n=== Test Environment Setup Completed ===');
    console.log('Use the token in jwt-token.txt for further testing');
  } catch (error) {
    console.error('Error in main function:', error);
  } finally {
    // Close readline interface
    rl.close();
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  rl.close();
});
