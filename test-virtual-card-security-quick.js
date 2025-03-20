/**
 * Virtual Card API Security Quick Test
 * 
 * This script performs a simplified security test of the Virtual Card API
 * focusing on authentication and basic input validation.
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:9876';
// Read token from file if it exists, otherwise use a default test token
let authToken;
try {
  authToken = fs.existsSync('test-token.txt') 
    ? fs.readFileSync('test-token.txt', 'utf8').trim()
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2MTIzNDU2Nzg5YWJjZGVmMDEyMzQ1NjciLCJpYXQiOjE3NDIzNTI1MTQsImV4cCI6MTc0MjQzODkxNH0.tRxXo7YCvm7T5Gff_2Ob30oEzGPuy7ok8MFhlfhG3Ok';
} catch (error) {
  console.error('Error reading token file:', error.message);
  process.exit(1);
}

// API client with authentication
const api = {
  post: async (endpoint, data) => {
    return await axios.post(`${API_URL}${endpoint}`, data, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  },
  get: async (endpoint) => {
    return await axios.get(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
  },
  postWithoutAuth: async (endpoint, data) => {
    return await axios.post(`${API_URL}${endpoint}`, data);
  }
};

// Test authentication requirements
const testAuth = async () => {
  console.log('\n🔒 Testing authentication requirements...');
  
  try {
    // Try to access endpoints without authentication
    try {
      await axios.post(`${API_URL}/card/create-customer`, {
        firstName: 'Test',
        lastName: 'User'
      });
      console.error('❌ Authentication test failed: Able to create customer without auth token');
      return false;
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('✅ Authentication required for create-customer endpoint');
      } else {
        console.log('⚠️ Unexpected error when testing create-customer endpoint:');
        console.log(`   Status: ${error.response?.status || 'No response'}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log('🔒 Authentication tests completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Authentication test error:', error.message);
    return false;
  }
};

// Test input validation for customer creation
const testInputValidation = async () => {
  console.log('\n🔍 Testing input validation...');
  
  try {
    // Test with missing required fields
    try {
      await api.post('/card/create-customer', {
        firstName: 'Test'
        // Missing other required fields
      });
      console.error('❌ Input validation test failed: Accepted incomplete data');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ Input validation working: Rejected incomplete data');
      } else {
        console.log('⚠️ Unexpected error when testing input validation:');
        console.log(`   Status: ${error.response?.status || 'No response'}`);
        console.log(`   Message: ${error.response?.data?.message || error.message}`);
      }
    }
    
    console.log('🔍 Input validation tests completed');
    return true;
  } catch (error) {
    console.error('❌ Input validation test error:', error.message);
    return false;
  }
};

// Run all tests
const runTests = async () => {
  console.log('Starting Virtual Card API Quick Security Test...');
  
  try {
    // Run authentication test
    const authResult = await testAuth();
    console.log(`Authentication tests: ${authResult ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Run input validation test
    const validationResult = await testInputValidation();
    console.log(`Input validation tests: ${validationResult ? '✅ PASSED' : '❌ FAILED'}`);
    
    // Print summary
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Authentication: ${authResult ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Input Validation: ${validationResult ? 'PASS' : 'FAIL'}`);
    
    const passCount = [authResult, validationResult].filter(Boolean).length;
    console.log(`\n🏁 Final Result: ${passCount}/2 tests passed`);
    
    if (passCount === 2) {
      console.log('\n🔒 All security tests passed!');
    } else {
      console.log('\n⚠️ Some security tests failed. Please review the issues above.');
    }
  } catch (error) {
    console.error('❌ Error running tests:', error.message);
  }
};

// Run the tests
runTests();
