const axios = require('axios');

const API_URL = 'https://purplepay-backend.loca.lt';

async function testOnboarding() {
  try {
    console.log('Starting onboarding test...');
    
    // Generate test data
    const testEmail = `test${Date.now()}@example.com`;
    const testUsername = `user${Date.now().toString().slice(-6)}`;
    
    // Step 1: Register user
    console.log('Step 1: Registering user...');
    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      email: testEmail,
      password: 'Password123',
      name: 'Test User',
      phoneNumber: '+2348012345678'
    });
    
    const userId = registerRes.data.id;
    const token = registerRes.data.token;
    
    console.log(`User registered with ID: ${userId}`);
    
    // Step 2: Verify email
    console.log('Step 2: Verifying email...');
    await axios.get(`${API_URL}/auth/verify?userId=${userId}&token=${token}`);
    console.log('Email verified');
    
    // Step 3: Set transaction PIN
    console.log('Step 3: Setting transaction PIN...');
    await axios.post(
      `${API_URL}/security/set-transaction-pin`,
      { pin: '1234' },
      { headers: { 'user-id': userId } }
    );
    console.log('Transaction PIN set');
    
    // Step 4: Verify BVN
    console.log('Step 4: Verifying BVN...');
    const bvnRes = await axios.post(
      `${API_URL}/bvn/verify`,
      {
        bvn: '12345678901',
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        phoneNumber: '+2348012345678'
      },
      { headers: { 'user-id': userId } }
    );
    
    const verificationId = bvnRes.data.verificationId;
    const verificationCode = bvnRes.data.verificationCode;
    console.log('BVN verification initiated');
    
    // Step 5: Confirm BVN
    console.log('Step 5: Confirming BVN with OTP...');
    await axios.post(
      `${API_URL}/bvn/confirm-otp`,
      { verificationId, otp: verificationCode },
      { headers: { 'user-id': userId } }
    );
    console.log('BVN verified');
    
    // Step 6: Set username
    console.log('Step 6: Setting username...');
    await axios.post(
      `${API_URL}/tag/set-username`,
      { username: `@${testUsername}` },
      { headers: { 'user-id': userId } }
    );
    console.log(`Username set to @${testUsername}`);
    
    // Step 7: Get available tags
    console.log('Step 7: Getting available tags...');
    const tagsRes = await axios.get(
      `${API_URL}/tag/available-tags`,
      { headers: { 'user-id': userId } }
    );
    
    // Step 8: Select tags
    console.log('Step 8: Selecting tags...');
    const tagIds = tagsRes.data.tags.slice(0, 3).map(tag => tag.id);
    await axios.post(
      `${API_URL}/tag/select-tags`,
      { tagIds },
      { headers: { 'user-id': userId } }
    );
    console.log('Tags selected');
    
    // Step 9: Check final status
    console.log('Step 9: Checking final onboarding status...');
    const statusRes = await axios.get(
      `${API_URL}/auth/onboarding-status`,
      { headers: { 'user-id': userId } }
    );
    
    console.log('\nFinal onboarding status:');
    console.log(JSON.stringify(statusRes.data.onboardingStatus, null, 2));
    
    console.log('\nOnboarding test completed successfully!');
    console.log(`User ID: ${userId}`);
    console.log(`Email: ${testEmail}`);
    console.log(`Username: @${testUsername}`);
    
  } catch (error) {
    console.error('Error during onboarding test:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testOnboarding();
