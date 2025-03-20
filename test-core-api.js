const axios = require('axios');

const API_URL = 'http://localhost:9879/api';
let token;

// Test registration
async function testRegistration() {
  try {
    const userData = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'Password123',
      phoneNumber: 1234567890,
      country: 'Nigeria'
    };
    
    console.log('Registering user:', userData.email);
    
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    console.log('Registration response:', response.data);
    
    token = response.data.token;
    return token;
  } catch (error) {
    console.error('Registration error:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test login
async function testLogin(email, password) {
  try {
    console.log('Logging in user:', email);
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    console.log('Login response:', response.data);
    
    token = response.data.token;
    return token;
  } catch (error) {
    console.error('Login error:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test profile
async function testProfile() {
  try {
    console.log('Getting user profile');
    
    const response = await axios.get(`${API_URL}/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Profile response:', response.data);
  } catch (error) {
    console.error('Profile error:', error.response ? error.response.data : error.message);
  }
}

// Test tag suggestions
async function testTagSuggestions() {
  try {
    console.log('Getting tag suggestions');
    
    const response = await axios.get(`${API_URL}/tag/suggestions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Tag suggestions response:', response.data);
  } catch (error) {
    console.error('Tag suggestions error:', error.response ? error.response.data : error.message);
  }
}

// Run tests
async function runTests() {
  // Register new user
  const registrationToken = await testRegistration();
  
  if (registrationToken) {
    // Test profile with registration token
    await testProfile();
    
    // Test tag suggestions
    await testTagSuggestions();
  }
}

runTests();
