const axios = require('axios');

const API_URL = 'https://purplepay-backend.loca.lt';

/**
 * Test the complete onboarding flow with error handling and edge cases
 */
async function testComprehensiveOnboarding() {
  console.log('='.repeat(60));
  console.log('PURPLEPAY COMPREHENSIVE ONBOARDING FLOW TEST');
  console.log('='.repeat(60));
  
  try {
    // Generate unique test data
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@example.com`;
    const testUsername = `user${timestamp.toString().slice(-6)}`;
    
    // Test Case 1: Successful full onboarding flow
    console.log('\n[TEST CASE 1] SUCCESSFUL FULL ONBOARDING FLOW');
    console.log('-'.repeat(50));
    
    const user = await registerAndVerifyUser(testEmail);
    await setupTransactionPin(user.id);
    await verifyBvn(user.id);
    await setupUsername(user.id, testUsername);
    await selectTags(user.id);
    
    // Check final status
    const finalStatus = await checkOnboardingStatus(user.id);
    
    console.log('\nFinal Onboarding Status:');
    console.log(JSON.stringify(finalStatus, null, 2));
    
    if (finalStatus.onboardingComplete) {
      console.log('\n✅ TEST CASE 1 PASSED: Full onboarding flow completed successfully');
    } else {
      console.log('\n❌ TEST CASE 1 FAILED: Onboarding not marked as complete');
    }
    
    // Test Case 2: Invalid username format
    console.log('\n[TEST CASE 2] INVALID USERNAME FORMAT');
    console.log('-'.repeat(50));
    
    const user2 = await registerAndVerifyUser(`test2${timestamp}@example.com`);
    
    try {
      // Try to set an invalid username (special characters)
      await axios.post(
        `${API_URL}/tag/set-username`,
        { username: '@invalid-username!' },
        { headers: { 'user-id': user2.id } }
      );
      console.log('❌ TEST CASE 2 FAILED: Invalid username was accepted');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ TEST CASE 2 PASSED: Invalid username was rejected');
        console.log(`Error message: ${error.response.data.message}`);
      } else {
        throw error;
      }
    }
    
    // Test Case 3: Too many tags
    console.log('\n[TEST CASE 3] TOO MANY TAGS');
    console.log('-'.repeat(50));
    
    const user3 = await registerAndVerifyUser(`test3${timestamp}@example.com`);
    await setupTransactionPin(user3.id);
    
    // Get available tags
    const tagsRes = await axios.get(
      `${API_URL}/tag/available-tags`,
      { headers: { 'user-id': user3.id } }
    );
    
    // Try to select more than 5 tags
    const tooManyTags = tagsRes.data.tags.slice(0, 6).map(tag => tag.id);
    
    try {
      await axios.post(
        `${API_URL}/tag/select-tags`,
        { tagIds: tooManyTags },
        { headers: { 'user-id': user3.id } }
      );
      console.log('❌ TEST CASE 3 FAILED: More than 5 tags were accepted');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('✅ TEST CASE 3 PASSED: Too many tags were rejected');
        console.log(`Error message: ${error.response.data.message}`);
      } else {
        throw error;
      }
    }
    
    // Test Case 4: Username with @ prefix
    console.log('\n[TEST CASE 4] USERNAME WITH @ PREFIX');
    console.log('-'.repeat(50));
    
    const user4 = await registerAndVerifyUser(`test4${timestamp}@example.com`);
    
    // Set username with @ prefix
    const usernameWithPrefix = `@test${timestamp.toString().slice(-6)}`;
    const usernameRes = await axios.post(
      `${API_URL}/tag/set-username`,
      { username: usernameWithPrefix },
      { headers: { 'user-id': user4.id } }
    );
    
    console.log(`Username response: ${JSON.stringify(usernameRes.data, null, 2)}`);
    
    if (usernameRes.data.displayUsername === usernameWithPrefix) {
      console.log('✅ TEST CASE 4 PASSED: Username with @ prefix was handled correctly');
    } else {
      console.log('❌ TEST CASE 4 FAILED: Username with @ prefix was not handled correctly');
    }
    
    // Test Case 5: Skip BVN verification but complete other steps
    console.log('\n[TEST CASE 5] SKIP BVN VERIFICATION');
    console.log('-'.repeat(50));
    
    const user5 = await registerAndVerifyUser(`test5${timestamp}@example.com`);
    await setupTransactionPin(user5.id);
    await setupUsername(user5.id, `skip${timestamp.toString().slice(-6)}`);
    await selectTags(user5.id);
    
    // Check final status without BVN verification
    const skipBvnStatus = await checkOnboardingStatus(user5.id);
    
    console.log('\nOnboarding Status (Skipped BVN):');
    console.log(JSON.stringify(skipBvnStatus, null, 2));
    
    if (skipBvnStatus.onboardingComplete && !skipBvnStatus.bvnVerified) {
      console.log('✅ TEST CASE 5 PASSED: Onboarding completed without BVN verification');
    } else {
      console.log('❌ TEST CASE 5 FAILED: Onboarding status incorrect when skipping BVN verification');
    }
    
    // Summary
    console.log('\n='.repeat(60));
    console.log('COMPREHENSIVE ONBOARDING TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('\nTest Users Created:');
    console.log(`1. Full Flow User: ${user.id} (${testEmail})`);
    console.log(`2. Invalid Username User: ${user2.id}`);
    console.log(`3. Too Many Tags User: ${user3.id}`);
    console.log(`4. Username With @ Prefix User: ${user4.id}`);
    console.log(`5. Skip BVN User: ${user5.id}`);
    
    console.log('\nAll tests completed!');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED with error:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Response:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Helper functions for the test cases
async function registerAndVerifyUser(email) {
  console.log(`Registering user with email: ${email}`);
  
  // Register user
  const registerRes = await axios.post(`${API_URL}/auth/register`, {
    email,
    password: 'Password123',
    name: 'Test User',
    phoneNumber: '+2348012345678'
  });
  
  const userId = registerRes.data.id;
  const token = registerRes.data.token;
  
  console.log(`User registered with ID: ${userId}`);
  
  // Verify email
  await axios.get(`${API_URL}/auth/verify?userId=${userId}&token=${token}`);
  console.log('Email verified');
  
  return { id: userId, token };
}

async function setupTransactionPin(userId) {
  console.log('Setting up transaction PIN...');
  await axios.post(
    `${API_URL}/security/set-transaction-pin`,
    { pin: '1234' },
    { headers: { 'user-id': userId } }
  );
  console.log('Transaction PIN set');
}

async function verifyBvn(userId) {
  console.log('Verifying BVN...');
  
  // Initiate BVN verification
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
  
  // Confirm BVN with OTP
  await axios.post(
    `${API_URL}/bvn/confirm-otp`,
    { verificationId, otp: verificationCode },
    { headers: { 'user-id': userId } }
  );
  
  console.log('BVN verified');
}

async function setupUsername(userId, username) {
  console.log(`Setting username to: ${username}`);
  await axios.post(
    `${API_URL}/tag/set-username`,
    { username },
    { headers: { 'user-id': userId } }
  );
  console.log('Username set');
}

async function selectTags(userId) {
  console.log('Selecting tags...');
  
  // Get available tags
  const tagsRes = await axios.get(
    `${API_URL}/tag/available-tags`,
    { headers: { 'user-id': userId } }
  );
  
  // Select 3 tags
  const tagIds = tagsRes.data.tags.slice(0, 3).map(tag => tag.id);
  await axios.post(
    `${API_URL}/tag/select-tags`,
    { tagIds },
    { headers: { 'user-id': userId } }
  );
  
  console.log('Tags selected');
}

async function checkOnboardingStatus(userId) {
  const statusRes = await axios.get(
    `${API_URL}/auth/onboarding-status`,
    { headers: { 'user-id': userId } }
  );
  return statusRes.data.onboardingStatus;
}

// Run the comprehensive test
testComprehensiveOnboarding();
