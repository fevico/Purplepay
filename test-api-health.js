const axios = require('axios');

async function checkApiHealth() {
  try {
    console.log('Checking API health...');
    const response = await axios.get('http://localhost:9876/health');
    console.log('API Health Status:', response.data);
    console.log('API is running correctly!');
  } catch (error) {
    console.error('Error checking API health:', error.message);
  }
}

checkApiHealth();
