const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876';
let authToken = null;

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

// Register a new user
const registerUser = async () => {
  log('Registering a new user');
  
  const userData = {
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: 'Password123!'
  };
  
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    log('Registration response', response.data);
    return response.data;
  } catch (error) {
    if (error.response) {
      log('Registration error', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      log('Registration error', error.message);
    }
    return null;
  }
};

// Login with user credentials
const loginUser = async (email, password) => {
  log('Logging in user');
  
  const loginData = {
    email,
    password
  };
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, loginData);
    log('Login response', response.data);
    authToken = response.data.token;
    return response.data;
  } catch (error) {
    if (error.response) {
      log('Login error', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      log('Login error', error.message);
    }
    return null;
  }
};

// Create an authenticated API client
const createAuthClient = () => {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });
};

// Test create customer endpoint
const testCreateCustomer = async () => {
  log('Testing POST /card/create-customer with authentication');
  
  if (!authToken) {
    log('Authentication token not available');
    return null;
  }
  
  const client = createAuthClient();
  
  const customerData = { 
    firstName: 'John', 
    lastName: 'Doe',
    customerEmail: 'john.doe@example.com',
    idNumber: '12345678901',
    phoneNumber: '08012345678',
    zipCode: '100001',
    line1: '123 Test Street',
    houseNumber: '123',
    idImage: 'base64encodedimage',
    userPhoto: 'base64encodedphoto',
    dateOfBirth: '1990-01-01',
    city: 'Lagos',
    state: 'Lagos',
    country: 'Nigeria'
  };
  
  try {
    const response = await client.post('/card/create-customer', customerData);
    log('Response', response.data);
    return response.data.customerId || null;
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
const testCreateCard = async (customerId) => {
  log('Testing POST /card/create-card with authentication');
  
  if (!authToken) {
    log('Authentication token not available');
    return null;
  }
  
  const client = createAuthClient();
  
  const cardData = { 
    customerId: customerId || 'test-customer-id',
    name_on_card: 'John Doe',
    currency: 'NGN',
    amount: 5000
  };
  
  try {
    const response = await client.post('/card/create-card', cardData);
    log('Response', response.data);
    return response.data.cardId || null;
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
  log('Testing POST /card/card-details with authentication');
  
  if (!authToken) {
    log('Authentication token not available');
    return false;
  }
  
  const client = createAuthClient();
  
  const data = { 
    card_id: cardId || 'test-card-id'
  };
  
  try {
    const response = await client.post('/card/card-details', data);
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
  log('Testing POST /card/fund-card with authentication');
  
  if (!authToken) {
    log('Authentication token not available');
    return false;
  }
  
  const client = createAuthClient();
  
  const data = { 
    card_id: cardId || 'test-card-id',
    amount: 5000
  };
  
  try {
    const response = await client.post('/card/fund-card', data);
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
  log('Testing POST /card/freeze-unfreze-card (freeze) with authentication');
  
  if (!authToken) {
    log('Authentication token not available');
    return false;
  }
  
  const client = createAuthClient();
  
  const freezeData = { 
    card_id: cardId || 'test-card-id',
    action: 'freeze'
  };
  
  try {
    const freezeResponse = await client.post('/card/freeze-unfreze-card', freezeData);
    log('Freeze Response', freezeResponse.data);
    
    log('Testing POST /card/freeze-unfreze-card (unfreeze) with authentication');
    
    const unfreezeData = { 
      card_id: cardId || 'test-card-id',
      action: 'unfreeze'
    };
    
    const unfreezeResponse = await client.post('/card/freeze-unfreze-card', unfreezeData);
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
  log('Testing POST /card/card-transactions with authentication');
  
  if (!authToken) {
    log('Authentication token not available');
    return false;
  }
  
  const client = createAuthClient();
  
  const data = { 
    card_id: cardId || 'test-card-id'
  };
  
  try {
    const response = await client.post('/card/card-transactions', data);
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
  log('Testing GET /card/card-history with authentication');
  
  if (!authToken) {
    log('Authentication token not available');
    return false;
  }
  
  const client = createAuthClient();
  
  try {
    const response = await client.get('/card/card-history', {
      params: {
        card_id: cardId || 'test-card-id'
      }
    });
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
  log('Testing POST /card/withdraw-from-card with authentication');
  
  if (!authToken) {
    log('Authentication token not available');
    return false;
  }
  
  const client = createAuthClient();
  
  const data = { 
    card_id: cardId || 'test-card-id',
    amount: 1000
  };
  
  try {
    const response = await client.post('/card/withdraw-from-card', data);
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
  
  // Try to access an endpoint that should require authentication
  try {
    await axios.post(`${API_URL}/card/create-customer`, {
      firstName: 'John',
      lastName: 'Doe'
    });
    log('Authentication not required for create-customer endpoint');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401 || error.response.status === 403) {
      log('Authentication required for create-customer endpoint');
      return true;
    } else {
      log('Unexpected error', error.response ? error.response.data : error.message);
      return false;
    }
  }
};

// Run tests with authentication
const runAuthenticatedTests = async () => {
  log('Starting authenticated tests for Virtual Card API endpoints');
  
  // Test authentication requirement
  await testAuthRequirement();
  
  // Register and login
  const registrationResult = await registerUser();
  
  if (registrationResult) {
    await loginUser(registrationResult.email, 'Password123!');
  } else {
    // If registration fails, try to login with existing credentials
    await loginUser('test@example.com', 'Password123!');
  }
  
  if (!authToken) {
    log('Could not authenticate. Aborting tests.');
    return;
  }
  
  // Test create customer
  const customerId = await testCreateCustomer();
  
  // Test create card
  const cardId = await testCreateCard(customerId);
  
  // Test card operations
  await testCardDetails(cardId);
  await testFundCard(cardId);
  await testFreezeUnfreezeCard(cardId);
  await testCardTransactions(cardId);
  await testCardHistory(cardId);
  await testWithdrawFromCard(cardId);
  
  log('Authenticated tests completed');
};

// Run the tests
runAuthenticatedTests().catch(error => {
  log('Test execution failed', error.message);
});
