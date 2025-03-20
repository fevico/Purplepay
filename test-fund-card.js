/**
 * Simple script to test funding a virtual card
 */
const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:9876';
let authToken;

// Read token from file if it exists
try {
  authToken = fs.existsSync('test-token.txt') 
    ? fs.readFileSync('test-token.txt', 'utf8').trim()
    : null;
  
  if (!authToken) {
    console.error('❌ No authentication token found. Please generate one first.');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error reading token file:', error.message);
  process.exit(1);
}

// API client with authentication
const api = {
  post: async (endpoint, data) => {
    try {
      console.log(`📤 Sending request to ${endpoint}:`, JSON.stringify(data, null, 2));
      const response = await axios.post(`${API_URL}${endpoint}`, data, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        console.error(`❌ Request failed with status ${error.response.status}`);
        console.error('Error details:', error.response.data);
        return { error: true, ...error.response.data };
      } else {
        console.error('❌ Request failed:', error.message);
        return { error: true, message: error.message };
      }
    }
  }
};

// Function to test card funding
const testFundCard = async (cardId) => {
  console.log('\n🔄 Testing fund card functionality...');
  
  if (!cardId) {
    console.error('❌ No card ID provided. Please specify a card ID to fund.');
    return false;
  }
  
  try {
    const fundData = {
      card_id: cardId,
      amount: 5000 // 5000 in the smallest currency unit (e.g., cents, kobo)
    };
    
    console.log('💰 Attempting to fund card with ID:', cardId);
    const response = await api.post('/card/fund-card', fundData);
    
    if (response.error) {
      console.error('❌ Fund card failed:', response.message || 'Unknown error');
      return false;
    }
    
    console.log('✅ Card funded successfully!');
    console.log('📊 Response:', JSON.stringify(response, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Fund card test error:', error.message);
    return false;
  }
};

// Function to get card details
const getCardDetails = async (cardId) => {
  console.log('\n🔍 Getting card details...');
  
  if (!cardId) {
    console.error('❌ No card ID provided. Please specify a card ID.');
    return false;
  }
  
  try {
    const response = await api.post('/card/card-details', { card_id: cardId });
    
    if (response.error) {
      console.error('❌ Get card details failed:', response.message || 'Unknown error');
      return false;
    }
    
    console.log('✅ Card details retrieved successfully!');
    console.log('💳 Card Details:', JSON.stringify(response, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Get card details error:', error.message);
    return false;
  }
};

// Main function
const main = async () => {
  // Get card ID from command line arguments
  const cardId = process.argv[2];
  
  if (!cardId) {
    console.error('❌ Please provide a card ID as a command line argument.');
    console.log('Usage: node test-fund-card.js <card_id>');
    process.exit(1);
  }
  
  // First get card details
  await getCardDetails(cardId);
  
  // Then try to fund the card
  const result = await testFundCard(cardId);
  
  if (result) {
    // Get updated card details after funding
    await getCardDetails(cardId);
  }
  
  console.log('\n🏁 Test completed.');
};

// Run the main function
main().catch(error => {
  console.error('❌ Unhandled error:', error.message);
});
