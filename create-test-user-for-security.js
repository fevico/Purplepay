/**
 * Create Test User for Security Tests
 * 
 * This script creates a test user and generates a valid JWT token for security testing.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = 'http://localhost:9876';
const TEST_USER = {
  email: 'security-test@example.com',
  password: 'SecurePassword123!',
  name: 'Security Tester'
};

async function createTestUser() {
  console.log('=== Creating Test User for Security Tests ===');
  
  try {
    let userExists = false;
    
    // Step 1: Register a new user
    console.log('Registering new user...');
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, TEST_USER);
      
      if (!registerResponse.data || !registerResponse.data.token) {
        throw new Error('Failed to get verification token');
      }
      
      const verificationToken = registerResponse.data.token;
      console.log('User registered successfully');
      
      // Step 2: Verify the user
      console.log('Verifying user...');
      await axios.post(`${API_URL}/auth/verify`, {
        email: TEST_USER.email,
        token: verificationToken
      });
      console.log('User verified successfully');
    } catch (error) {
      if (error.response && error.response.status === 400 && error.response.data.message === 'User already exists') {
        console.log('User already exists, proceeding to login');
        userExists = true;
      } else {
        throw error;
      }
    }
    
    // Step 3: Login to get JWT token
    console.log('Logging in to get JWT token...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (!loginResponse.data || !loginResponse.data.token) {
      throw new Error('Failed to get JWT token');
    }
    
    const jwtToken = loginResponse.data.token;
    const refreshToken = loginResponse.data.refreshToken || '';
    
    // Step 4: Save tokens to files
    fs.writeFileSync(path.join(__dirname, 'jwt-token.txt'), jwtToken);
    
    if (refreshToken) {
      fs.writeFileSync(path.join(__dirname, 'refresh-token.txt'), refreshToken);
      console.log('Refresh token saved to refresh-token.txt');
    } else {
      console.log('No refresh token received');
    }
    
    console.log('JWT token saved to jwt-token.txt');
    
    // Step 5: Create a wallet for the user (if user is new)
    if (!userExists) {
      console.log('Creating wallet for test user...');
      try {
        await axios.post(`${API_URL}/wallet/create`, {}, {
          headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        console.log('Wallet created successfully');
      } catch (error) {
        console.log('Wallet creation failed, may already exist or service unavailable');
      }
      
      // Step 6: Fund the wallet
      try {
        await axios.post(`${API_URL}/wallet/fund`, {
          amount: 10000,
          currency: 'NGN'
        }, {
          headers: { 'Authorization': `Bearer ${jwtToken}` }
        });
        console.log('Wallet funded successfully');
      } catch (error) {
        console.log('Wallet funding failed, service may be unavailable');
      }
    } else {
      console.log('Using existing user account, skipping wallet creation');
    }
    
    console.log('\n=== Test User Setup Complete ===');
    console.log('Email:', TEST_USER.email);
    console.log('Password:', TEST_USER.password);
    console.log('JWT Token saved to jwt-token.txt');
    
    console.log('\nYou can now run the security tests with:');
    console.log('node test-bills-payment-security.js');
    
  } catch (error) {
    console.error('Error creating test user:');
    if (error.response) {
      console.error(`API Error Response: { status: ${error.response.status}, data:`, error.response.data, '}');
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

// Run the script
createTestUser();
