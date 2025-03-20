const axios = require('axios');
const chalk = require('chalk');
const readline = require('readline');

// Configuration
const API_URL = 'http://localhost:9877'; // Update with your server URL
let authToken = '';
let userId = '';
let testGroupId = '';
let inviteCode = '';
let testTransactionId = '';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to prompt for input
const prompt = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Helper function to make API requests
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers,
      data: data ? data : undefined
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(chalk.red('Error:'), error.response.data);
      return error.response.data;
    } else {
      console.error(chalk.red('Error:'), error.message);
      throw error;
    }
  }
};

// Login function
const login = async () => {
  console.log(chalk.blue('\n===== Login ====='));
  
  const email = await prompt('Enter your email: ');
  const password = await prompt('Enter your password: ');
  
  const response = await apiRequest('post', '/auth/login', { email, password });
  
  if (response.success) {
    authToken = response.data.token;
    userId = response.data.user._id;
    console.log(chalk.green('Login successful!'));
    console.log('User ID:', userId);
  } else {
    console.log(chalk.red('Login failed. Please try again.'));
    process.exit(1);
  }
};

// Test create split payment group
const testCreateGroup = async () => {
  console.log(chalk.blue('\n===== Create Split Payment Group ====='));
  
  const name = await prompt('Enter group name: ');
  const description = await prompt('Enter group description (optional): ');
  const paymentPurpose = await prompt('Enter payment purpose (optional): ');
  const targetAmount = await prompt('Enter target amount (optional): ');
  
  const data = {
    name,
    description: description || undefined,
    paymentPurpose: paymentPurpose || undefined,
    targetAmount: targetAmount ? parseFloat(targetAmount) : undefined
  };
  
  const response = await apiRequest('post', '/splitPayment/groups', data);
  
  if (response.success) {
    testGroupId = response.data._id;
    inviteCode = response.data.inviteCode;
    console.log(chalk.green('Group created successfully!'));
    console.log('Group ID:', testGroupId);
    console.log('Invite Code:', inviteCode);
    console.log('Group Details:', JSON.stringify(response.data, null, 2));
  } else {
    console.log(chalk.red('Failed to create group.'));
  }
};

// Test get user groups
const testGetUserGroups = async () => {
  console.log(chalk.blue('\n===== Get User Groups ====='));
  
  const response = await apiRequest('get', '/splitPayment/groups');
  
  if (response.success) {
    console.log(chalk.green('Groups retrieved successfully!'));
    console.log('Number of groups:', response.data.length);
    
    if (response.data.length > 0) {
      response.data.forEach((group, index) => {
        console.log(`\nGroup ${index + 1}:`);
        console.log('ID:', group._id);
        console.log('Name:', group.name);
        console.log('Description:', group.description);
        console.log('Balance:', group.balance);
        console.log('Members:', group.members.length);
        console.log('Invite Code:', group.inviteCode);
      });
    } else {
      console.log('No groups found.');
    }
  } else {
    console.log(chalk.red('Failed to retrieve groups.'));
  }
};

// Test get group by ID
const testGetGroupById = async () => {
  console.log(chalk.blue('\n===== Get Group by ID ====='));
  
  const groupId = await prompt(`Enter group ID (default: ${testGroupId}): `) || testGroupId;
  
  if (!groupId) {
    console.log(chalk.red('Group ID is required.'));
    return;
  }
  
  const response = await apiRequest('get', `/splitPayment/groups/${groupId}`);
  
  if (response.success) {
    console.log(chalk.green('Group retrieved successfully!'));
    console.log('Group Details:', JSON.stringify(response.data, null, 2));
  } else {
    console.log(chalk.red('Failed to retrieve group.'));
  }
};

// Test join group
const testJoinGroup = async () => {
  console.log(chalk.blue('\n===== Join Group ====='));
  
  const code = await prompt(`Enter invite code (default: ${inviteCode}): `) || inviteCode;
  
  if (!code) {
    console.log(chalk.red('Invite code is required.'));
    return;
  }
  
  const response = await apiRequest('post', '/splitPayment/groups/join', { inviteCode: code });
  
  if (response.success) {
    console.log(chalk.green('Successfully joined the group!'));
    console.log('Group Details:', JSON.stringify(response.data, null, 2));
  } else {
    console.log(chalk.red('Failed to join group.'));
  }
};

