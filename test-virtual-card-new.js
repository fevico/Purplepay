const axios = require('axios');
const fs = require('fs');
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

// Test the virtual card API
async function testVirtualCardAPI() {
  try {
    console.log('\nTesting Virtual Card API with token from file');
    
    // Test customer creation
    console.log('\n1. Testing customer creation...');
    const timestamp = Date.now();
    const customerData = {
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
    
    console.log('Sending request to:', `${API_URL}/api/card/create-customer`);
    
    const customerResponse = await axios.post(
      `${API_URL}/api/card/create-customer`, 
      customerData,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Customer creation response:', customerResponse.data);
    
    // Extract customer ID
    const customerId = customerResponse.data.customerId;
    if (!customerId) {
      throw new Error('Failed to get customer ID');
    }
    
    // Extract customer email for card creation
    const customerEmail = customerData.customerEmail;
    
    console.log('✅ Customer created with ID:', customerId);
    console.log('✅ Customer email:', customerEmail);
    
    // Test card creation
    console.log('\n2. Testing card creation...');
    const cardData = {
      name_on_card: 'John Doe',
      amount: 5000,
      customerEmail: customerEmail
    };
    
    console.log('Sending request to:', `${API_URL}/api/card/create-card`);
    console.log('With data:', JSON.stringify(cardData, null, 2));
    
    const cardResponse = await axios.post(
      `${API_URL}/api/card/create-card`,
      cardData,
      { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Card creation response:', cardResponse.data);
    
    // Extract card ID and details
    const cardId = cardResponse.data.card_id;
    const cardNumber = cardResponse.data.card_number;
    const expiryMonth = cardResponse.data.expiry_month;
    const expiryYear = cardResponse.data.expiry_year;
    const cvv = cardResponse.data.cvv;
    
    if (!cardId) {
      throw new Error('Failed to get card ID');
    }
    
    console.log('✅ Card created with ID:', cardId);
    console.log('✅ Card Number:', cardNumber);
    console.log('✅ Expiry Month:', expiryMonth);
    console.log('✅ Expiry Year:', expiryYear);
    console.log('✅ CVV:', cvv);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.log('\n❌ Test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      console.log('Headers:', error.response.headers);
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
testVirtualCardAPI();
