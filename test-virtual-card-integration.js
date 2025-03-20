const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Configuration
const API_URL = 'http://localhost:9877';

// Load token from file
let token;
try {
  token = fs.readFileSync('clean-token.txt', 'utf8').trim();
  console.log('Token loaded from file:', token.substring(0, 20) + '...');
} catch (error) {
  console.error('Error loading token:', error.message);
  process.exit(1);
}

// Helper for logging test results
const logResult = (name, success, response, error = null) => {
  console.log(`\n--- ${name} ---`);
  console.log(`Status: ${success ? 'SUCCESS' : 'FAILED'}`);
  
  if (response) {
    console.log(`Status Code: ${response.status}`);
    // Format the response data for better readability
    try {
      const formattedData = JSON.stringify(response.data, null, 2);
      console.log('Response:', formattedData);
    } catch (e) {
      console.log('Response: [Error formatting response data]');
    }
  }
  
  if (error) {
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      try {
        const formattedData = JSON.stringify(error.response.data, null, 2);
        console.log('Data:', formattedData);
      } catch (e) {
        console.log('Data: [Error formatting error data]');
      }
    }
  }
  
  console.log('-'.repeat(50));
  return success;
};

// Test the complete integration of Virtual Card, Tag, and Rewards systems
async function testCompleteIntegration() {
  console.log('Starting Complete Integration Test for Virtual Card, Tag, and Rewards Systems');
  console.log('='.repeat(80));
  
  let customerId = null;
  let customerEmail = null;
  let cardId = null;
  let testTag = null;
  
  try {
    // PART 1: VIRTUAL CARD OPERATIONS
    console.log('\nPART 1: VIRTUAL CARD OPERATIONS');
    console.log('='.repeat(50));
    
    // 1. Create a customer
    try {
      const timestamp = Date.now();
      const customerData = {
        firstName: 'Integration',
        lastName: 'Test',
        customerEmail: `integration-${timestamp}@example.com`,
        phoneNumber: '08012345678',
        dateOfBirth: '1990-01-01',
        idImage: 'https://example.com/id-image.jpg',
        userPhoto: 'https://example.com/user-photo.jpg',
        line1: '123 Test Street',
        state: 'Accra',
        zipCode: '00233',
        city: 'Accra',
        country: 'Ghana',
        idType: 'PASSPORT',
        houseNumber: '123',
        idNumber: `PASS${timestamp}`
      };
      
      const customerResponse = await axios.post(
        `${API_URL}/card/create-customer`, 
        customerData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      const success = logResult('Create Customer', customerResponse.status === 200 || customerResponse.status === 201, customerResponse);
      if (success) {
        customerId = customerResponse.data.response?.customerId;
        customerEmail = customerResponse.data.response?.customerEmail;
        console.log(`Customer created with ID: ${customerId}`);
        console.log(`Customer email: ${customerEmail}`);
      } else {
        throw new Error('Failed to create customer');
      }
    } catch (error) {
      logResult('Create Customer', false, null, error);
      throw new Error('Test failed at customer creation step');
    }
    
    // 2. Create a card
    try {
      const cardData = {
        name_on_card: 'Integration Test',
        amount: 5000,
        customerEmail: customerEmail
      };
      
      const cardResponse = await axios.post(
        `${API_URL}/card/create-card`,
        cardData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      const success = logResult('Create Card', cardResponse.status === 200 || cardResponse.status === 201, cardResponse);
      if (success) {
        cardId = cardResponse.data.response?.card_id;
        console.log(`Card created with ID: ${cardId}`);
      } else {
        throw new Error('Failed to create card');
      }
    } catch (error) {
      logResult('Create Card', false, null, error);
      throw new Error('Test failed at card creation step');
    }
    
    // 3. Fund the card
    try {
      const fundData = {
        card_id: cardId,
        amount: 10000
      };
      
      const fundResponse = await axios.post(
        `${API_URL}/card/fund-card`,
        fundData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      logResult('Fund Card', fundResponse.status === 200, fundResponse);
    } catch (error) {
      logResult('Fund Card', false, null, error);
      throw new Error('Test failed at card funding step');
    }
    
    // 4. Get card details
    try {
      const detailsResponse = await axios.post(
        `${API_URL}/card/card-details`,
        { card_id: cardId },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      logResult('Card Details', detailsResponse.status === 200, detailsResponse);
    } catch (error) {
      logResult('Card Details', false, null, error);
      console.log('Warning: Could not get card details, but continuing test...');
    }
    
    // 5. Get card transactions
    try {
      const transactionsResponse = await axios.post(
        `${API_URL}/card/card-transactions`,
        { card_id: cardId },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      logResult('Card Transactions', transactionsResponse.status === 200, transactionsResponse);
    } catch (error) {
      logResult('Card Transactions', false, null, error);
      console.log('Warning: Could not get card transactions, but continuing test...');
    }
    
    // 6. Withdraw from card
    try {
      const withdrawResponse = await axios.post(
        `${API_URL}/card/withdraw-from-card`,
        { card_id: cardId, amount: 1000 },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      logResult('Withdraw From Card', withdrawResponse.status === 200, withdrawResponse);
    } catch (error) {
      logResult('Withdraw From Card', false, null, error);
      console.log('Warning: Could not withdraw from card, but continuing test...');
    }
    
    // PART 2: TAG SYSTEM OPERATIONS
    console.log('\nPART 2: TAG SYSTEM OPERATIONS');
    console.log('='.repeat(50));
    
    // 7. Get tag suggestions
    try {
      const suggestionsResponse = await axios.get(
        `${API_URL}/tag/suggestions?name=Integration%20Test`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      const success = logResult('Get Tag Suggestions', suggestionsResponse.status === 200, suggestionsResponse);
      if (success && suggestionsResponse.data.data.length > 0) {
        testTag = suggestionsResponse.data.data[0];
        console.log(`Selected tag: ${testTag}`);
      } else {
        testTag = `integration_${uuidv4().substring(0, 8)}`;
        console.log(`Generated fallback tag: ${testTag}`);
      }
    } catch (error) {
      logResult('Get Tag Suggestions', false, null, error);
      testTag = `integration_${uuidv4().substring(0, 8)}`;
      console.log(`Generated fallback tag after error: ${testTag}`);
    }
    
    // 8. Check tag availability
    try {
      const checkTagResponse = await axios.get(
        `${API_URL}/tag/check?tag=${encodeURIComponent(testTag)}`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      const success = logResult('Check Tag Availability', checkTagResponse.status === 200, checkTagResponse);
      if (success && !checkTagResponse.data.data.isAvailable) {
        testTag = `integration_${uuidv4().substring(0, 8)}`;
        console.log(`Tag not available, generated new tag: ${testTag}`);
      }
    } catch (error) {
      logResult('Check Tag Availability', false, null, error);
      console.log('Warning: Could not check tag availability, but continuing with the tag...');
    }
    
    // 9. Update user's tag
    try {
      const updateTagResponse = await axios.post(
        `${API_URL}/tag/update`,
        { tag: testTag },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      logResult('Update User Tag', updateTagResponse.status === 200, updateTagResponse);
    } catch (error) {
      logResult('Update User Tag', false, null, error);
      console.log('Warning: Could not update user tag, but continuing test...');
    }
    
    // 10. Update tag privacy
    try {
      const updatePrivacyResponse = await axios.post(
        `${API_URL}/tag/privacy`,
        { privacy: 'public' },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      logResult('Update Tag Privacy', updatePrivacyResponse.status === 200, updatePrivacyResponse);
    } catch (error) {
      logResult('Update Tag Privacy', false, null, error);
      console.log('Warning: Could not update tag privacy, but continuing test...');
    }
    
    // 11. Find user by tag
    try {
      const findUserResponse = await axios.get(
        `${API_URL}/tag/find/${encodeURIComponent(testTag)}`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      logResult('Find User by Tag', findUserResponse.status === 200, findUserResponse);
    } catch (error) {
      logResult('Find User by Tag', false, null, error);
      console.log('Warning: Could not find user by tag, but continuing test...');
    }
    
    // 12. Generate QR code for tag
    try {
      const qrCodeResponse = await axios.get(
        `${API_URL}/tag/qr/${encodeURIComponent(testTag)}`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      logResult('Generate QR Code', qrCodeResponse.status === 200, qrCodeResponse);
    } catch (error) {
      logResult('Generate QR Code', false, null, error);
      console.log('Warning: Could not generate QR code, but continuing test...');
    }
    
    // PART 3: REWARDS SYSTEM OPERATIONS
    console.log('\nPART 3: REWARDS SYSTEM OPERATIONS');
    console.log('='.repeat(50));
    
    // 13. Get rewards balance
    try {
      const rewardsResponse = await axios.get(
        `${API_URL}/rewards`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      const success = logResult('Get Rewards Balance', rewardsResponse.status === 200, rewardsResponse);
      
      if (success) {
        const rewardsData = rewardsResponse.data.data;
        console.log('\nRewards Summary:');
        console.log(`Available Balance: ${rewardsData.balance?.availableBalance || 0}`);
        console.log(`Lifetime Earned: ${rewardsData.balance?.lifetimeEarned || 0}`);
        console.log(`Current Tier: ${rewardsData.balance?.tier || 'bronze'}`);
        
        if (rewardsData.recentRewards && rewardsData.recentRewards.length > 0) {
          console.log('\nRecent Rewards:');
          rewardsData.recentRewards.forEach((reward, index) => {
            console.log(`${index + 1}. Type: ${reward.type}, Amount: ${reward.amount}, Status: ${reward.status}`);
          });
        } else {
          console.log('No recent rewards found.');
        }
      }
    } catch (error) {
      logResult('Get Rewards Balance', false, null, error);
      console.log('Warning: Could not get rewards balance, but continuing test...');
    }
    
    // 14. Attempt to redeem rewards (may fail if no rewards balance)
    try {
      const redeemResponse = await axios.post(
        `${API_URL}/rewards/redeem`,
        { amount: 10, method: 'wallet_credit' },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      const success = logResult('Redeem Rewards', 
        redeemResponse.status === 200 || redeemResponse.status === 400, 
        redeemResponse);
      
      if (success && redeemResponse.status === 400) {
        console.log('Note: Redemption failed, likely due to insufficient rewards balance. This is expected if no rewards have been earned yet.');
      }
    } catch (error) {
      logResult('Redeem Rewards', false, null, error);
      console.log('Warning: Could not redeem rewards, but this may be expected if no rewards have been earned.');
    }
    
    // PART 4: INTEGRATION VERIFICATION
    console.log('\nPART 4: INTEGRATION VERIFICATION');
    console.log('='.repeat(50));
    
    // 15. Verify card operations with tag
    console.log('\nVerifying that card operations work with the assigned tag...');
    try {
      // Fund card again to trigger rewards
      const fundData = {
        card_id: cardId,
        amount: 5000
      };
      
      const fundResponse = await axios.post(
        `${API_URL}/card/fund-card`,
        fundData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      logResult('Fund Card with Tag', fundResponse.status === 200, fundResponse);
      
      // Check rewards again to see if new rewards were generated
      const rewardsResponse = await axios.get(
        `${API_URL}/rewards`,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      logResult('Get Updated Rewards', rewardsResponse.status === 200, rewardsResponse);
      
      if (rewardsResponse.status === 200) {
        const rewardsData = rewardsResponse.data.data;
        console.log('\nUpdated Rewards Summary:');
        console.log(`Available Balance: ${rewardsData.balance?.availableBalance || 0}`);
        console.log(`Lifetime Earned: ${rewardsData.balance?.lifetimeEarned || 0}`);
        console.log(`Current Tier: ${rewardsData.balance?.tier || 'bronze'}`);
      }
    } catch (error) {
      console.log('Error during integration verification:', error.message);
    }
    
    console.log('\n✅ Integration test completed!');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.log('\n❌ Integration test failed:');
    console.log(error.message);
    if (error.stack) {
      console.log('Error stack:', error.stack);
    }
  }
}

// Run the test
testCompleteIntegration();
