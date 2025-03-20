const axios = require('axios');

const API_URL = 'http://localhost:9876';

async function testServer() {
  try {
    console.log('Testing server connection...');
    const response = await axios.get(`${API_URL}/`);
    console.log('Server response:', response.status, response.data);
  } catch (error) {
    if (error.response) {
      console.log('Server responded with error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.log('No response received:', error.code);
    } else {
      console.log('Error setting up request:', error.message);
    }
  }
}

async function testAuthEndpoint() {
  try {
    console.log('\nTesting auth endpoint...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('Auth response:', response.status, response.data);
  } catch (error) {
    if (error.response) {
      console.log('Auth endpoint responded with error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.log('No response received from auth endpoint:', error.code);
    } else {
      console.log('Error setting up auth request:', error.message);
    }
  }
}

async function testBillsPaymentEndpoint() {
  try {
    console.log('\nTesting bills payment endpoint without auth...');
    const response = await axios.get(`${API_URL}/billsPayment/history`);
    console.log('Bills payment response:', response.status, response.data);
  } catch (error) {
    if (error.response) {
      console.log('Bills payment endpoint responded with error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.log('No response received from bills payment endpoint:', error.code);
    } else {
      console.log('Error setting up bills payment request:', error.message);
    }
  }
}

async function main() {
  await testServer();
  await testAuthEndpoint();
  await testBillsPaymentEndpoint();
}

main().catch(error => {
  console.error('Unhandled error:', error);
});
