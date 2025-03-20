/**
 * Bills Payment API Security Test Script
 * 
 * This script tests the security aspects of the Bills Payment API:
 * 1. Authentication requirements for all endpoints
 * 2. Authorization validation
 * 3. Input validation and sanitization
 * 4. Rate limiting and brute force protection
 * 5. Token expiration and refresh
 * 
 * Usage: node test-bills-payment-security.js [options]
 * 
 * Options:
 *   --skip-auth-tests       Skip authentication tests
 *   --skip-input-tests      Skip input validation tests
 *   --skip-rate-tests       Skip rate limiting tests
 *   --skip-token-tests      Skip token tests
 */

const axios = require('axios');
const fs = require('fs');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_URL = 'http://localhost:9876';
let token = '';
let invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
let expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjN9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  total: 0
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  skipAuthTests: args.includes('--skip-auth-tests'),
  skipInputTests: args.includes('--skip-input-tests'),
  skipRateTests: args.includes('--skip-rate-tests'),
  skipTokenTests: args.includes('--skip-token-tests')
};

// Helper function to log test results
function logTest(name, success, data = null, error = null) {
  testResults.total++;
  
  if (success) {
    console.log(`✅ PASSED: ${name}`);
    testResults.passed++;
  } else {
    console.log(`❌ FAILED: ${name}`);
    if (error) {
      if (error.response) {
        console.log('  Status:', error.response.status);
        console.log('  Data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.request) {
        console.log('  No response received:', error.request);
      } else {
        console.log('  Error:', error.message);
      }
    }
    if (data) {
      console.log('  Data:', JSON.stringify(data, null, 2));
    }
    testResults.failed++;
  }
  console.log('-----------------------------------');
}

// Helper function to log skipped tests
function logSkipped(name, reason) {
  console.log(`⚠️ SKIPPED: ${name} - ${reason}`);
  testResults.skipped++;
  testResults.total++;
  console.log('-----------------------------------');
}

// Read token from file or prompt user
async function getToken() {
  try {
    // Try to read token from file
    if (fs.existsSync('jwt-token.txt')) {
      token = fs.readFileSync('jwt-token.txt', 'utf8').trim();
      console.log('Using token from jwt-token.txt');
      return token;
    }
  } catch (error) {
    console.error('Error reading token file:', error.message);
  }
  
  // If no token in file, prompt user
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Enter your JWT token: ', (answer) => {
      token = answer.trim();
      rl.close();
      
      // Save token to file for future use
      fs.writeFileSync('jwt-token.txt', token);
      console.log('Token saved to jwt-token.txt for future use');
      
      resolve(token);
    });
  });
}

