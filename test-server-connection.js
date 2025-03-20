// Simple script to test if the server is running
const axios = require('axios');

async function testConnection() {
  try {
    console.log('Testing connection to backend server...');
    const response = await axios.get('http://localhost:9878/health');
    console.log('Response:', response.status, response.data);
    console.log('✅ Server is running');
  } catch (error) {
    console.error('❌ Error connecting to server:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }

  try {
    console.log('\nTesting connection to mock server...');
    const response = await axios.get('http://localhost:3000/health');
    console.log('Response:', response.status, response.data);
    console.log('✅ Mock server is running');
  } catch (error) {
    console.error('❌ Error connecting to mock server:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
  }
}

testConnection();
