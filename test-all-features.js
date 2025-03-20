const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9883/api';
let AUTH_TOKEN = 'mock-jwt-token-for-testing';

// Test user data
const testUser = {
  name: 'PurplePay Test User',
  email: `test${Date.now()}@example.com`,
  password: 'Password123!',
  phoneNumber: '08012345678',
  country: 'Nigeria'
};

// Main test function
async function runAllTests() {
  console.log('\n🚀 STARTING ALL PURPLEPAY FEATURES TESTS...\n');

  try {
    // Run authentication tests
    await runAuthTests();

    // Run BVN verification tests
    await runBvnTests();

    // Run wallet tests
    await runWalletTests();

    // Run virtual card tests
    await runVirtualCardTests();

    // Run savings group tests
    await runSavingsGroupTests();

    // Run USSD tests
    await runUssdTests();

    console.log('\n\n🎉 All tests completed successfully!\n');
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

  console.log('\n✅ BVN verification tests completed successfully!\n');
}

// Wallet tests
async function runWalletTests() {
  console.log('\n=== RUNNING WALLET TESTS ===\n');

  // Get wallet
  console.log('Getting wallet...');
  const walletResponse = await axios.get(
    `${API_URL}/wallet`,
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('Wallet response:', walletResponse.data);

  // Deposit to wallet
  console.log('Depositing to wallet...');
  const depositResponse = await axios.post(
    `${API_URL}/wallet/deposit`,
    {
      amount: 10000,
      description: 'Test deposit'
    },
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('Deposit response:', depositResponse.data);

  // Withdraw from wallet
  console.log('Withdrawing from wallet...');
  const withdrawResponse = await axios.post(
    `${API_URL}/wallet/withdraw`,
    {
      amount: 2000,
      description: 'Test withdrawal',
      transactionPin: '1234'
    },
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('Withdraw response:', withdrawResponse.data);

  // Get transaction history
  console.log('Getting transaction history...');
  const transactionsResponse = await axios.get(
    `${API_URL}/transactions`,
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('Transaction history response:', transactionsResponse.data);

  console.log('\n✅ Wallet tests completed successfully!\n');
}

// Virtual Card tests
async function runVirtualCardTests() {
  console.log('\n=== RUNNING VIRTUAL CARD TESTS ===\n');

  // Create virtual card
  console.log('Creating virtual card...');
  const createCardResponse = await axios.post(
    `${API_URL}/virtual-cards`,
    { transactionPin: '1234' },
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('Create virtual card response:', createCardResponse.data);

  // Store card ID for later use
  const cardId = createCardResponse.data.card.id;

  // Get all virtual cards
  console.log('Getting all virtual cards...');
  const getCardsResponse = await axios.get(
    `${API_URL}/virtual-cards`,
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('Get virtual cards response:', getCardsResponse.data);

  // Fund virtual card
  console.log('Funding virtual card...');
  const fundCardResponse = await axios.post(
    `${API_URL}/virtual-cards/${cardId}/fund`,
    {
      amount: 2000,
      transactionPin: '1234'
    },
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('Fund virtual card response:', fundCardResponse.data);

  // Freeze virtual card
  console.log('Freezing virtual card...');
  const freezeCardResponse = await axios.put(
    `${API_URL}/virtual-cards/${cardId}/toggle-freeze`,
    { transactionPin: '1234' },
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('Freeze virtual card response:', freezeCardResponse.data);

  // Get virtual card details
  console.log('Getting virtual card details...');
  const cardDetailsResponse = await axios.get(
    `${API_URL}/virtual-cards/${cardId}/details`,
    { 
      headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
      params: { transactionPin: '1234' }
    }
  );
  console.log('Get virtual card details response:', cardDetailsResponse.data);

  console.log('\n✅ Virtual card tests completed successfully!\n');
}

// Savings group tests
async function runSavingsGroupTests() {
  console.log('\n=== RUNNING SAVINGS GROUP TESTS ===\n');

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

  console.log('\n✅ USSD tests completed successfully!\n');
}

// Run all tests
runAllTests();
