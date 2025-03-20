/**
 * Simple script to check if the server is responding
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';

async function checkServer() {
  console.log('Checking server status...');
  
  try {
    // Try to hit a basic endpoint
    const response = await axios.get(`${API_URL}/health`);
    console.log('Server response:', response.status, response.data);
    return true;
  } catch (error) {
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      console.log('Server responded with error:', error.response.status, error.response.data);
      return true; // Server is running but returned an error
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received. Server might be down or unreachable.');
      return false;
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
      return false;
    }
  }
}

// Try to hit some other endpoints to see what's working
async function checkEndpoints() {
  const endpoints = [
    '/health',
    '/api',
    '/auth/login',
    '/wallet',
    '/billsPayment/history'
  ];
  
  console.log('\nTesting various endpoints:');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting ${endpoint}...`);
      const response = await axios.get(`${API_URL}${endpoint}`);
      console.log('Response:', response.status, response.data);
    } catch (error) {
      if (error.response) {
        console.log('Error response:', error.response.status, error.response.data);
      } else if (error.request) {
        console.log('No response received');
      } else {
        console.log('Error:', error.message);
      }
    }
  }
}

async function main() {
  const isServerRunning = await checkServer();
  
  if (isServerRunning) {
    console.log('\nServer is running! Testing additional endpoints...');
    await checkEndpoints();
  } else {
    console.log('\nServer appears to be down. Please check if it is running on port 9876.');
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
});
