const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration
const API_URL = 'http://localhost:9877';
const USER_ID = '67da9f93ff21f937aa28f92b'; // User ID from verification
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_here';

// Generate token
const token = jwt.sign(
  { userId: USER_ID, exp: Math.floor(Date.now() / 1000) + 3600 },
  SECRET_KEY,
  { expiresIn: "1h" }
);

// Test the virtual card API
async function testVirtualCardAPI() {
  try {
    console.log('Testing Virtual Card API with token:', token.substring(0, 20) + '...');
    
    // Test customer creation
    console.log('\nTesting customer creation...');
    const customerData = {
      firstName: 'John',
      lastName: 'Doe',
      customerEmail: `customer-${Date.now()}@example.com`,
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
      idNumber: '12345678901'
    };
    
    const customerResponse = await axios.post(
      `${API_URL}/card/create-customer`, 
      customerData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Customer creation response:', JSON.stringify(customerResponse.data, null, 2));
    
    const customerId = customerResponse.data.response?.bitvcard_customer_id;
    if (!customerId) {
      throw new Error('Failed to get customer ID');
    }
    
    // Test card creation
    console.log('\nTesting card creation...');
    const cardData = {
      name_on_card: 'John Doe',
      amount: 5000,
      customerEmail: customerData.customerEmail
    };
    
    const cardResponse = await axios.post(
      `${API_URL}/card/create-card`,
      cardData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Card creation response:', JSON.stringify(cardResponse.data, null, 2));
    
    const cardId = cardResponse.data.response?.card_id;
    if (!cardId) {
      throw new Error('Failed to get card ID');
    }
    
    // Test card funding
    console.log('\nTesting card funding...');
    const fundData = {
      card_id: cardId,
      amount: 10000
    };
    
    const fundResponse = await axios.post(
      `${API_URL}/card/fund-card`,
      fundData,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Card funding response:', JSON.stringify(fundResponse.data, null, 2));
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Request:', error.request._currentUrl || error.request);
      console.error('Error code:', error.code);
    } else {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

// Run the test
testVirtualCardAPI();