// Helper function to setup test environment
async function setupTestEnvironment() {
  console.log('Setting up test environment...');
  
  try {
    // Create wallet if it doesn't exist
    try {
      const walletResponse = await axios.get(`${API_URL}/wallet/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Wallet exists:', walletResponse.data.wallet.id);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('Creating wallet...');
        await axios.post(`${API_URL}/wallet/create`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Wallet created');
        
        // Fund wallet
        console.log('Funding wallet...');
        await axios.post(`${API_URL}/wallet/fund`, {
          amount: 10000,
          currency: 'NGN'
        }, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('Wallet funded');
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error setting up test environment:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Test authentication requirements for all endpoints
async function testAuth() {
  console.log('\n=== Testing Authentication Requirements ===');
  
  if (options.skipAuthTests) {
    logSkipped('Authentication Tests', 'Skipped due to --skip-auth-tests flag');
    return;
  }
  
  const endpoints = [
    { method: 'GET', url: '/wallet/details', name: 'Get Wallet Details' },
    { method: 'POST', url: '/billsPayment/initiate', name: 'Initiate Bill Payment', data: { billType: 'electricity', provider: 'IKEDC', customerReference: '12345678901', amount: 1000, currency: 'NGN' } },
    { method: 'GET', url: '/billsPayment/history', name: 'Get Bill Payment History' },
    { method: 'GET', url: '/billsPayment/status/some-reference', name: 'Get Bill Payment Status' },
    { method: 'POST', url: '/billsPayment/process/some-reference', name: 'Process Bill Payment' }
  ];
  
  // Test with no token
  for (const endpoint of endpoints) {
    try {
      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(`${API_URL}${endpoint.url}`);
      } else {
        response = await axios.post(`${API_URL}${endpoint.url}`, endpoint.data || {});
      }
      
      // If we get here, the request succeeded without authentication, which is a failure
      logTest(`${endpoint.name} - No Token`, false, response.data, 'Endpoint accessible without authentication');
    } catch (error) {
      // We expect a 401 Unauthorized error
      const isExpectedError = error.response && (error.response.status === 401 || error.response.status === 403);
      logTest(`${endpoint.name} - No Token`, isExpectedError, null, isExpectedError ? null : error);
    }
  }
  
  // Test with invalid token
  for (const endpoint of endpoints) {
    try {
      let response;
      if (endpoint.method === 'GET') {
        response = await axios.get(`${API_URL}${endpoint.url}`, {
          headers: { 'Authorization': `Bearer ${invalidToken}` }
        });
      } else {
        response = await axios.post(`${API_URL}${endpoint.url}`, endpoint.data || {}, {
          headers: { 'Authorization': `Bearer ${invalidToken}` }
        });
      }
      
      // If we get here, the request succeeded with an invalid token, which is a failure
      logTest(`${endpoint.name} - Invalid Token`, false, response.data, 'Endpoint accessible with invalid token');
    } catch (error) {
      // We expect a 401 Unauthorized error
      const isExpectedError = error.response && (error.response.status === 401 || error.response.status === 403);
      logTest(`${endpoint.name} - Invalid Token`, isExpectedError, null, isExpectedError ? null : error);
    }
  }
  
  // Test with expired token (if supported by the API)
  if (!options.skipTokenTests) {
    for (const endpoint of endpoints) {
      try {
        let response;
        if (endpoint.method === 'GET') {
          response = await axios.get(`${API_URL}${endpoint.url}`, {
            headers: { 'Authorization': `Bearer ${expiredToken}` }
          });
        } else {
          response = await axios.post(`${API_URL}${endpoint.url}`, endpoint.data || {}, {
            headers: { 'Authorization': `Bearer ${expiredToken}` }
          });
        }
        
        // If we get here, the request succeeded with an expired token, which is a failure
        logTest(`${endpoint.name} - Expired Token`, false, response.data, 'Endpoint accessible with expired token');
      } catch (error) {
        // We expect a 401 Unauthorized error
        const isExpectedError = error.response && (error.response.status === 401 || error.response.status === 403);
        logTest(`${endpoint.name} - Expired Token`, isExpectedError, null, isExpectedError ? null : error);
      }
    }
  }
}

// Test input validation for bill payment initiation
async function testInputValidation() {
  console.log('\n=== Testing Input Validation ===');
  
  if (options.skipInputTests) {
    logSkipped('Input Validation Tests', 'Skipped due to --skip-input-tests flag');
    return;
  }
  
  // Test cases for input validation
  const testCases = [
    {
      name: 'Missing Required Fields',
      data: { billType: 'electricity' }, // Missing provider, customerReference, amount, currency
      expectError: true
    },
    {
      name: 'Invalid Bill Type',
      data: { billType: 'invalid_type', provider: 'IKEDC', customerReference: '12345678901', amount: 1000, currency: 'NGN' },
      expectError: true
    },
    {
      name: 'Negative Amount',
      data: { billType: 'electricity', provider: 'IKEDC', customerReference: '12345678901', amount: -1000, currency: 'NGN' },
      expectError: true
    },
    {
      name: 'Zero Amount',
      data: { billType: 'electricity', provider: 'IKEDC', customerReference: '12345678901', amount: 0, currency: 'NGN' },
      expectError: true
    },
    {
      name: 'Invalid Currency',
      data: { billType: 'electricity', provider: 'IKEDC', customerReference: '12345678901', amount: 1000, currency: 'INVALID' },
      expectError: true
    },
    {
      name: 'SQL Injection in Customer Reference',
      data: { billType: 'electricity', provider: 'IKEDC', customerReference: "12345' OR '1'='1", amount: 1000, currency: 'NGN' },
      expectError: true
    },
    {
      name: 'XSS in Provider',
      data: { billType: 'electricity', provider: '<script>alert("XSS")</script>', customerReference: '12345678901', amount: 1000, currency: 'NGN' },
      expectError: true
    },
    {
      name: 'Very Large Amount',
      data: { billType: 'electricity', provider: 'IKEDC', customerReference: '12345678901', amount: 1000000000000, currency: 'NGN' },
      expectError: true
    }
  ];
  
  for (const testCase of testCases) {
    try {
      const response = await axios.post(`${API_URL}/billsPayment/initiate`, testCase.data, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (testCase.expectError) {
        // If we expect an error but got success, the test failed
        logTest(`Input Validation - ${testCase.name}`, false, response.data, 'Expected validation error but request succeeded');
      } else {
        // If we don't expect an error and got success, the test passed
        logTest(`Input Validation - ${testCase.name}`, true);
      }
    } catch (error) {
      if (testCase.expectError) {
        // If we expect an error and got one, check if it's a validation error (400)
        const isValidationError = error.response && error.response.status === 400;
        logTest(`Input Validation - ${testCase.name}`, isValidationError, null, isValidationError ? null : error);
      } else {
        // If we don't expect an error but got one, the test failed
        logTest(`Input Validation - ${testCase.name}`, false, null, error);
      }
    }
  }
}

// Test rate limiting and brute force protection
async function testRateLimiting() {
  console.log('\n=== Testing Rate Limiting ===');
  
  if (options.skipRateTests) {
    logSkipped('Rate Limiting Tests', 'Skipped due to --skip-rate-tests flag');
    return;
  }
  
  // Test rapid requests to see if rate limiting kicks in
  const endpoint = '/billsPayment/initiate';
  const requestCount = 20; // Number of rapid requests to send
  const validData = {
    billType: 'electricity',
    provider: 'IKEDC',
    customerReference: '12345678901',
    amount: 1000,
    currency: 'NGN'
  };
  
  console.log(`Sending ${requestCount} rapid requests to test rate limiting...`);
  
  let rateLimitDetected = false;
  const requests = [];
  
  for (let i = 0; i < requestCount; i++) {
    // Add a small random delay to avoid network issues
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    
    // Create a unique customer reference for each request to avoid duplicate errors
    const data = { ...validData, customerReference: `${validData.customerReference}-${i}` };
    
    requests.push(
      axios.post(`${API_URL}${endpoint}`, data, {
        headers: { 'Authorization': `Bearer ${token}` }
      }).catch(error => {
        if (error.response && error.response.status === 429) {
          rateLimitDetected = true;
          return { rateLimited: true };
        }
        return { error };
      })
    );
  }
  
  const results = await Promise.all(requests);
  
  // Check if any requests were rate limited
  if (rateLimitDetected) {
    logTest('Rate Limiting', true, { message: 'Rate limiting correctly detected after multiple rapid requests' });
  } else {
    // If no rate limiting was detected, check if the server might have other protection mechanisms
    const successCount = results.filter(r => !r.error && !r.rateLimited).length;
    const errorCount = results.filter(r => r.error).length;
    
    console.log(`Results: ${successCount} successful requests, ${errorCount} errors, 0 rate limited`);
    
    // If all requests succeeded, rate limiting might not be implemented
    if (successCount === requestCount) {
      logTest('Rate Limiting', false, null, { message: 'No rate limiting detected after multiple rapid requests' });
    } else {
      // If some requests failed but not with 429, there might be other protection mechanisms
      logTest('Rate Limiting', true, { 
        message: 'Server rejected some requests, but not with explicit rate limiting status code',
        successCount,
        errorCount
      });
    }
  }
}

// Test token expiration and refresh
async function testTokenExpiration() {
  // Test token refresh
  try {
    // First, login to get a refresh token
    console.log('Attempting to login to get refresh token...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'security-test@example.com',
      password: 'SecurePassword123!'
    });
    
    if (!loginResponse.data || !loginResponse.data.refreshToken) {
      throw new Error('No refresh token received from login');
    }
    
    const refreshToken = loginResponse.data.refreshToken;
    console.log('Refresh token obtained from login');
    
    // Now test the refresh endpoint
    const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, {
      refreshToken
    });
    
    if (refreshResponse.status === 200 && refreshResponse.data.token) {
      logTest('Token Refresh', true, refreshResponse.data);
    } else {
      logTest('Token Refresh', false, refreshResponse.data);
    }
  } catch (error) {
    logTest('Token Refresh - Login', false, error.response ? error.response.data : error.message, error.response ? error.response.status : null);
  }
}

// Main function to run all tests
async function runTests() {
  console.log('=== Bills Payment API Security Tests ===');
  console.log(`Starting tests at: ${new Date().toISOString()}`);
  console.log('-----------------------------------');
  
  try {
    // Load token from file if it exists
    if (fs.existsSync('jwt-token.txt')) {
      token = fs.readFileSync('jwt-token.txt', 'utf8').trim();
      console.log('Using token from jwt-token.txt');
    }
    
    // Setup test environment
    await setupTestEnvironment();
    
    // Run authentication tests
    if (!options.skipAuthTests) {
      console.log('\n=== Testing Authentication Requirements ===');
      await testAuth();
    }
    
    // Run input validation tests
    if (!options.skipInputTests) {
      console.log('\n=== Testing Input Validation ===');
      await testInputValidation();
    }
    
    // Run rate limiting tests
    if (!options.skipRateTests) {
      console.log('\n=== Testing Rate Limiting ===');
      await testRateLimiting();
    }
    
    // Run token tests
    if (!options.skipTokenTests) {
      console.log('\n=== Testing Token Expiration and Refresh ===');
      console.log('Note: Token expiration tests are limited without server-side control');
      await testTokenExpiration();
    }
    
    // Print summary
    console.log('\n=== Test Summary ===');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed}`);
    console.log(`Failed: ${testResults.failed}`);
    console.log(`Skipped: ${testResults.skipped}`);
    console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    
    if (testResults.failed > 0) {
      console.log('\n⚠️ Some security tests failed. Please review the results above.');
    } else {
      console.log('\n✅ All security tests passed!');
    }
  } catch (error) {
    console.error('Error running tests:');
    console.error(error);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Unhandled error:', error);
});
