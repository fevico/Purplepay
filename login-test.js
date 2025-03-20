const axios = require('axios');
const readline = require('readline');
const fs = require('fs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const API_URL = 'http://localhost:9876'; // Change this to your API URL

async function login() {
  try {
    console.log('=== Login to get JWT Token ===');
    
    const email = await prompt('Enter your email: ');
    const password = await prompt('Enter your password: ');
    
    console.log(`Attempting to login with email: ${email}`);
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password
    });
    
    if (response.data.token) {
      console.log('\n=== Login Successful ===');
      console.log('Your JWT Token:');
      console.log('-------------------------------------------');
      console.log(response.data.token);
      console.log('-------------------------------------------');
      console.log('\nUse this token in the test-bills-payment.js script');
      
      // Write token to a file for easy access
      fs.writeFileSync('jwt-token.txt', response.data.token);
      console.log('\nToken has been saved to jwt-token.txt for easy access');
    } else {
      console.log('\n=== Login Failed ===');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error logging in:', error.response?.data || error.message);
  } finally {
    rl.close();
  }
}

// Utility function to prompt user
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Run the login
login().catch(error => {
  console.error('Error running script:', error);
  rl.close();
});
