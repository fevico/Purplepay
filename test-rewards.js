const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Load token from file
const tokenPath = path.join(__dirname, 'auth-token.txt');
let token;

try {
  token = fs.readFileSync(tokenPath, 'utf8').trim();
  console.log('Token loaded from file:', token.substring(0, 20) + '...');
} catch (error) {
  console.error('Error loading token:', error.message);
  process.exit(1);
}

const API_URL = 'http://localhost:9877/api';

// Test rewards endpoints
async function testRewards() {
  try {
    // Get user rewards
    const rewardsResponse = await axios.get(`${API_URL}/rewards`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Rewards response:', JSON.stringify(rewardsResponse.data, null, 2));
    
    // Test tag endpoints
    const tagResponse = await axios.get(`${API_URL}/tag/suggestions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Tag suggestions response:', JSON.stringify(tagResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error testing rewards:', error.response ? error.response.data : error.message);
  }
}

testRewards();
