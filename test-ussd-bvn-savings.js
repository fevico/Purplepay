const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9883/api';
let AUTH_TOKEN = 'mock-jwt-token-for-testing';

// Test user data
const testUser = {
  name: 'Feature Test User',
  email: `feature${Date.now()}@example.com`,
  password: 'Password123!',
  phoneNumber: '08012345678',
  country: 'Nigeria'
};

// Main test function
async function runAllTests() {
  console.log('\n🚀 STARTING ALL TESTS...\n');

  try {
    // Run authentication tests
    await runAuthTests();

    // Run BVN verification tests
    await runBvnTests();

    // Run savings group tests
    await runSavingsGroupTests();

    // Run USSD tests
    await runUssdTests();

    console.log('\n\n🎉 All tests completed!\n');
  } catch (error) {
    console.error('\n❌ Tests failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Status:', error.response.status);
    }
  }
}

// Authentication tests
async function runAuthTests() {
  console.log('\n=== RUNNING AUTHENTICATION TESTS ===\n');

  // Register user
  console.log(`Registering user: ${testUser.email}`);
  const registerResponse = await axios.post(`${API_URL}/auth/register`, testUser);
  console.log('Registration response:', registerResponse.data);
  
  // Store token from registration
  AUTH_TOKEN = registerResponse.data.token;

  // Set transaction PIN
  console.log('Setting transaction PIN...');
  const pinResponse = await axios.post(
    `${API_URL}/security/set-transaction-pin`,
    { pin: '1234' },
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('Transaction PIN set:', pinResponse.data);

  // Test invalid PIN
  console.log('Testing invalid transaction PIN...');
  try {
    await axios.post(
      `${API_URL}/security/set-transaction-pin`,
      { pin: 'abcd' },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    console.log('❌ Invalid PIN was accepted!');
  } catch (error) {
    console.log('✅ Invalid PIN correctly rejected:', error.response.data);
  }

  console.log('\n✅ Authentication tests completed successfully!\n');
}

// BVN verification tests
async function runBvnTests() {
  console.log('\n=== RUNNING BVN VERIFICATION TESTS ===\n');

  // Verify BVN
  console.log('Verifying BVN...');
  const bvnData = {
    bvn: '22212345678',
    firstName: 'JOHN',
    lastName: 'DOE',
    dateOfBirth: '01-01-1990',
    phoneNumber: '08012345678'
  };
  
  const bvnResponse = await axios.post(
    `${API_URL}/bvn/verify`,
    bvnData,
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('BVN verification response:', bvnResponse.data);

  // Store transaction reference for later use
  const transactionRef = bvnResponse.data.data.transactionRef;

  // Test invalid BVN
  console.log('Testing invalid BVN...');
  try {
    await axios.post(
      `${API_URL}/bvn/verify`,
      { 
        bvn: '12345', 
        firstName: 'Invalid',
        lastName: 'User'
      },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    console.log('❌ Invalid BVN was accepted!');
  } catch (error) {
    console.log('✅ Invalid BVN correctly rejected:', error.response.data);
  }

  // Check BVN status
  console.log('Checking BVN status...');
  const statusResponse = await axios.get(
    `${API_URL}/bvn/status`,
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('BVN status response:', statusResponse.data);

  // Confirm BVN with OTP
  console.log('Confirming BVN with OTP...');
  const confirmResponse = await axios.post(
    `${API_URL}/bvn/confirm`,
    { 
      transactionRef,
      otp: '123456'
    },
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('BVN confirmation response:', confirmResponse.data);

  // Get BVN details
  console.log('Getting BVN details...');
  const detailsResponse = await axios.get(
    `${API_URL}/bvn/details`,
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('BVN details response:', detailsResponse.data);

  console.log('\n✅ BVN verification tests completed successfully!\n');
}

// Savings group tests
async function runSavingsGroupTests() {
  console.log('\n=== RUNNING SAVINGS GROUP TESTS ===\n');

  // Test invalid savings group creation
  console.log('Testing invalid savings group creation...');
  try {
    await axios.post(
      `${API_URL}/savings-groups`,
      { },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    console.log('❌ Invalid savings group was accepted!');
  } catch (error) {
    console.log('✅ Invalid savings group correctly rejected:', error.response.data);
  }

  // Create savings group
  console.log('Creating savings group...');
  const savingsGroupData = {
    name: 'Test Savings Group',
    description: 'A test savings group for API testing',
    contributionAmount: 5000,
    frequency: 'weekly',
    startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    totalCycles: 10
  };
  
  const createResponse = await axios.post(
    `${API_URL}/savings-groups`,
    savingsGroupData,
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('Savings group created:', createResponse.data);

  // Store group ID for later use
  const groupId = createResponse.data.savingsGroup._id;

  // Get user savings groups
  console.log('Getting user savings groups...');
  const listResponse = await axios.get(
    `${API_URL}/savings-groups`,
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('User savings groups:', listResponse.data);

  // Get savings group by ID
  console.log(`Getting savings group with ID: ${groupId}...`);
  const getResponse = await axios.get(
    `${API_URL}/savings-groups/${groupId}`,
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('Savings group details:', getResponse.data);

  console.log('\n✅ Savings group tests completed successfully!\n');
}

// USSD tests
async function runUssdTests() {
  console.log('\n=== RUNNING USSD TESTS ===\n');

  // Simulate USSD main menu request
  console.log('Simulating USSD main menu request...');
  const ussdMainMenuResponse = await axios.post(
    `${API_URL}/ussd`,
    {
      sessionId: `session-${Date.now()}`,
      serviceCode: '*384*123#',
      phoneNumber: testUser.phoneNumber,
      text: ''
    }
  );
  console.log('USSD main menu response:', ussdMainMenuResponse.data);

  // Simulate USSD balance check
  console.log('Simulating USSD balance check...');
  const ussdBalanceResponse = await axios.post(
    `${API_URL}/ussd`,
    {
      sessionId: `session-${Date.now()}`,
      serviceCode: '*384*123#',
      phoneNumber: testUser.phoneNumber,
      text: '1'
    }
  );
  console.log('USSD balance check response:', ussdBalanceResponse.data);

  // Simulate USSD transfer flow
  console.log('Simulating USSD transfer flow...');
  
  // Step 1: Select transfer
  const transferSession = `session-${Date.now()}`;
  const ussdTransferStep1Response = await axios.post(
    `${API_URL}/ussd`,
    {
      sessionId: transferSession,
      serviceCode: '*384*123#',
      phoneNumber: testUser.phoneNumber,
      text: '2'
    }
  );
  console.log('USSD transfer step 1 response:', ussdTransferStep1Response.data);
  
  // Step 2: Enter recipient
  const ussdTransferStep2Response = await axios.post(
    `${API_URL}/ussd`,
    {
      sessionId: transferSession,
      serviceCode: '*384*123#',
      phoneNumber: testUser.phoneNumber,
      text: '2*08012345678'
    }
  );
  console.log('USSD transfer step 2 response:', ussdTransferStep2Response.data);
  
  // Step 3: Enter amount
  const ussdTransferStep3Response = await axios.post(
    `${API_URL}/ussd`,
    {
      sessionId: transferSession,
      serviceCode: '*384*123#',
      phoneNumber: testUser.phoneNumber,
      text: '2*08012345678*1000'
    }
  );
  console.log('USSD transfer step 3 response:', ussdTransferStep3Response.data);
  
  // Step 4: Enter PIN
  const ussdTransferStep4Response = await axios.post(
    `${API_URL}/ussd`,
    {
      sessionId: transferSession,
      serviceCode: '*384*123#',
      phoneNumber: testUser.phoneNumber,
      text: '2*08012345678*1000*1234'
    }
  );
  console.log('USSD transfer step 4 response:', ussdTransferStep4Response.data);

  console.log('\n✅ USSD tests completed successfully!\n');
}

// Run all tests
runAllTests();
