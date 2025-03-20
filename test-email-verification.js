const axios = require('axios');

// Base URL for the API
const API_URL = 'https://dry-lands-study.loca.lt';

// Test user data
const testUser = {
  email: `test-user-${Date.now()}@example.com`,
  password: 'Password123!',
  name: 'Test User',
  phoneNumber: '+2348012345678'
};

// Function to register a new user
async function registerUser() {
  try {
    console.log(`Registering user with email: ${testUser.email}`);
    
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    
    console.log('Registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response?.data || error.message);
    throw error;
  }
}

// Function to verify a user with OTP
async function verifyUserWithOtp(userId, token) {
  try {
    console.log(`Verifying user with userId: ${userId} and token: ${token}`);
    
    const response = await axios.post(`${API_URL}/auth/verify`, {
      userId,
      token
    });
    
    console.log('Verification successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Verification failed:', error.response?.data || error.message);
    throw error;
  }
}

// Function to resend OTP
async function resendOtp(email) {
  try {
    console.log(`Resending OTP for email: ${email}`);
    
    const response = await axios.post(`${API_URL}/auth/resend-otp`, {
      email
    });
    
    console.log('OTP resent successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Failed to resend OTP:', error.response?.data || error.message);
    throw error;
  }
}

// Main function to run the tests
async function runTests() {
  try {
    console.log('===== STARTING EMAIL VERIFICATION TESTS =====\n');
    
    // Step 1: Register a new user
    const registrationData = await registerUser();
    
    // Step 2: Verify user with the token from registration
    console.log('\nVerifying with token from registration...');
    const verificationData = await verifyUserWithOtp(registrationData.id, registrationData.token);
    
    // Step 3: Try to resend OTP (this will likely fail since the user is already verified)
    console.log('\nTrying to resend verification token (expected to fail for verified users)...');
    try {
      const resendData = await resendOtp(testUser.email);
      console.log('Resend successful (unexpected)');
      
      // Step 4: Try to verify user with the new token (should not reach here)
      console.log('\nVerifying with new token...');
      try {
        const newVerificationData = await verifyUserWithOtp(registrationData.id, resendData.token);
        console.log('Second verification successful!');
      } catch (error) {
        console.log('Second verification failed:', error.message);
      }
    } catch (error) {
      console.log('Resend failed as expected for verified users:', error.message);
    }
    
    console.log('\n===== TEST SUMMARY =====');
    console.log(`User Email: ${testUser.email}`);
    console.log(`User ID: ${registrationData.id}`);
    console.log(`Initial Token: ${registrationData.token}`);
    console.log('=========================\n');
    
    console.log('Email verification test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the tests
runTests();
