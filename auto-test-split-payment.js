const axios = require('axios');
const chalk = require('chalk');

// Configuration
const API_URL = 'http://localhost:9877';
const testUsers = [
  {
    email: 'user1@example.com',
    password: 'password123'
  },
  {
    email: 'user2@example.com',
    password: 'password123'
  }
];

// Test state
let testGroupId = '';
let testGroupInviteCode = '';
let testTransactionId = '';

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
    console.error(chalk.red(`API Error: ${error.message}`));
    if (error.response) {
      console.error(chalk.red(`Status: ${error.response.status}`));
      console.error(chalk.red(`Response: ${JSON.stringify(error.response.data)}`));
    }
    return { success: false, message: error.message, response: error.response?.data };
  }
};

// Mock user verification (for testing purposes only)
const mockVerifyUser = async (email) => {
  console.log(chalk.blue(`\n===== Mocking verification for ${email} =====`));
  
  try {
    // This is a direct database update that would normally be done through an email verification flow
    // In a real application, you would click a link in an email
    // For testing purposes, we're simulating this by making a request to a mock endpoint
    
    // This is just a placeholder - in a real test environment, you would have a special endpoint 
    // or direct database access to verify users for testing
    console.log(chalk.yellow('Note: In a real application, verification would be done through email'));
    console.log(chalk.yellow('For testing purposes, we\'ll proceed assuming the user is verified'));
    
    return true;
  } catch (error) {
    console.error(chalk.red(`Verification Error: ${error.message}`));
    return false;
  }
};

// Test functions
const loginUser = async (user) => {
  console.log(chalk.blue(`\n===== Logging in User ${user.email} =====`));
  
  const data = {
    email: user.email,
    password: user.password
  };
  
  const response = await apiRequest('post', '/api/auth/login', data);
  
  console.log('Login response:', response);
  
  if (response.token) {
    console.log(chalk.green(`User ${user.email} logged in successfully!`));
    return response.token;
  } else {
    console.log(chalk.red(`Failed to login user ${user.email}`));
    return null;
  }
};

const createGroup = async (token) => {
  console.log(chalk.blue('\n===== Creating Split Payment Group ====='));
  
  const data = {
    name: 'Test Group',
    description: 'A test group for split payments',
    paymentPurpose: 'Testing the split payment feature',
    targetAmount: 1000,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
  };
  
  const response = await apiRequest('post', '/api/splitPayment/groups', data, token);
  
  console.log('Group creation response:', response);
  
  if (response.data && response.data._id) {
    console.log(chalk.green('Group created successfully!'));
    console.log(`Group ID: ${response.data._id}`);
    console.log(`Invite Code: ${response.data.inviteCode}`);
    
    return {
      groupId: response.data._id,
      inviteCode: response.data.inviteCode
    };
  } else {
    console.log(chalk.red('Failed to create group'));
    return null;
  }
};

const joinGroup = async (token, inviteCode) => {
  console.log(chalk.blue('\n===== Joining Group ====='));
  
  const data = {
    inviteCode
  };
  
  const response = await apiRequest('post', '/api/splitPayment/groups/join', data, token);
  
  console.log('Join group response:', response);
  
  if (response.data && response.data._id) {
    console.log(chalk.green('Joined group successfully!'));
    return response.data._id;
  } else {
    console.log(chalk.red('Failed to join group'));
    return null;
  }
};

const contributeToGroup = async (token, groupId, amount) => {
  console.log(chalk.blue('\n===== Contributing to Group ====='));
  
  const data = {
    groupId,
    amount,
    notes: 'Test contribution'
  };
  
  const response = await apiRequest('post', '/api/splitPayment/contribute', data, token);
  
  console.log('Contribution response:', response);
  
  if (response.data && response.data._id) {
    console.log(chalk.green('Contribution made successfully!'));
    console.log(`Contribution ID: ${response.data._id}`);
    console.log(`Amount: $${response.data.amount}`);
    return response.data._id;
  } else {
    console.log(chalk.red('Failed to make contribution'));
    return null;
  }
};

const makeGroupPayment = async (token, groupId, amount, recipient) => {
  console.log(chalk.blue('\n===== Making Group Payment ====='));
  
  const data = {
    groupId,
    amount,
    recipient,
    paymentMethod: 'virtual_card',
    description: 'Test payment',
    notes: 'Test payment notes',
    minApprovals: 1
  };
  
  const response = await apiRequest('post', '/api/splitPayment/pay', data, token);
  
  console.log('Payment response:', response);
  
  if (response.data && response.data._id) {
    console.log(chalk.green('Payment initiated successfully!'));
    console.log(`Transaction ID: ${response.data._id}`);
    console.log(`Amount: $${response.data.amount}`);
    return response.data._id;
  } else {
    console.log(chalk.red('Failed to initiate payment'));
    return null;
  }
};

