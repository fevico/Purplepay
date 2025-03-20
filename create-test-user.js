const axios = require('axios');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const API_URL = 'http://localhost:9876'; // Updated to use port 9876

// Utility function to prompt user
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createUser() {
  try {
    console.log('=== Create Test User ===');
    
    const email = await prompt('Enter email for test user: ');
    const password = await prompt('Enter password for test user: ');
    
    console.log(`Creating user with email: ${email}`);
    
    const response = await axios.post(`${API_URL}/auth/create`, {
      email,
      password,
      name: 'Test User'
    });
    
    console.log('\n=== User Creation Response ===');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.token) {
      console.log('\n=== Verifying User ===');
      const verifyResponse = await axios.post(`${API_URL}/auth/verify-auth-token`, {
        owner: response.data.id,
        token: response.data.token
      });
      
      console.log('Verification Response:');
      console.log(JSON.stringify(verifyResponse.data, null, 2));
      
      console.log('\n=== Login with New User ===');
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      if (loginResponse.data.token) {
        console.log('Login Successful!');
        console.log('Your JWT Token:');
        console.log('-------------------------------------------');
        console.log(loginResponse.data.token);
        console.log('-------------------------------------------');
        
        // Write token to a file for easy access
        fs.writeFileSync('jwt-token.txt', loginResponse.data.token);
        console.log('\nToken has been saved to jwt-token.txt for easy access');
        
        console.log('\nUse this token in the test-bills-payment.js script');
      } else {
        console.log('Login Failed:');
        console.log(JSON.stringify(loginResponse.data, null, 2));
      }
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  } finally {
    rl.close();
  }
}

// Run the creation
createUser().catch(error => {
  console.error('Error running script:', error);
  rl.close();
});
