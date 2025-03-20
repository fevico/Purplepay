const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:9876';
const HEALTH_ENDPOINTS = [
  '/',
  '/auth/login',
  '/wallet/details',
  '/billsPayment/history'
];
const TOKEN_FILE = 'jwt-token.txt';

// Get the JWT token from file
const getToken = () => {
  try {
    return fs.readFileSync(TOKEN_FILE, 'utf8').trim();
  } catch (error) {
    console.error('Error reading token file:', error.message);
    return null;
  }
};

// Test an endpoint
const testEndpoint = async (endpoint, useAuth = false) => {
  try {
    const config = {};
    
    if (useAuth) {
      const token = getToken();
      if (!token) {
        return {
          endpoint,
          status: 'ERROR',
          message: 'No authentication token available'
        };
      }
      config.headers = {
        'Authorization': `Bearer ${token}`
      };
    }
    
    const response = await axios.get(`${API_URL}${endpoint}`, config);
    
    return {
      endpoint,
      status: 'OK',
      statusCode: response.status,
      message: 'Endpoint is responding'
    };
  } catch (error) {
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      return {
        endpoint,
        status: 'WARNING',
        statusCode: error.response.status,
        message: error.response.data.message || 'Endpoint responded with an error'
      };
    } else if (error.request) {
      // The request was made but no response was received
      return {
        endpoint,
        status: 'ERROR',
        message: 'No response received from server'
      };
    } else {
      // Something happened in setting up the request
      return {
        endpoint,
        status: 'ERROR',
        message: `Error setting up request: ${error.message}`
      };
    }
  }
};

// Main function
const runHealthCheck = async () => {
  console.log('=== Server Health Check ===');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Server URL: ${API_URL}`);
  console.log('----------------------------');
  
  let allOk = true;
  
  // Test non-authenticated endpoints
  const results = await Promise.all([
    testEndpoint('/'),
    testEndpoint('/auth/login')
  ]);
  
  // Test authenticated endpoints
  const authResults = await Promise.all([
    testEndpoint('/wallet/details', true),
    testEndpoint('/billsPayment/history', true)
  ]);
  
  // Combine results
  const allResults = [...results, ...authResults];
  
  // Display results
  allResults.forEach(result => {
    console.log(`Endpoint: ${result.endpoint}`);
    console.log(`Status: ${result.status}`);
    if (result.statusCode) {
      console.log(`Status Code: ${result.statusCode}`);
    }
    console.log(`Message: ${result.message}`);
    console.log('----------------------------');
    
    if (result.status === 'ERROR') {
      allOk = false;
    }
  });
  
  // Overall status
  console.log(`Overall Status: ${allOk ? 'HEALTHY' : 'UNHEALTHY'}`);
  console.log('===========================');
  
  return allOk;
};

// Run the health check
runHealthCheck().catch(error => {
  console.error('Unhandled error during health check:', error);
  process.exit(1);
});
