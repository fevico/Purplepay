const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:9876';
const TIMEOUT = 5000; // 5 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// Helper function to handle API errors
function handleApiError(error) {
  if (error.response) {
    return {
      status: 'error',
      code: error.response.status,
      message: error.response.data?.message || 'API error',
      data: error.response.data
    };
  } else if (error.request) {
    return {
      status: 'error',
      code: error.code || 'NETWORK_ERROR',
      message: `No response received: ${error.code}`,
      request: error.request._currentUrl || error.request
    };
  } else {
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
    const result = await retryApiCall(() => 
      axios.get(`${API_URL}/health`, { timeout: TIMEOUT })
    );
    
    if (result.status === 'error') {
      console.log('❌ Server health check failed:');
      console.log(result);
      return false;
    }
    
    console.log('✅ Server is running!');
    console.log('Health check response:', result.data);
    return true;
  } catch (error) {
    console.log('❌ Server is not running or health endpoint is not available');
    console.log(handleApiError(error));
    return false;
  }
}

// Check authentication endpoints
async function checkAuthEndpoints() {
  console.log('\n=== Checking Auth Endpoints ===');
  
  const endpoints = [
    { method: 'get', url: `${API_URL}/auth/status`, name: 'Auth Status' },
    { method: 'options', url: `${API_URL}/auth/login`, name: 'Auth Login' },
    { method: 'options', url: `${API_URL}/auth/register`, name: 'Auth Register' }
  ];
  
  let allEndpointsAvailable = true;
  
  for (const endpoint of endpoints) {
    try {
      const result = await retryApiCall(() => 
        axios[endpoint.method](endpoint.url, { timeout: TIMEOUT })
      );
      
      if (result.status === 'error') {
        console.log(`❌ ${endpoint.name} endpoint check failed:`);
        console.log(result);
        allEndpointsAvailable = false;
      } else {
        console.log(`✅ ${endpoint.name} endpoint is available`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} endpoint is not available`);
      console.log(handleApiError(error));
      allEndpointsAvailable = false;
    }
  }
  
  return allEndpointsAvailable;
}

// Check wallet endpoints
async function checkWalletEndpoints() {
  console.log('\n=== Checking Wallet Endpoints ===');
  
  const endpoints = [
    { method: 'options', url: `${API_URL}/wallet/create`, name: 'Wallet Create' },
    { method: 'options', url: `${API_URL}/wallet/details`, name: 'Wallet Details' },
    { method: 'options', url: `${API_URL}/wallet/test-fund`, name: 'Wallet Test Fund' }
  ];
  
  let allEndpointsAvailable = true;
  
  for (const endpoint of endpoints) {
    try {
      const result = await retryApiCall(() => 
        axios[endpoint.method](endpoint.url, { timeout: TIMEOUT })
      );
      
      if (result.status === 'error') {
        console.log(`❌ ${endpoint.name} endpoint check failed:`);
        console.log(result);
        allEndpointsAvailable = false;
      } else {
        console.log(`✅ ${endpoint.name} endpoint is available`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} endpoint is not available`);
      console.log(handleApiError(error));
      allEndpointsAvailable = false;
    }
  }
  
  return allEndpointsAvailable;
}

// Check bills payment endpoints
async function checkBillsPaymentEndpoints() {
  console.log('\n=== Checking Bills Payment Endpoints ===');
  
  const endpoints = [
    { method: 'options', url: `${API_URL}/billsPayment/initiate`, name: 'Bills Payment Initiate' },
    { method: 'options', url: `${API_URL}/billsPayment/history`, name: 'Bills Payment History' }
  ];
  
  let allEndpointsAvailable = true;
  
  for (const endpoint of endpoints) {
    try {
      const result = await retryApiCall(() => 
        axios[endpoint.method](endpoint.url, { timeout: TIMEOUT })
      );
      
      if (result.status === 'error') {
        console.log(`❌ ${endpoint.name} endpoint check failed:`);
        console.log(result);
        allEndpointsAvailable = false;
      } else {
        console.log(`✅ ${endpoint.name} endpoint is available`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} endpoint is not available`);
      console.log(handleApiError(error));
      allEndpointsAvailable = false;
    }
  }
  
  return allEndpointsAvailable;
}

// Check MongoDB connection
async function checkMongoDBConnection() {
  console.log('\n=== Checking MongoDB Connection ===');
  
  try {
    const result = await retryApiCall(() => 
      axios.get(`${API_URL}/health/db`, { timeout: TIMEOUT })
    );
    
    if (result.status === 'error') {
      console.log('❌ MongoDB connection check failed:');
      console.log(result);
      return false;
    }
    
    console.log('✅ MongoDB connection is working!');
    console.log('DB health check response:', result.data);
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection check failed or endpoint not available');
    console.log(handleApiError(error));
    return false;
  }
}

// Generate a health report
async function generateHealthReport() {
  console.log('\n=== Generating Server Health Report ===');
  
  const serverStatus = await checkServerStatus();
  const authEndpoints = await checkAuthEndpoints();
  const walletEndpoints = await checkWalletEndpoints();
  const billsPaymentEndpoints = await checkBillsPaymentEndpoints();
  const mongoDBConnection = await checkMongoDBConnection();
  
  const report = {
    timestamp: new Date().toISOString(),
    serverStatus: serverStatus ? 'UP' : 'DOWN',
    authEndpoints: authEndpoints ? 'AVAILABLE' : 'UNAVAILABLE',
    walletEndpoints: walletEndpoints ? 'AVAILABLE' : 'UNAVAILABLE',
    billsPaymentEndpoints: billsPaymentEndpoints ? 'AVAILABLE' : 'UNAVAILABLE',
    mongoDBConnection: mongoDBConnection ? 'CONNECTED' : 'DISCONNECTED',
    overallStatus: serverStatus && authEndpoints && walletEndpoints && billsPaymentEndpoints && mongoDBConnection ? 'HEALTHY' : 'UNHEALTHY'
  };
  
  console.log('\n=== Server Health Report ===');
  console.log(JSON.stringify(report, null, 2));
  
  // Save report to file
  fs.writeFileSync('server-health-report.json', JSON.stringify(report, null, 2));
  console.log('\nHealth report saved to server-health-report.json');
  
  return report;
}

// Main function
async function main() {
  try {
    console.log('=== Server Health Check ===');
    console.log('This script will check the health of the server and its endpoints');
    console.log('------------------------------------------------------');
    
    const report = await generateHealthReport();
    
    if (report.overallStatus === 'HEALTHY') {
      console.log('\n✅ Server is healthy and ready for testing!');
      console.log('You can now run auto-create-test-user.js to create a test user and wallet');
    } else {
      console.log('\n❌ Server is not healthy!');
      console.log('Please check the server logs and ensure it is running correctly');
      console.log('Common issues:');
      console.log('1. Server is not running - start the server with "npm start"');
      console.log('2. MongoDB is not connected - check MONGODB_URI in .env file');
      console.log('3. Required environment variables are missing - check .env file');
    }
    
    console.log('\n=== Health Check Completed ===');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
});
