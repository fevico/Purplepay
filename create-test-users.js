const axios = require('axios');
const chalk = require('chalk');

// Configuration
const API_URL = 'http://localhost:9877';
const TEST_USERS = [
  {
    name: 'User One',
    email: 'user1@example.com',
    password: 'password123'
  },
  {
    name: 'User Two',
    email: 'user2@example.com',
    password: 'password123'
  }
];

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

    return response.data;
  } catch (error) {
    console.error(chalk.red(`API Error: ${error.message}`));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red(`Response: ${JSON.stringify(error.response.data)}`));
    }
    return { success: false, message: error.message };
  }
};

// Create test users
const createTestUsers = async () => {
  console.log(chalk.yellow('================================================='));
  console.log(chalk.yellow('     CREATING TEST USERS FOR SPLIT PAYMENT'));
  console.log(chalk.yellow('================================================='));
  
  for (const user of TEST_USERS) {
    console.log(chalk.blue(`\n===== Creating User ${user.email} =====`));
    
    // Try to register the user
    const response = await apiRequest('post', '/api/auth/create', user);
    
    if (response.success) {
      console.log(chalk.green(`User ${user.email} created successfully!`));
      console.log(`User ID: ${response.data.user._id}`);
    } else {
      // Check if user already exists
      console.log(chalk.yellow(`Failed to create user. Trying to login to check if user exists...`));
      
      const loginResponse = await apiRequest('post', '/api/auth/login', {
        email: user.email,
        password: user.password
      });
      
      if (loginResponse.success) {
        console.log(chalk.green(`User ${user.email} already exists and credentials are valid.`));
      } else {
        console.log(chalk.red(`User ${user.email} could not be created or accessed.`));
      }
    }
  }
  
  console.log(chalk.green('\n===== Test users setup complete ====='));
};

// Run the setup
createTestUsers();
