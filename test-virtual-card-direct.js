const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration
const API_URL = 'http://localhost:9876';
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_here';
const USER_ID = '67da375af4727658a76cfe33'; // User ID from previous test

// Generate a fresh token
const generateToken = () => {
  return jwt.sign(
    { userId: USER_ID },
    SECRET_KEY,
    { expiresIn: '1h' }
  );
};

// Use the generated token
const authToken = generateToken();

// Simple logging function
const log = (message, data = null) => {
  console.log('\n' + '='.repeat(80));
  console.log(message);
  if (data) {
    console.log('-'.repeat(40));
    console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  }
  console.log('='.repeat(80) + '\n');
};

// API client with authentication
const api = {
  get: async (endpoint, params = {}) => {
    try {
      const response = await axios.get(`${API_URL}${endpoint}`, {
        params,
        headers: { Authorization: `Bearer ${authToken}` }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error);
    }
  },
  post: async (endpoint, data = {}) => {
    try {
      const response = await axios.post(`${API_URL}${endpoint}`, data, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleError(error);
    }
  }
};

// Error handler
const handleError = (error) => {
  if (error.response) {
    return {
      success: false,
      status: error.response.status,
      data: error.response.data
    };
  } else if (error.request) {
    return {
      success: false,
      message: 'No response received from server',
      request: error.request
    };
  } else {
    return {
      success: false,
      message: error.message
    };
  }
};

// Test creating a virtual card customer
const testCreateCustomer = async () => {
  log('Creating Virtual Card Customer');
  
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
  
  log('Customer Data', customerData);
  
  const response = await api.post('/card/create-customer', customerData);
  
  log('Create Customer Response', response);
  
  if (response.success && response.data.response && response.data.response.bitvcard_customer_id) {
    const customerId = response.data.response.bitvcard_customer_id;
    log('Customer Created Successfully', { customerId });
    return customerId;
  } else {
    log('Failed to Create Customer');
    return null;
  }
};

// Test creating a virtual card
const testCreateCard = async (customerEmail) => {
  if (!customerEmail) {
    log('Cannot create card: No customer email provided');
    return null;
  }
  
  log('Creating Virtual Card');
  
  const cardData = {
    name_on_card: 'John Doe',
    amount: 5000,
    customerEmail
  };
  
  log('Card Data', cardData);
  
  const response = await api.post('/card/create-card', cardData);
  
  log('Create Card Response', response);
  
  if (response.success && response.data.response && response.data.response.card_id) {
    const cardId = response.data.response.card_id;
    log('Card Created Successfully', { cardId });
    return cardId;
  } else {
    log('Failed to Create Card');
    return null;
  }
};

// Test funding a virtual card
const testFundCard = async (cardId) => {
  if (!cardId) {
    log('Cannot fund card: No card ID provided');
    return false;
  }
  
  log('Funding Virtual Card');
  
  const fundData = {
    card_id: cardId,
    amount: 10000
  };
  
  log('Fund Data', fundData);
  
  const response = await api.post('/card/fund-card', fundData);
  
  log('Fund Card Response', response);
  
  if (response.success) {
    log('Card Funded Successfully');
    return true;
  } else {
    log('Failed to Fund Card');
    return false;
  }
};

// Test getting card details
const testCardDetails = async (cardId) => {
  if (!cardId) {
    log('Cannot get card details: No card ID provided');
    return false;
  }
  
  log('Getting Card Details');
  
  const response = await api.post('/card/card-details', { card_id: cardId });
  
  log('Card Details Response', response);
  
  if (response.success) {
    log('Card Details Retrieved Successfully');
    return true;
  } else {
    log('Failed to Get Card Details');
    return false;
  }
};

// Run all tests
const runTests = async () => {
  log('Starting Virtual Card API Tests');
  log('Using Generated Token', authToken);
  
  // Create customer
  const customerEmail = await testCreateCustomer();
  
  if (!customerEmail) {
    log('Cannot proceed with tests: Customer creation failed');
    return;
  }
  
  // Create card
  const cardId = await testCreateCard(customerEmail);
  
  if (!cardId) {
    log('Cannot proceed with tests: Card creation failed');
    return;
  }
  
  // Get card details
  await testCardDetails(cardId);
  
  // Fund card
  await testFundCard(cardId);
  
  // Get updated card details
  await testCardDetails(cardId);
  
  log('All tests completed');
};

// Run the tests
runTests().catch(error => {
  log('Test execution failed', error.message);
});
