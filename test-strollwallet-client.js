// Test script for StrollWallet client
const axios = require('axios');

// Set environment variables
process.env.PUBLIC_KEY = 'test-key';
process.env.PRIVATE_KEY = 'test-secret';

// Configuration
const BASE_URL = 'http://localhost:3000/api/bitvcard';

// StrollWallet client
class StrollwalletClient {
  constructor(publicKey, baseUrl) {
    this.publicKey = publicKey;
    this.baseUrl = baseUrl;
  }
  
  async makeRequest(method, endpoint, params) {
    try {
      console.log(`Making ${method} request to ${this.baseUrl}${endpoint}`);
      console.log('With params:', JSON.stringify(params, null, 2));
      
      const url = `${this.baseUrl}${endpoint}`;
      let response;
      
      if (method === 'GET') {
        response = await axios.get(url, { params });
      } else {
        response = await axios.post(url, params);
      }
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      return response.data;
    } catch (error) {
      console.error('Error making request:', 
        error.response ? JSON.stringify(error.response.data, null, 2) : error.message);
      throw {
        status: error.response ? error.response.status : 500,
        message: error.response ? error.response.data.message : error.message,
        error: error.response ? error.response.data : error
      };
    }
  }
  
  async createCustomer(customerData) {
    const endpoint = '/create-user';
    
    const params = {
      public_key: this.publicKey,
      ...customerData
    };
    
    return this.makeRequest('POST', endpoint, params);
  }
  
  async createCard(cardData) {
    const endpoint = '/create-card';
    
    const params = {
      public_key: this.publicKey,
      name_on_card: cardData.name_on_card,
      card_type: 'visa',
      amount: cardData.amount,
      customerEmail: cardData.customerEmail,
      mode: 'sandbox'
    };
    
    return this.makeRequest('POST', endpoint, params);
  }
}

// Test the client
async function testClient() {
  try {
    console.log('Testing StrollWallet client');
    const client = new StrollwalletClient(process.env.PUBLIC_KEY, BASE_URL);
    
    // Create customer
    console.log('\n1. Creating customer...');
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
    
    const customerResponse = await client.createCustomer(customerData);
    
    if (customerResponse.success) {
      // Create card
      console.log('\n2. Creating card...');
      const cardData = {
        name_on_card: 'John Doe',
        amount: 5000,
        customerEmail: customerData.customerEmail
      };
      
      const cardResponse = await client.createCard(cardData);
      console.log('Card created:', cardResponse);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testClient();
