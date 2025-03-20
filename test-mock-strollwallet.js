const axios = require('axios');
require('dotenv').config();

// Configuration
const API_URL = 'http://localhost:3000/api/bitvcard';
const PUBLIC_KEY = process.env.PUBLIC_KEY;

// Test the mock StrollWallet API
async function testMockStrollWalletAPI() {
  try {
    console.log('Testing Mock StrollWallet API');
    console.log('Using PUBLIC_KEY:', PUBLIC_KEY);
    
    // Test customer creation
    console.log('\nTesting customer creation...');
    const timestamp = Date.now();
    const customerData = {
      public_key: PUBLIC_KEY,
      firstName: 'John',
      lastName: 'Doe',
      customerEmail: `customer-${timestamp}@example.com`,
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
      idNumber: `PASS${timestamp}` // Use a unique ID number
    };
    
    console.log('Sending request to:', `${API_URL}/create-user`);
    
    const customerResponse = await axios.post(
      `${API_URL}/create-user`, 
      customerData,
      { 
        headers: { 
          'Content-Type': 'application/json'
        } 
      }
    );
    
    console.log('Customer creation response:', JSON.stringify(customerResponse.data, null, 2));
    
    // Get the customer ID from the response
    const customerEmail = customerResponse.data.response?.customerEmail;
    const customerId = customerResponse.data.response?.customerId;
    
    if (!customerId) {
      throw new Error('Failed to get customer ID');
    }
    
    console.log('Customer created with ID:', customerId);
    console.log('Customer email:', customerEmail);
    
    // Test card creation
    console.log('\nTesting card creation...');
    const cardData = {
      public_key: PUBLIC_KEY,
      name_on_card: 'John Doe',
      amount: 5000,
      customerEmail: customerEmail
    };
    
    const cardResponse = await axios.post(
      `${API_URL}/create-card`,
      cardData,
      { 
        headers: { 
          'Content-Type': 'application/json'
        } 
      }
    );
    
    console.log('Card creation response:', JSON.stringify(cardResponse.data, null, 2));
    
    const cardId = cardResponse.data.response?.card_id;
    if (!cardId) {
      throw new Error('Failed to get card ID');
    }
    
    console.log('Card created with ID:', cardId);
    
    // Test card funding
    console.log('\nTesting card funding...');
    const fundData = {
      public_key: PUBLIC_KEY,
      card_id: cardId,
      amount: 10000
    };
    
    const fundResponse = await axios.post(
      `${API_URL}/fund-card`,
      fundData,
      { 
        headers: { 
          'Content-Type': 'application/json'
        } 
      }
    );
    
    console.log('Card funding response:', JSON.stringify(fundResponse.data, null, 2));
    
    // Test card details
    console.log('\nTesting card details...');
    const detailsData = {
      public_key: PUBLIC_KEY,
      card_id: cardId
    };
    
    const detailsResponse = await axios.post(
      `${API_URL}/fetch-card-detail`,
      detailsData,
      { 
        headers: { 
          'Content-Type': 'application/json'
        } 
      }
    );
    
    console.log('Card details response:', JSON.stringify(detailsResponse.data, null, 2));
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.log('\n❌ Test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      console.log('Headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.log('No response received');
      console.log('Request:', error.request);
    } else {
      console.log('Error message:', error.message);
      console.log('Error stack:', error.stack);
    }
  }
}

// Run the test
testMockStrollWalletAPI();
