const axios = require('axios');

const API_URL = 'https://purplepay-backend.loca.lt';
let userId = '';
let verificationToken = '';
let verificationId = '';
let verificationCode = '';

// Helper function to log responses
function logResponse(title, data) {
  console.log(`\n${title}:`);
  console.log(JSON.stringify(data, null, 2));
}

// Test the full onboarding flow
async function testFullOnboarding() {
  try {
    console.log('='.repeat(50));
    console.log('PURPLEPAY FULL ONBOARDING FLOW TEST');
    console.log('='.repeat(50));
    
    // Generate a unique email for testing
    const testEmail = `test-user-${Date.now()}@example.com`;
    
    // Step 1: Register a new user
    console.log('\n1. REGISTERING NEW USER');
    console.log('-'.repeat(30));
    
    const registrationData = {
      email: testEmail,
      password: 'Password123',
      name: 'Test User',
      phoneNumber: '+2348012345678'
    };
    
    console.log(`Registering with email: ${testEmail}`);
    const registrationResponse = await axios.post(`${API_URL}/auth/register`, registrationData);
    
    console.log('Registration successful!');
    logResponse('Response', registrationResponse.data);
    
    // Save user ID and verification token
    userId = registrationResponse.data.id;
    verificationToken = registrationResponse.data.token;
    
    // Step 2: Verify email
    console.log('\n2. VERIFYING EMAIL');
    console.log('-'.repeat(30));
    
    console.log(`Verifying email with token: ${verificationToken}`);
    const verificationResponse = await axios.get(`${API_URL}/auth/verify?userId=${userId}&token=${verificationToken}`);
    
    console.log('Email verification successful!');
    logResponse('Response', verificationResponse.data);
    
    // Step 3: Set transaction PIN
    console.log('\n3. SETTING TRANSACTION PIN');
    console.log('-'.repeat(30));
    
    const pin = '1234';
    console.log(`Setting transaction PIN: ${pin}`);
    
    const pinResponse = await axios.post(
      `${API_URL}/security/set-transaction-pin`, 
      { pin },
      { headers: { 'user-id': userId } }
    );
    
    console.log('Transaction PIN set successfully!');
    logResponse('Response', pinResponse.data);
    
    // Step 4: Verify BVN
    console.log('\n4. VERIFYING BVN');
    console.log('-'.repeat(30));
    
    const bvnData = {
      bvn: '12345678901',
      firstName: 'Test',
      lastName: 'User',
      dateOfBirth: '1990-01-01',
      phoneNumber: '+2348012345678'
    };
    
    console.log(`Verifying BVN: ${bvnData.bvn}`);
    const bvnResponse = await axios.post(
      `${API_URL}/bvn/verify`,
      bvnData,
      { headers: { 'user-id': userId } }
    );
    
    console.log('BVN verification initiated!');
    logResponse('Response', bvnResponse.data);
    
    // Save verification ID and code
    verificationId = bvnResponse.data.verificationId;
    verificationCode = bvnResponse.data.verificationCode;
    
    // Step 5: Confirm BVN with OTP
    console.log('\n5. CONFIRMING BVN WITH OTP');
    console.log('-'.repeat(30));
    
    console.log(`Confirming BVN with OTP: ${verificationCode}`);
    const confirmBvnResponse = await axios.post(
      `${API_URL}/bvn/confirm-otp`,
      { verificationId, otp: verificationCode },
      { headers: { 'user-id': userId } }
    );
    
    console.log('BVN verification confirmed!');
    logResponse('Response', confirmBvnResponse.data);
    
    // Step 6: Check username availability
    console.log('\n6. CHECKING USERNAME AVAILABILITY');
    console.log('-'.repeat(30));
    
    const username = `testuser${Date.now().toString().slice(-6)}`;
    console.log(`Checking availability for username: @${username}`);
    
    const usernameCheckResponse = await axios.get(
      `${API_URL}/tag/check-availability/${username}`,
      { headers: { 'user-id': userId } }
    );
    
    console.log('Username availability checked!');
    logResponse('Response', usernameCheckResponse.data);
    
    // Step 7: Set username
    console.log('\n7. SETTING USERNAME');
    console.log('-'.repeat(30));
    
    console.log(`Setting username: @${username}`);
    const setUsernameResponse = await axios.post(
      `${API_URL}/tag/set-username`,
      { username: `@${username}` },
      { headers: { 'user-id': userId } }
    );
    
    console.log('Username set successfully!');
    logResponse('Response', setUsernameResponse.data);
    
    // Step 8: Get available tags
    console.log('\n8. GETTING AVAILABLE TAGS');
    console.log('-'.repeat(30));
    
    const tagsResponse = await axios.get(
      `${API_URL}/tag/available-tags`,
      { headers: { 'user-id': userId } }
    );
    
    console.log('Available tags retrieved!');
    console.log('Response (truncated):');
    console.log(JSON.stringify({
      count: tagsResponse.data.tags.length,
      sample: tagsResponse.data.tags.slice(0, 3)
    }, null, 2));
    
    // Step 9: Select tags
    console.log('\n9. SELECTING TAGS');
    console.log('-'.repeat(30));
    
    // Select 3 random tags
    const availableTags = tagsResponse.data.tags;
    const selectedTagIds = availableTags
      .slice(0, 3)
      .map(tag => tag.id);
    
    console.log(`Selecting tags: ${selectedTagIds.join(', ')}`);
    const selectTagsResponse = await axios.post(
      `${API_URL}/tag/select-tags`,
      { tagIds: selectedTagIds },
      { headers: { 'user-id': userId } }
    );
    
    console.log('Tags selected successfully!');
    logResponse('Response', selectTagsResponse.data);
    
    // Step 10: Check final onboarding status
    console.log('\n10. CHECKING FINAL ONBOARDING STATUS');
    console.log('-'.repeat(30));
    
    const statusResponse = await axios.get(
      `${API_URL}/auth/onboarding-status`,
      { headers: { 'user-id': userId } }
    );
    
    console.log('Final onboarding status:');
    logResponse('Response', statusResponse.data);
    
    // Final summary
    console.log('\n='.repeat(50));
    console.log('ONBOARDING FLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\nUser Details:');
    console.log(`- User ID: ${userId}`);
    console.log(`- Email: ${testEmail}`);
    console.log(`- Username: @${username}`);
    console.log(`- BVN: ${bvnData.bvn}`);
    console.log(`- Selected Tags: ${selectedTagIds.join(', ')}`);
    console.log('\nOnboarding Status:');
    
    const onboardingStatus = statusResponse.data.onboardingStatus;
    Object.entries(onboardingStatus).forEach(([key, value]) => {
      console.log(`- ${key}: ${value}`);
    });
    
    console.log('\nVerification Links:');
    console.log(`- Email Verification: ${API_URL}/auth/verify?userId=${userId}&token=${verificationToken}`);
    
    console.log('\n='.repeat(50));
    
  } catch (error) {
    console.error('Error during onboarding flow test:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status code:', error.response.status);
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testFullOnboarding();
