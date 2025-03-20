const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

// Configuration
const API_URL = 'http://localhost:9877';
const TEST_USERS = [
  {
    email: 'user1@example.com',
    password: 'password123'
  },
  {
    email: 'user2@example.com',
    password: 'password123'
  }
];

// Load token from file if available, otherwise login
let tokens = {};
let userIds = {};

// Helper function for API requests
const apiRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios({
      method,
      url: `${API_URL}${endpoint}`,
      data,
      headers
    });

    return response.data;
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response: ${JSON.stringify(error.response.data)}`);
    }
    return { success: false, message: error.message, response: error.response?.data };
  }
};

// Login function
const login = async (email, password) => {
  console.log(`\n===== Logging in User ${email} =====`);
  
  const data = {
    email,
    password
  };
  
  const response = await apiRequest('post', '/api/auth/login', data);
  
  if (response.token) {
    console.log(`✅ Login successful for ${email}!`);
    tokens[email] = response.token;
    userIds[email] = response.user?._id || response.id || 'unknown-id';
    return true;
  } else {
    console.log(`❌ Failed to login user ${email}`);
    return false;
  }
};

// Create user function
const createUser = async (email, password, name) => {
  console.log(`\n===== Creating User ${email} =====`);
  
  const data = {
    email,
    password,
    name
  };
  
  const response = await apiRequest('post', '/api/auth/create', data);
  
  if (response.success) {
    console.log(`✅ User ${email} created successfully!`);
    return true;
  } else {
    console.log(`❌ Failed to create user ${email}`);
    return false;
  }
};

// Create group function
const createGroup = async (email) => {
  console.log('\n===== Creating Split Payment Group =====');
  
  const data = {
    name: 'Test Group',
    description: 'Group for testing split payment',
    paymentPurpose: 'Testing the split payment feature',
    targetAmount: 1000
  };
  
  const response = await apiRequest('post', '/api/splitPayment/create-group', data, tokens[email]);
  
  if (response.success || (response.data && response.data._id)) {
    const groupData = response.data || response;
    console.log('✅ Group created successfully!');
    console.log(`Group ID: ${groupData._id}`);
    console.log(`Invite Code: ${groupData.inviteCode}`);
    return groupData;
  } else {
    console.log('❌ Failed to create group.');
    return null;
  }
};

// Join group function
const joinGroup = async (email, inviteCode) => {
  console.log(`\n===== User ${email} Joining Group =====`);
  
  const data = {
    inviteCode
  };
  
  const response = await apiRequest('post', '/api/splitPayment/join-group', data, tokens[email]);
  
  if (response.success || (response.data && response.data._id)) {
    console.log(`✅ User ${email} joined group successfully!`);
    return true;
  } else {
    console.log(`❌ User ${email} failed to join group.`);
    return false;
  }
};

// Contribute to group function
const contributeToGroup = async (email, groupId, amount) => {
  console.log(`\n===== User ${email} Contributing ${amount} to Group =====`);
  
  const data = {
    groupId,
    amount: parseFloat(amount)
  };
  
  const response = await apiRequest('post', '/api/splitPayment/contribute', data, tokens[email]);
  
  if (response.success || (response.data && response.data._id)) {
    console.log(`✅ User ${email} contribution successful!`);
    return true;
  } else {
    console.log(`❌ User ${email} failed to contribute to group.`);
    return false;
  }
};

// Make payment function
const makePayment = async (email, groupId, amount, recipient) => {
  console.log(`\n===== User ${email} Making Payment of ${amount} to ${recipient} =====`);
  
  const data = {
    groupId,
    amount: parseFloat(amount),
    paymentMethod: 'virtual_card',
    recipient,
    description: 'Test payment'
  };
  
  const response = await apiRequest('post', '/api/splitPayment/make-payment', data, tokens[email]);
  
  if (response.success || (response.data && response.data._id)) {
    console.log('✅ Payment successful!');
    return response.data || response;
  } else {
    console.log('❌ Failed to make payment.');
    return null;
  }
};

// Get group statistics function
const getGroupStatistics = async (email, groupId) => {
  console.log(`\n===== Getting Group Statistics for User ${email} =====`);
  
  const response = await apiRequest('get', `/api/splitPayment/group-statistics/${groupId}`, null, tokens[email]);
  
  if (response.success || response.data) {
    console.log('✅ Group statistics retrieved successfully:');
    console.log(JSON.stringify(response.data || response, null, 2));
    return response.data || response;
  } else {
    console.log('❌ Failed to get group statistics.');
    return null;
  }
};

// Settle debt function
const settleDebt = async (email, groupId, debtorId, creditorId, amount) => {
  console.log(`\n===== User ${email} Settling Debt of ${amount} =====`);
  
  const data = {
    groupId,
    debtorId,
    creditorId,
    amount: parseFloat(amount)
  };
  
  const response = await apiRequest('post', '/api/splitPayment/settle-debt', data, tokens[email]);
  
  if (response.success || (response.data && response.data._id)) {
    console.log('✅ Debt settled successfully!');
    return true;
  } else {
    console.log('❌ Failed to settle debt.');
    return false;
  }
};

// Main test function
const runTests = async () => {
  console.log('=================================================');
  console.log('     SPLIT PAYMENT AUTOMATED TEST SCRIPT');
  console.log('=================================================');
  console.log(`API URL: ${API_URL}`);
  
  // Step 1: Login users or create them if needed
  for (const user of TEST_USERS) {
    const loginSuccess = await login(user.email, user.password);
    if (!loginSuccess) {
      // Try to create the user
      const createSuccess = await createUser(user.email, user.password, user.email.split('@')[0]);
      if (createSuccess) {
        // Try login again
        const retryLogin = await login(user.email, user.password);
        if (!retryLogin) {
          console.log(`Failed to login ${user.email}. Aborting tests.`);
          return;
        }
      } else {
        console.log(`Failed to create user ${user.email}. Aborting tests.`);
        return;
      }
    }
  }
  
  // Step 2: Create a group with user1
  const group = await createGroup(TEST_USERS[0].email);
  if (!group) {
    console.log('Failed to create group. Aborting tests.');
    return;
  }
  
  // Step 3: User2 joins the group
  const joinSuccess = await joinGroup(TEST_USERS[1].email, group.inviteCode);
  if (!joinSuccess) {
    console.log('Failed to join group. Aborting tests.');
    return;
  }
  
  // Step 4: Both users contribute to the group
  const contribution1 = await contributeToGroup(TEST_USERS[0].email, group._id, 500);
  const contribution2 = await contributeToGroup(TEST_USERS[1].email, group._id, 300);
  
  if (!contribution1 || !contribution2) {
    console.log('Failed to contribute to group. Continuing with tests...');
  }
  
  // Step 5: User1 makes a payment
  const payment = await makePayment(TEST_USERS[0].email, group._id, 600, 'Test Merchant');
  
  // Step 6: Get group statistics
  const stats = await getGroupStatistics(TEST_USERS[0].email, group._id);
  
  // Step 7: Settle debt between users
  if (stats && stats.debts && stats.debts.length > 0) {
    const debt = stats.debts[0];
    await settleDebt(
      TEST_USERS[0].email,
      group._id,
      debt.debtorId,
      debt.creditorId,
      debt.amount
    );
  } else {
    console.log('No debts to settle or failed to get statistics.');
  }
  
  // Final statistics
  await getGroupStatistics(TEST_USERS[0].email, group._id);
  
  console.log('\n=================================================');
  console.log('     SPLIT PAYMENT TESTS COMPLETED');
  console.log('=================================================');
};

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
});
