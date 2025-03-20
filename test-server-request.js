const axios = require('axios');

async function testServer() {
  try {
    const response = await axios.get('http://localhost:9882/test');
    console.log('Server response:', response.data);
  } catch (error) {
    console.error('Error testing server:', error.message);
  }
}

testServer();
