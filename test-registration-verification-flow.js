const axios = require('axios');

// Base URL for the API
const API_URL = 'https://dry-lands-study.loca.lt';

// Test user data with unique email
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

// Function to set transaction PIN
async function setTransactionPin(userId, pin) {
  try {
    console.log(`Setting transaction PIN for user: ${userId}`);
    
    const response = await axios.post(`${API_URL}/security/set-transaction-pin`, 
      { pin },
      {
        headers: {
          'user-id': userId
        }
      }
    );
    
    console.log('PIN setup successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('PIN setup failed:', error.response?.data || error.message);
    throw error;
  }
}

// Function to set username tag
async function setUsernameTag(userId, username) {
  try {
    console.log(`Setting username tag for user: ${userId}`);
    
    const response = await axios.post(`${API_URL}/tag/set-username`, 
      { username },
      {
        headers: {
          'user-id': userId
        }
      }
    );
    
    console.log('Username tag setup successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Username tag setup failed:', error.response?.data || error.message);
    throw error;
  }
}

// Main function to run the tests
async function runTests() {
  try {
    console.log('===== STARTING REGISTRATION AND VERIFICATION FLOW TEST =====\n');
    
    // Step 1: Register a new user
    const registrationData = await registerUser();
    const userId = registrationData.id;
    const token = registrationData.token;
    
    // Step 2: Verify user with the token from registration
    console.log('\nVerifying with token from registration...');
    const verificationData = await verifyUserWithOtp(userId, token);
    
    // Step 3: Set transaction PIN
    console.log('\nSetting transaction PIN...');
    const pinData = await setTransactionPin(userId, '1234');
    
    // Step 4: Set username tag
    console.log('\nSetting username tag...');
    const uniqueUsername = `user${Date.now()}`;
    const usernameData = await setUsernameTag(userId, uniqueUsername);
    
    console.log('\n===== TEST SUMMARY =====');
    console.log(`User Email: ${testUser.email}`);
    console.log(`User ID: ${userId}`);
    console.log(`Verification Token: ${token}`);
    console.log(`Username Tag: @${uniqueUsername}`);
    console.log('Onboarding Status:');
    console.log(JSON.stringify(usernameData.onboardingStatus, null, 2));
    console.log('=========================\n');
    
    console.log('Registration and verification flow test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the tests
runTests();
