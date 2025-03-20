const axios = require('axios');

const API_URL = 'http://localhost:9883/api';
let token;
let testTag;

// Test registration with tag
async function testRegistrationWithTag() {
  try {
    const randomNum = Date.now();
    testTag = `testuser${randomNum % 1000}`;
    
    const userData = {
      name: 'Test User',
      email: `test${randomNum}@example.com`,
      password: 'Password123',
      phoneNumber: 1234567890,
      country: 'Nigeria',
      tag: testTag
    };
    
    console.log('Registering user with tag:', testTag);
    
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    console.log('Registration response:', response.data);
    
    token = response.data.token;
    return token;
  } catch (error) {
    console.error('Registration error:', error.response ? error.response.data : error.message);
    return null;
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

// Test tag availability check
async function testTagAvailability() {
  try {
    console.log('Checking tag availability');
    
    // Check existing tag (should be unavailable)
    const response1 = await axios.post(`${API_URL}/tag/check`, {
      tag: testTag
    });
    
    console.log('Existing tag check response:', response1.data);
    
    // Check new tag (should be available)
    const response2 = await axios.post(`${API_URL}/tag/check`, {
      tag: `newtag${Date.now() % 1000}`
    });
    
    console.log('New tag check response:', response2.data);
  } catch (error) {
    console.error('Tag availability check error:', error.response ? error.response.data : error.message);
  }
}

// Test updating tag privacy
async function testUpdateTagPrivacy() {
  try {
    console.log('Updating tag privacy');
    
    const response = await axios.put(`${API_URL}/tag/privacy`, {
      privacy: 'friends'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Tag privacy update response:', response.data);
  } catch (error) {
    console.error('Tag privacy update error:', error.response ? error.response.data : error.message);
  }
}

// Test finding user by tag
async function testFindUserByTag() {
  try {
    console.log('Finding user by tag:', testTag);
    
    const response = await axios.get(`${API_URL}/user/by-tag/${testTag}`);
    
    console.log('Find user by tag response:', response.data);
  } catch (error) {
    console.error('Find user by tag error:', error.response ? error.response.data : error.message);
  }
}

// Run tests
async function runTests() {
  // Register new user with tag
  const registrationToken = await testRegistrationWithTag();
  
  if (registrationToken) {
    // Test tag suggestions
    await testTagSuggestions();
    
    // Test tag availability
    await testTagAvailability();
    
    // Test updating tag privacy
    await testUpdateTagPrivacy();
    
    // Test finding user by tag
    await testFindUserByTag();
  }
}

runTests();
