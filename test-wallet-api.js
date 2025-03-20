const axios = require('axios');

const API_URL = 'http://localhost:9881/api';
let token;

// Test registration
async function testRegistration() {
  try {
    const userData = {
      name: 'Wallet Test User',
      email: `wallet${Date.now()}@example.com`,
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

// Test setting transaction PIN
async function testSetTransactionPin() {
  try {
    console.log('Setting transaction PIN');
    
    const response = await axios.post(`${API_URL}/wallet/set-pin`, {
      transactionPin: '1234'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Set transaction PIN response:', response.data);
    return true;
  } catch (error) {
    console.error('Set transaction PIN error:', error.response ? error.response.data : error.message);
    return false;
  }
}

// Test getting wallet
async function testGetWallet() {
  try {
    console.log('Getting wallet');
    
    const response = await axios.get(`${API_URL}/wallet`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Get wallet response:', response.data);
    return response.data.wallet;
  } catch (error) {
    console.error('Get wallet error:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test deposit
async function testDeposit() {
  try {
    console.log('Making deposit');
    
    const response = await axios.post(`${API_URL}/wallet/deposit`, {
      amount: 5000,
      description: 'Test deposit'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Deposit response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Deposit error:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test withdrawal
async function testWithdrawal() {
  try {
    console.log('Making withdrawal');
    
    const response = await axios.post(`${API_URL}/wallet/withdraw`, {
      amount: 1000,
      description: 'Test withdrawal',
      transactionPin: '1234'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Withdrawal response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Withdrawal error:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Test getting transactions
async function testGetTransactions() {
  try {
    console.log('Getting transactions');
    
    const response = await axios.get(`${API_URL}/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Get transactions response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get transactions error:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Run tests
async function runTests() {
  // Register new user
  const registrationToken = await testRegistration();
  
  if (registrationToken) {
    // Get initial wallet
    const initialWallet = await testGetWallet();
    
    // Set transaction PIN
    const pinSet = await testSetTransactionPin();
    
    // Make deposit
    const deposit = await testDeposit();
    
    // Get wallet after deposit
    const walletAfterDeposit = await testGetWallet();
    
    if (pinSet && deposit) {
      // Make withdrawal
      const withdrawal = await testWithdrawal();
      
      // Get wallet after withdrawal
      const walletAfterWithdrawal = await testGetWallet();
    }
    
    // Get transactions
    const transactions = await testGetTransactions();
  }
}

runTests();
