const axios = require('axios');
const chalk = require('chalk');

// Configuration
const API_URL = 'http://localhost:9877';
const TEST_USER = {
  email: 'user1@example.com',
  password: 'password123'
};

// Helper function for API requests
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const response = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      data,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(chalk.green('Response:'), JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error(chalk.red(`API Error: ${error.message}`));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red(`Response: ${JSON.stringify(error.response.data, null, 2)}`));
    }
    return { success: false, message: error.message };
  }
};

// Test login
const testLogin = async () => {
  console.log(chalk.yellow('================================================='));
  console.log(chalk.yellow('     TESTING LOGIN'));
  console.log(chalk.yellow('================================================='));
  
  console.log(chalk.blue(`\n===== Logging in User ${TEST_USER.email} =====`));
  
  const data = {
    email: TEST_USER.email,
    password: TEST_USER.password
  };
  
  console.log(chalk.gray('Request data:'), JSON.stringify(data, null, 2));
  
  await apiRequest('post', '/auth/login', data);
};

// Run the test
testLogin();