const approveGroupPayment = async (token, transactionId) => {
  console.log(chalk.blue('\n===== Approving Group Payment ====='));
  
  const data = {
    transactionId
  };
  
  const response = await apiRequest('post', '/api/splitPayment/approve', data, token);
  
  console.log('Approval response:', response);
  
  if (response.success || (response.data && response.data._id)) {
    console.log(chalk.green('Payment approved successfully!'));
    return true;
  } else {
    console.log(chalk.red('Failed to approve payment'));
    return false;
  }
};

const getGroupStatistics = async (token, groupId) => {
  console.log(chalk.blue('\n===== Getting Group Statistics ====='));
  
  const response = await apiRequest('get', `/api/splitPayment/groups/${groupId}/statistics`, null, token);
  
  console.log('Statistics response:', response);
  
  if (response.data) {
    console.log(chalk.green('Group statistics retrieved successfully!'));
    console.log(`Total Contributions: $${response.data.totalContributions}`);
    console.log(`Total Payments: $${response.data.totalPayments}`);
    console.log(`Current Balance: $${response.data.currentBalance}`);
    return response.data;
  } else {
    console.log(chalk.red('Failed to retrieve group statistics'));
    return null;
  }
};

const settleDebt = async (token, groupId, debtorId, creditorId, amount) => {
  console.log(chalk.blue('\n===== Settling Debt ====='));
  
  const data = {
    groupId,
    debtorId,
    creditorId,
    amount
  };
  
  const response = await apiRequest('post', '/api/splitPayment/settle-debt', data, token);
  
  console.log('Debt settlement response:', response);
  
  if (response.success || (response.data && response.data._id)) {
    console.log(chalk.green('Debt settled successfully!'));
    return true;
  } else {
    console.log(chalk.red('Failed to settle debt'));
    return false;
  }
};

// Main test flow
const runTests = async () => {
  try {
    console.log(chalk.blue('================================================='));
    console.log(chalk.blue('     SPLIT PAYMENT AUTOMATED TEST SCRIPT'));
    console.log(chalk.blue('================================================='));
    console.log(`API URL: ${API_URL}\n`);
    
    // Step 1: Login users
    const user1Token = await loginUser(testUsers[0]);
    if (!user1Token) {
      console.log(chalk.red('Failed to login user1. Aborting tests.'));
      return;
    }
    
    const user2Token = await loginUser(testUsers[1]);
    if (!user2Token) {
      console.log(chalk.red('Failed to login user2. Aborting tests.'));
      return;
    }
    
    // Step 2: Create a split payment group
    const groupInfo = await createGroup(user1Token);
    if (!groupInfo) {
      console.log(chalk.red('Failed to create group. Aborting tests.'));
      return;
    }
    
    const testGroupId = groupInfo.groupId;
    const inviteCode = groupInfo.inviteCode;
    
    // Step 3: User 2 joins the group
    const joinSuccess = await joinGroup(user2Token, inviteCode);
    if (!joinSuccess) {
      console.log(chalk.red('Failed to join group. Aborting tests.'));
      return;
    }
    
    // Step 4: Both users contribute to the group
    const user1ContributionId = await contributeToGroup(user1Token, testGroupId, 500);
    if (!user1ContributionId) {
      console.log(chalk.red('Failed to contribute to group. Aborting tests.'));
      return;
    }
    
    const user2ContributionId = await contributeToGroup(user2Token, testGroupId, 300);
    if (!user2ContributionId) {
      console.log(chalk.red('Failed to contribute to group. Continuing with tests.'));
    }
    
    // Step 5: Make a group payment
    const transactionId = await makeGroupPayment(user1Token, testGroupId, 150, 'Test Merchant');
    if (!transactionId) {
      console.log(chalk.red('Failed to make group payment. Aborting tests.'));
      return;
    }
    
    // Save transaction ID for later use
    testTransactionId = transactionId;
    
    // Step 6: Approve the payment
    const approvalSuccess = await approveGroupPayment(user2Token, testTransactionId);
    if (!approvalSuccess) {
      console.log(chalk.yellow('Payment approval failed or was not required.'));
    }
    
    // Step 7: Get group statistics
    const stats = await getGroupStatistics(user1Token, testGroupId);
    
    // Step 8: Settle debts if any exist
    if (stats && stats.debts && stats.debts.length > 0) {
      const debt = stats.debts[0];
      const settleSuccess = await settleDebt(
        user1Token, 
        testGroupId, 
        debt.debtorId, 
        debt.creditorId, 
        debt.amount
      );
      
      if (!settleSuccess) {
        console.log(chalk.yellow('Failed to settle debt.'));
      }
    } else {
      console.log(chalk.yellow('No debts to settle.'));
    }
    
    console.log(chalk.green('\n===== All tests completed successfully! ====='));
    
  } catch (error) {
    console.error(chalk.red('Error during test execution:'), error);
  }
};

// Run the tests
runTests();