// Test contribute to group
const testContributeToGroup = async () => {
  console.log(chalk.blue('\n===== Contribute to Group ====='));
  
  const groupId = await prompt(`Enter group ID (default: ${testGroupId}): `) || testGroupId;
  
  if (!groupId) {
    console.log(chalk.red('Group ID is required.'));
    return;
  }
  
  const amount = await prompt('Enter contribution amount: ');
  
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    console.log(chalk.red('Valid amount is required.'));
    return;
  }
  
  const notes = await prompt('Enter notes (optional): ');
  
  const data = {
    groupId,
    amount: parseFloat(amount),
    notes: notes || undefined
  };
  
  const response = await apiRequest('post', '/splitPayment/contribute', data);
  
  if (response.success) {
    console.log(chalk.green('Contribution successful!'));
    console.log('Contribution Details:', JSON.stringify(response.data, null, 2));
  } else {
    console.log(chalk.red('Failed to contribute to group.'));
  }
};

// Test make group payment
const testMakeGroupPayment = async () => {
  console.log(chalk.blue('\n===== Make Group Payment ====='));
  
  const groupId = await prompt(`Enter group ID (default: ${testGroupId}): `) || testGroupId;
  
  if (!groupId) {
    console.log(chalk.red('Group ID is required.'));
    return;
  }
  
  const amount = await prompt('Enter payment amount: ');
  
  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    console.log(chalk.red('Valid amount is required.'));
    return;
  }
  
  console.log('Payment Methods:');
  console.log('1. Virtual Card');
  console.log('2. Bank Transfer');
  console.log('3. Bill Payment');
  
  const paymentMethodChoice = await prompt('Choose payment method (1-3): ');
  
  let paymentMethod;
  switch (paymentMethodChoice) {
    case '1':
      paymentMethod = 'virtual_card';
      break;
    case '2':
      paymentMethod = 'bank_transfer';
      break;
    case '3':
      paymentMethod = 'bill_payment';
      break;
    default:
      console.log(chalk.red('Invalid choice. Using virtual_card as default.'));
      paymentMethod = 'virtual_card';
  }
  
  const recipient = await prompt('Enter recipient: ');
  
  if (!recipient) {
    console.log(chalk.red('Recipient is required.'));
    return;
  }
  
  const description = await prompt('Enter description (optional): ');
  
  const requiresApprovalInput = await prompt('Requires approval? (y/n): ');
  const requiresApproval = requiresApprovalInput.toLowerCase() === 'y';
  
  let minApprovals;
  if (requiresApproval) {
    const minApprovalsInput = await prompt('Minimum approvals required: ');
    minApprovals = minApprovalsInput ? parseInt(minApprovalsInput) : 1;
  }
  
  const data = {
    groupId,
    amount: parseFloat(amount),
    paymentMethod,
    recipient,
    description: description || undefined,
    requiresApproval,
    minApprovals
  };
  
  const response = await apiRequest('post', '/splitPayment/pay', data);
  
  if (response.success) {
    console.log(chalk.green('Payment initiated successfully!'));
    console.log('Payment Details:', JSON.stringify(response.data, null, 2));
    
    if (response.data.status === 'pending') {
      testTransactionId = response.data.transactionId;
      console.log('Transaction ID for approval:', testTransactionId);
    }
  } else {
    console.log(chalk.red('Failed to make payment.'));
  }
};

// Test approve group payment
const testApproveGroupPayment = async () => {
  console.log(chalk.blue('\n===== Approve Group Payment ====='));
  
  const transactionId = await prompt(`Enter transaction ID (default: ${testTransactionId}): `) || testTransactionId;
  
  if (!transactionId) {
    console.log(chalk.red('Transaction ID is required.'));
    return;
  }
  
  const response = await apiRequest('post', '/splitPayment/approve', { transactionId });
  
  if (response.success) {
    console.log(chalk.green('Payment approved successfully!'));
    console.log('Updated Payment Details:', JSON.stringify(response.data, null, 2));
  } else {
    console.log(chalk.red('Failed to approve payment.'));
  }
};

