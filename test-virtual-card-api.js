const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9883/api';
let AUTH_TOKEN = 'mock-jwt-token-for-testing';

// Test user data
const testUser = {
  name: 'Card Test User',
  email: `card${Date.now()}@example.com`,
  password: 'Password123!',
  phoneNumber: '08012345678',
  country: 'Nigeria'
};

// Main test function
async function runAllTests() {
  console.log('\n🚀 STARTING VIRTUAL CARD API TESTS...\n');

  try {
    // Run authentication tests
    await runAuthTests();

    // Run virtual card tests
    await runVirtualCardTests();

    // Run error handling tests
    await runErrorHandlingTests();

    // Run edge case tests
    await runEdgeCaseTests();

    console.log('\n\n🎉 All virtual card tests completed!\n');
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

  // Unfreeze virtual card
  console.log('Unfreezing virtual card...');
  const unfreezeCardResponse = await axios.put(
    `${API_URL}/virtual-cards/${cardId}/toggle-freeze`,
    { transactionPin: '1234' },
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  console.log('Unfreeze virtual card response:', unfreezeCardResponse.data);

  // Test invalid card funding (insufficient funds)
  console.log('Testing invalid card funding (insufficient funds)...');
  try {
    await axios.post(
      `${API_URL}/virtual-cards/${cardId}/fund`,
      {
        amount: 1000000, // Very large amount
        transactionPin: '1234'
      },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    console.log('❌ Invalid funding was accepted!');
  } catch (error) {
    console.log('✅ Invalid funding correctly rejected:', error.response.data);
  }

  console.log('\n✅ Virtual card tests completed successfully!\n');
}

// Error handling tests
async function runErrorHandlingTests() {
  console.log('\n=== RUNNING ERROR HANDLING TESTS ===\n');

  // Test unauthorized access
  console.log('Testing unauthorized access...');
  try {
    await axios.get(`${API_URL}/virtual-cards`);
    console.log('❌ Unauthorized access was accepted!');
  } catch (error) {
    console.log('✅ Unauthorized access correctly rejected:', error.response.data);
  }

  // Test invalid transaction PIN
  console.log('Testing invalid transaction PIN...');
  try {
    await axios.post(
      `${API_URL}/virtual-cards`,
      { transactionPin: '9999' }, // Wrong PIN
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    console.log('❌ Invalid transaction PIN was accepted!');
  } catch (error) {
    console.log('✅ Invalid transaction PIN correctly rejected:', error.response.data);
  }

  // Test invalid card ID
  console.log('Testing invalid card ID...');
  try {
    await axios.get(
      `${API_URL}/virtual-cards/invalid-card-id/details`,
      { 
        headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
        params: { transactionPin: '1234' }
      }
    );
    console.log('❌ Invalid card ID was accepted!');
  } catch (error) {
    console.log('✅ Invalid card ID correctly rejected:', error.response.data);
  }

  console.log('\n✅ Error handling tests completed successfully!\n');
}

// Edge case tests
async function runEdgeCaseTests() {
  console.log('\n=== RUNNING EDGE CASE TESTS ===\n');

  // Create a card for edge case testing
  console.log('Creating a new card for edge case testing...');
  const createCardResponse = await axios.post(
    `${API_URL}/virtual-cards`,
    { transactionPin: '1234' },
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  const cardId = createCardResponse.data.card.id;

  // Test zero amount funding
  console.log('Testing zero amount funding...');
  try {
    await axios.post(
      `${API_URL}/virtual-cards/${cardId}/fund`,
      {
        amount: 0,
        transactionPin: '1234'
      },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    console.log('❌ Zero amount funding was accepted!');
  } catch (error) {
    console.log('✅ Zero amount funding correctly rejected:', error.response.data);
  }

  // Test negative amount funding
  console.log('Testing negative amount funding...');
  try {
    await axios.post(
      `${API_URL}/virtual-cards/${cardId}/fund`,
      {
        amount: -100,
        transactionPin: '1234'
      },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    console.log('❌ Negative amount funding was accepted!');
  } catch (error) {
    console.log('✅ Negative amount funding correctly rejected:', error.response.data);
  }

  // Test multiple freeze/unfreeze operations
  console.log('Testing multiple freeze/unfreeze operations...');
  
  // First freeze
  await axios.put(
    `${API_URL}/virtual-cards/${cardId}/toggle-freeze`,
    { transactionPin: '1234' },
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  
  // Second freeze (should toggle to unfreeze)
  const secondFreezeResponse = await axios.put(
    `${API_URL}/virtual-cards/${cardId}/toggle-freeze`,
    { transactionPin: '1234' },
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  
  console.log('Multiple freeze/unfreeze operations response:', secondFreezeResponse.data);
  
  // Test funding a frozen card
  console.log('Testing funding a frozen card...');
  
  // First freeze the card
  await axios.put(
    `${API_URL}/virtual-cards/${cardId}/toggle-freeze`,
    { transactionPin: '1234' },
    { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
  );
  
  try {
    await axios.post(
      `${API_URL}/virtual-cards/${cardId}/fund`,
      {
        amount: 1000,
        transactionPin: '1234'
      },
      { headers: { Authorization: `Bearer ${AUTH_TOKEN}` } }
    );
    console.log('❓ Funding a frozen card - check if this should be allowed or rejected based on business rules');
  } catch (error) {
    console.log('Funding a frozen card rejected:', error.response.data);
  }

  console.log('\n✅ Edge case tests completed successfully!\n');
}

// Run all tests
runAllTests();
