const axios = require('axios');

const API_URL = 'https://dry-lands-study.loca.lt';
let authToken = '';
let userId = '';

// Test registration and onboarding flow
async function testOnboardingFlow() {
  try {
    console.log('Starting onboarding flow test...');
    
    // 1. Register a new user
    console.log('\n1. Registering a new user...');
    const uniqueEmail = `test${Date.now()}@example.com`;
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      email: uniqueEmail,
      password: 'Password123',
      name: 'Test User',
      phoneNumber: '+2347012345678'
    });
    
    console.log('Registration response:', registerResponse.data);
    userId = registerResponse.data.id;
    const verificationToken = registerResponse.data.token;
    
    // 2. Verify email
    console.log('\n2. Verifying email...');
    const verifyResponse = await axios.post(`${API_URL}/auth/verify`, {
      userId,
      token: verificationToken
    });
    
    console.log('Verification response:', verifyResponse.data);
    authToken = verifyResponse.data.token;
    
    // Set auth header for subsequent requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    
    // 3. Set transaction PIN
    console.log('\n3. Setting transaction PIN...');
    const pinResponse = await axios.post(`${API_URL}/security/set-transaction-pin`, {
      pin: '1234'
    }, {
      headers: {
        'user-id': userId
      }
    });
    
    console.log('PIN setup response:', pinResponse.data);
    
    // 4. Verify BVN
    console.log('\n4. Verifying BVN...');
    const bvnResponse = await axios.post(`${API_URL}/bvn/verify`, {
      bvn: '12345678901',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      phoneNumber: '+2348012345678'
    }, {
      headers: {
        'user-id': userId
      }
    });
    
    console.log('BVN verification response:', bvnResponse.data);
    const verificationId = bvnResponse.data.verificationId;
    
    // 5. Confirm BVN with OTP
    console.log('\n5. Confirming BVN with OTP...');
    const bvnConfirmResponse = await axios.post(`${API_URL}/bvn/confirm-otp`, {
      verificationId,
      otp: bvnResponse.data.verificationCode || '123456' // Use the verification code from the response if available
    }, {
      headers: {
        'user-id': userId
      }
    });
    
    console.log('BVN confirmation response:', bvnConfirmResponse.data);
    
    // 6. Check username availability
    console.log('\n6. Checking username availability...');
    const uniqueUsername = `user${Date.now()}`;
    const usernameCheckResponse = await axios.get(`${API_URL}/tag/check-availability/${uniqueUsername}`, {
      headers: {
        'user-id': userId
      }
    });
    
    console.log('Username check response:', usernameCheckResponse.data);
    
    // 7. Set username
    console.log('\n7. Setting username...');
    const usernameResponse = await axios.post(`${API_URL}/tag/set-username`, {
      username: uniqueUsername
    }, {
      headers: {
        'user-id': userId
      }
    });
    
    console.log('Set username response:', usernameResponse.data);
    
    // 8. Get available tags
    console.log('\n8. Getting available tags...');
    const tagsResponse = await axios.get(`${API_URL}/tag/available-tags`, {
      headers: {
        'user-id': userId
      }
    });
    
    console.log('Available tags response:', tagsResponse.data);
    
    // 9. Select tags
    console.log('\n9. Selecting tags...');
    const selectTagsResponse = await axios.post(`${API_URL}/tag/select-tags`, {
      tagIds: ['1', '2', '3']
    }, {
      headers: {
        'user-id': userId
      }
    });
    
    console.log('Select tags response:', selectTagsResponse.data);
    
    // 10. Check onboarding status
    console.log('\n10. Checking onboarding status...');
    const statusResponse = await axios.get(`${API_URL}/auth/onboarding-status`, {
      headers: {
        'user-id': userId
      }
    });
    
    console.log('Onboarding status response:', statusResponse.data);
    
    console.log('\nOnboarding flow test completed successfully!');
  } catch (error) {
    console.error('Error during onboarding flow test:', error.response ? error.response.data : error.message);
  }
}

// Run the test
testOnboardingFlow();