// Test get group contributions
const testGetGroupContributions = async () => {
  console.log(chalk.blue('\n===== Get Group Contributions ====='));
  
  const groupId = await prompt(`Enter group ID (default: ${testGroupId}): `) || testGroupId;
  
  if (!groupId) {
    console.log(chalk.red('Group ID is required.'));
    return;
  }
  
  const response = await apiRequest('get', `/splitPayment/groups/${groupId}/contributions`);
  
  if (response.success) {
    console.log(chalk.green('Contributions retrieved successfully!'));
    console.log('Number of contributions:', response.data.length);
    
    if (response.data.length > 0) {
      response.data.forEach((contribution, index) => {
        console.log(`\nContribution ${index + 1}:`);
        console.log('ID:', contribution._id);
        console.log('Amount:', contribution.amount);
        console.log('Status:', contribution.status);
        console.log('Date:', new Date(contribution.createdAt).toLocaleString());
        console.log('Contributor:', contribution.contributor ? contribution.contributor.name : 'Unknown');
      });
    } else {
      console.log('No contributions found.');
    }
  } else {
    console.log(chalk.red('Failed to retrieve contributions.'));
  }
};

// Test get group transactions
const testGetGroupTransactions = async () => {
  console.log(chalk.blue('\n===== Get Group Transactions ====='));
  
  const groupId = await prompt(`Enter group ID (default: ${testGroupId}): `) || testGroupId;
  
  if (!groupId) {
    console.log(chalk.red('Group ID is required.'));
    return;
  }
  
  const response = await apiRequest('get', `/splitPayment/groups/${groupId}/transactions`);
  
  if (response.success) {
    console.log(chalk.green('Transactions retrieved successfully!'));
    console.log('Number of transactions:', response.data.length);
    
    if (response.data.length > 0) {
      response.data.forEach((transaction, index) => {
        console.log(`\nTransaction ${index + 1}:`);
        console.log('ID:', transaction._id);
        console.log('Transaction ID:', transaction.transactionId);
        console.log('Amount:', transaction.amount);
        console.log('Payment Method:', transaction.paymentMethod);
        console.log('Recipient:', transaction.recipient);
        console.log('Status:', transaction.status);
        console.log('Date:', new Date(transaction.createdAt).toLocaleString());
        console.log('Initiator:', transaction.initiator ? transaction.initiator.name : 'Unknown');
        console.log('Approvals:', transaction.approvals ? transaction.approvals.length : 0);
      });
    } else {
      console.log('No transactions found.');
    }
  } else {
    console.log(chalk.red('Failed to retrieve transactions.'));
  }
};

// Test get group statistics
const testGetGroupStatistics = async () => {
  console.log(chalk.blue('\n===== Get Group Statistics ====='));
  
  const groupId = await prompt(`Enter group ID (default: ${testGroupId}): `) || testGroupId;
  
  if (!groupId) {
    console.log(chalk.red('Group ID is required.'));
    return;
  }
  
  const response = await apiRequest('get', `/splitPayment/groups/${groupId}/statistics`);
  
  if (response.success) {
    console.log(chalk.green('Statistics retrieved successfully!'));
    console.log('Total Contributed:', response.data.totalContributed);
    console.log('Total Spent:', response.data.totalSpent);
    console.log('Current Balance:', response.data.currentBalance);
    console.log('Target Amount:', response.data.targetAmount);
    console.log('Percentage of Target:', response.data.percentageOfTarget.toFixed(2) + '%');
    
    if (response.data.dueDate) {
      console.log('Due Date:', new Date(response.data.dueDate).toLocaleString());
    }
    
    console.log('\nContribution by Member:');
    for (const [memberId, amount] of Object.entries(response.data.contributionByMember)) {
      console.log(`Member ${memberId}: ${amount}`);
    }
    
    console.log('\nMember Statistics:');
    response.data.memberStats.forEach(stat => {
      console.log(`${stat.name || stat.memberId}: ${stat.contributionAmount} (${stat.contributionPercentage.toFixed(2)}%)`);
    });
    
    console.log('\nDebts:');
    if (response.data.debts.length > 0) {
      response.data.debts.forEach(debt => {
        console.log(`${debt.debtor} owes ${debt.creditor}: ${debt.amount}`);
      });
    } else {
      console.log('No debts found.');
    }
  } else {
    console.log(chalk.red('Failed to retrieve statistics.'));
  }
};

