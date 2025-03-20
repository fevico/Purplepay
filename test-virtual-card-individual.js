const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';

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

// Test create customer endpoint
const testCreateCustomer = async () => {
  log('Testing POST /virtualCard/create-customer');
  
  const customerData = { 
    firstName: 'John', 
    lastName: 'Doe',
    customerEmail: `john.doe.${Date.now()}@example.com`,
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
  
  try {
    const response = await axios.post(`${API_URL}/virtualCard/create-customer`, customerData);
    log('Response', response.data);
    return {
      customerId: response.data.response?.bitvcard_customer_id,
      customerEmail: customerData.customerEmail
    };
  } catch (error) {
    if (error.response) {
      log('Error response', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      log('Error', error.message);
    }
    return null;
  }
};

// Test create card endpoint
const testCreateCard = async (customerData) => {
  log('Testing POST /virtualCard/create-card');
  
  if (!customerData || !customerData.customerEmail) {
    log('Cannot create card: No customer email provided');
    return null;
  }
  
  const cardData = {
    name_on_card: 'John Doe',
    amount: 5000,
    customerEmail: customerData.customerEmail
  };
  
  try {
    const response = await axios.post(`${API_URL}/virtualCard/create-card`, cardData);
    log('Response', response.data);
    return response.data.response?.card_id || null;
  } catch (error) {
    if (error.response) {
      log('Error response', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      log('Error', error.message);
    }
    return null;
  }
};

// Test card details endpoint
const testCardDetails = async (cardId) => {
  log('Testing POST /virtualCard/card-details');
  
  if (!cardId) {
    log('Cannot get card details: No card ID provided');
    return false;
  }
  
  const requestData = {
    card_id: cardId
  };
  
  try {
    const response = await axios.post(`${API_URL}/virtualCard/card-details`, requestData);
    log('Response', response.data);
    return true;
  } catch (error) {
    if (error.response) {
      log('Error response', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      log('Error', error.message);
    }
    return false;
  }
};

// Test fund card endpoint
const testFundCard = async (cardId) => {
  log('Testing POST /virtualCard/fund-card');
  
  if (!cardId) {
    log('Cannot fund card: No card ID provided');
    return false;
  }
  
  const fundData = {
    card_id: cardId,
    amount: 2000
  };
  
  try {
    const response = await axios.post(`${API_URL}/virtualCard/fund-card`, fundData);
    log('Response', response.data);
    return true;
  } catch (error) {
    if (error.response) {
      log('Error response', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      log('Error', error.message);
    }
    return false;
  }
};

// Test freeze/unfreeze card endpoint
const testFreezeUnfreezeCard = async (cardId) => {
  log('Testing POST /virtualCard/freeze-unfreze-card');
  
  if (!cardId) {
    log('Cannot freeze/unfreeze card: No card ID provided');
    return false;
  }
  
  // First test freezing the card
  const freezeData = {
    card_id: cardId,
    action: 'freeze'
  };
  
  try {
    const freezeResponse = await axios.post(`${API_URL}/virtualCard/freeze-unfreze-card`, freezeData);
    log('Freeze Response', freezeResponse.data);
    
    // Then test unfreezing the card
    const unfreezeData = {
      card_id: cardId,
      action: 'unfreeze'
    };
    
    const unfreezeResponse = await axios.post(`${API_URL}/virtualCard/freeze-unfreze-card`, unfreezeData);
    log('Unfreeze Response', unfreezeResponse.data);
    
    return true;
  } catch (error) {
    if (error.response) {
      log('Error response', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      log('Error', error.message);
    }
    return false;
  }
};

// Test card transactions endpoint
const testCardTransactions = async (cardId) => {
  log('Testing POST /virtualCard/card-transactions');
  
  if (!cardId) {
    log('Cannot get card transactions: No card ID provided');
    return false;
  }
  
  const requestData = {
    card_id: cardId
  };
  
  try {
    const response = await axios.post(`${API_URL}/virtualCard/card-transactions`, requestData);
    log('Response', response.data);
    return true;
  } catch (error) {
    if (error.response) {
      log('Error response', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      log('Error', error.message);
    }
    return false;
  }
};

// Test card history endpoint
const testCardHistory = async (cardId) => {
  log('Testing GET /virtualCard/card-history');
  
  if (!cardId) {
    log('Cannot get card history: No card ID provided');
    return false;
  }
  
  try {
    const response = await axios.get(`${API_URL}/virtualCard/card-history?card_id=${cardId}`);
    log('Response', response.data);
    return true;
  } catch (error) {
    if (error.response) {
      log('Error response', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      log('Error', error.message);
    }
    return false;
  }
};

// Test withdraw from card endpoint
const testWithdrawFromCard = async (cardId) => {
  log('Testing POST /virtualCard/withdraw-from-card');
  
  if (!cardId) {
    log('Cannot withdraw from card: No card ID provided');
    return false;
  }
  
  const withdrawData = {
    card_id: cardId,
    amount: 1000
  };
  
  try {
    const response = await axios.post(`${API_URL}/virtualCard/withdraw-from-card`, withdrawData);
    log('Response', response.data);
    return true;
  } catch (error) {
    if (error.response) {
      log('Error response', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      log('Error', error.message);
    }
    return false;
  }
};

// Test authentication requirement
const testAuthRequirement = async () => {
  log('Testing authentication requirement');
  
  // Create a test customer data
  const customerData = { 
    firstName: 'John', 
    lastName: 'Doe',
    customerEmail: `john.doe.${Date.now()}@example.com`,
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
  
  try {
    // Try to access an endpoint that requires authentication without a token
    const response = await axios.post(`${API_URL}/virtualCard/create-customer`, customerData);
    
    log('Response (should have failed with 401)', response.data);
    
    // If we get here, authentication is not properly enforced
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log('Authentication requirement verified: Received 401 Unauthorized', {
        status: error.response.status,
        data: error.response.data
      });
      return true;
    } else {
      log('Unexpected error', {
        status: error.response ? error.response.status : 'No response',
        data: error.response ? error.response.data : error.message
      });
      return false;
    }
  }
};

// Run individual tests
const runIndividualTests = async () => {
  log('Starting individual tests for Virtual Card API');
  
  // Test authentication requirement
  const authResult = await testAuthRequirement();
  log('Authentication requirement test result', { success: authResult });
  
  // Test customer creation
  const customerData = await testCreateCustomer();
  if (!customerData) {
    log('Cannot proceed with card tests: Customer creation failed');
    return;
  }
  
  // Test card creation
  const cardId = await testCreateCard(customerData);
  if (!cardId) {
    log('Cannot proceed with card operation tests: Card creation failed');
    return;
  }
  
  // Test card operations
  await testCardDetails(cardId);
  await testFundCard(cardId);
  await testFreezeUnfreezeCard(cardId);
  await testCardTransactions(cardId);
  await testCardHistory(cardId);
  await testWithdrawFromCard(cardId);
  
  log('Individual tests completed');
};

// Run the tests
runIndividualTests().catch(error => {
  log('Test execution failed', error.message);
});
