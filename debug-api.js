const axios = require('axios');
const fs = require('fs');

// Set environment variables
process.env.PUBLIC_KEY = 'test-key';
process.env.PRIVATE_KEY = 'test-secret';

// Configuration
const API_URL = 'http://localhost:9877';
const MOCK_API_URL = 'http://localhost:3000';

// Read token from file
let token;
try {
  token = fs.readFileSync('simple-token.txt', 'utf8').trim();
  console.log('Token loaded from file:', token.substring(0, 20) + '...');
} catch (error) {
  console.error('Error reading token file:', error.message);
  process.exit(1);
}

async function debugAPI() {
  try {
    console.log('\nDebugging API connections');
    
    // Test direct connection to mock server
    console.log('\n1. Testing direct connection to mock server...');
    const mockResponse = await axios.get(MOCK_API_URL);
    console.log('Mock server response:', mockResponse.data);
    
    // Test customer creation via backend
    console.log('\n2. Testing customer creation via backend...');
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
      idNumber: `PASS${timestamp}`
    };
    
    const customerResponse = await axios.post(
      `${API_URL}/card/create-customer`, 
      customerData,
      { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Customer creation response:', JSON.stringify(customerResponse.data, null, 2));
    
    if (customerResponse.data.success) {
      const customerEmail = customerResponse.data.response.customerEmail;
      
      // Test direct connection to StrollWallet API via our backend
      console.log('\n3. Testing direct connection to StrollWallet API...');
      try {
        const response = await axios.post(
          `${MOCK_API_URL}/api/bitvcard/create-card`,
          {
            public_key: 'test-key',
            name_on_card: 'John Doe',
            card_type: 'visa',
            amount: 5000,
            customerEmail,
            mode: 'sandbox'
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Direct StrollWallet response:', JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.error('Error connecting directly to StrollWallet:', 
          error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
      }
      
      // Test card creation via backend
      console.log('\n4. Testing card creation via backend...');
      try {
        const cardResponse = await axios.post(
          `${API_URL}/card/create-card`,
          {
            name_on_card: 'John Doe',
            amount: 5000,
            customerEmail
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Card creation response:', JSON.stringify(cardResponse.data, null, 2));
      } catch (error) {
        console.error('Error creating card via backend:', 
          error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
        
        if (error.response && error.response.status === 403) {
          console.log('\nDEBUG: Checking backend logs...');
          console.log('Make sure the backend is using the correct PUBLIC_KEY');
          console.log('Current PUBLIC_KEY in environment:', process.env.PUBLIC_KEY);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

debugAPI();