// Test settle debt
const testSettleDebt = async () => {
  console.log(chalk.blue('\n===== Settle Debt ====='));
  
  const groupId = await prompt(`Enter group ID (default: ${testGroupId}): `) || testGroupId;
  
  if (!groupId) {
    console.log(chalk.red('Group ID is required.'));
    return;
  }
  
  // First, get the group statistics to see the debts
  const statsResponse = await apiRequest('get', `/splitPayment/groups/${groupId}/statistics`);
  
  if (!statsResponse.success) {
    console.log(chalk.red('Failed to retrieve group statistics.'));
    return;
  }
  
  if (statsResponse.data.debts.length === 0) {
    console.log(chalk.yellow('No debts to settle in this group.'));
    return;
  }
  
  console.log('\nCurrent Debts:');
  statsResponse.data.debts.forEach((debt, index) => {
    console.log(`${index + 1}. ${debt.debtor} owes ${debt.creditor}: ${debt.amount}`);
  });
  
  const debtIndexInput = await prompt('Select a debt to settle (enter the number): ');
  const debtIndex = parseInt(debtIndexInput) - 1;
  
  if (isNaN(debtIndex) || debtIndex < 0 || debtIndex >= statsResponse.data.debts.length) {
    console.log(chalk.red('Invalid selection.'));
    return;
  }
  
  const selectedDebt = statsResponse.data.debts[debtIndex];
  
  // Check if the current user is the debtor
  if (selectedDebt.debtor !== userId) {
    console.log(chalk.red('You can only settle your own debts.'));
    return;
  }
  
  const amountInput = await prompt(`Enter amount to settle (default: ${selectedDebt.amount}): `) || selectedDebt.amount;
  const amount = parseFloat(amountInput);
  
  if (isNaN(amount) || amount <= 0) {
    console.log(chalk.red('Invalid amount.'));
    return;
  }
  
  const data = {
    groupId,
    debtorId: selectedDebt.debtor,
    creditorId: selectedDebt.creditor,
    amount
  };
  
  const response = await apiRequest('post', '/splitPayment/settle-debt', data);
  
  if (response.success) {
    console.log(chalk.green('Debt settled successfully!'));
    console.log('Contribution Details:', JSON.stringify(response.data.contribution, null, 2));
    
    // Show updated debts
    console.log('\nUpdated Debts:');
    if (response.data.statistics.debts.length > 0) {
      response.data.statistics.debts.forEach(debt => {
        console.log(`${debt.debtor} owes ${debt.creditor}: ${debt.amount}`);
      });
    } else {
      console.log('No remaining debts.');
    }
  } else {
    console.log(chalk.red('Failed to settle debt.'));
  }
};

// Main menu
const showMenu = async () => {
  console.log(chalk.yellow('\n===== Split Payment API Test Menu ====='));
  console.log('1. Login');
  console.log('2. Create Split Payment Group');
  console.log('3. Get User Groups');
  console.log('4. Get Group by ID');
  console.log('5. Join Group');
  console.log('6. Contribute to Group');
  console.log('7. Make Group Payment');
  console.log('8. Approve Group Payment');
  console.log('9. Get Group Contributions');
  console.log('10. Get Group Transactions');
  console.log('11. Get Group Statistics');
  console.log('12. Settle Debt');
  console.log('0. Exit');
  
  const choice = await prompt('\nEnter your choice (0-12): ');
  
  switch (choice) {
    case '0':
      console.log(chalk.green('Exiting...'));
      rl.close();
      break;
    case '1':
      await login();
      await showMenu();
      break;
    case '2':
      await testCreateGroup();
      await showMenu();
      break;
    case '3':
      await testGetUserGroups();
      await showMenu();
      break;
    case '4':
      await testGetGroupById();
      await showMenu();
      break;
    case '5':
      await testJoinGroup();
      await showMenu();
      break;
    case '6':
      await testContributeToGroup();
      await showMenu();
      break;
    case '7':
      await testMakeGroupPayment();
      await showMenu();
      break;
    case '8':
      await testApproveGroupPayment();
      await showMenu();
      break;
    case '9':
      await testGetGroupContributions();
      await showMenu();
      break;
    case '10':
      await testGetGroupTransactions();
      await showMenu();
      break;
    case '11':
      await testGetGroupStatistics();
      await showMenu();
      break;
    case '12':
      await testSettleDebt();
      await showMenu();
      break;
    default:
      console.log(chalk.red('Invalid choice. Please try again.'));
      await showMenu();
  }
};

// Start the test script
console.log(chalk.green('Split Payment API Test Script'));
console.log(chalk.gray('API URL:', API_URL));

showMenu();
