const axios = require('axios');
const readline = require('readline');

// Configuration
const API_URL = 'http://localhost:9877';
let authToken = '';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function for API requests
const apiRequest = async (method, endpoint, data = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
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
const login = async () => {
  return new Promise((resolve) => {
    rl.question('Enter email: ', (email) => {
      rl.question('Enter password: ', async (password) => {
        console.log(`\nLogging in as ${email}...`);
        
        const data = {
          email,
          password
        };
        
        const response = await apiRequest('post', '/api/auth/login', data);
        
        if (response.token) {
          console.log('Login successful!');
          authToken = response.token;
          resolve(true);
        } else {
          console.log('Login failed. Please try again.');
          resolve(false);
        }
      });
    });
  });
};

// Create group function
const createGroup = async () => {
  return new Promise((resolve) => {
    rl.question('Enter group name: ', (name) => {
      rl.question('Enter group description: ', async (description) => {
        console.log('\nCreating split payment group...');
        
        const data = {
          name,
          description,
          paymentPurpose: 'Testing the split payment feature',
          targetAmount: 1000
        };
        
        const response = await apiRequest('post', '/api/splitPayment/create-group', data);
        
        if (response.success || (response.data && response.data._id)) {
          console.log('Group created successfully!');
          console.log(`Group ID: ${response.data._id}`);
          console.log(`Invite Code: ${response.data.inviteCode}`);
          resolve(response.data);
        } else {
          console.log('Failed to create group.');
          resolve(null);
        }
      });
    });
  });
};

// Join group function
const joinGroup = async () => {
  return new Promise((resolve) => {
    rl.question('Enter invite code: ', async (inviteCode) => {
      console.log('\nJoining group...');
      
      const data = {
        inviteCode
      };
      
      const response = await apiRequest('post', '/api/splitPayment/join-group', data);
      
      if (response.success || (response.data && response.data._id)) {
        console.log('Joined group successfully!');
        resolve(response.data);
      } else {
        console.log('Failed to join group.');
        resolve(null);
      }
    });
  });
};

// Contribute to group function
const contributeToGroup = async () => {
  return new Promise((resolve) => {
    rl.question('Enter group ID: ', (groupId) => {
      rl.question('Enter amount: ', async (amount) => {
        console.log('\nContributing to group...');
        
        const data = {
          groupId,
          amount: parseFloat(amount)
        };
        
        const response = await apiRequest('post', '/api/splitPayment/contribute', data);
        
        if (response.success || (response.data && response.data._id)) {
          console.log('Contribution successful!');
          resolve(response.data);
        } else {
          console.log('Failed to contribute to group.');
          resolve(null);
        }
      });
    });
  });
};

// Make payment function
const makePayment = async () => {
  return new Promise((resolve) => {
    rl.question('Enter group ID: ', (groupId) => {
      rl.question('Enter amount: ', (amount) => {
        rl.question('Enter recipient: ', async (recipient) => {
          console.log('\nMaking payment...');
          
          const data = {
            groupId,
            amount: parseFloat(amount),
            paymentMethod: 'virtual_card',
            recipient,
            description: 'Test payment'
          };
          
          const response = await apiRequest('post', '/api/splitPayment/make-payment', data);
          
          if (response.success || (response.data && response.data._id)) {
            console.log('Payment successful!');
            resolve(response.data);
          } else {
            console.log('Failed to make payment.');
            resolve(null);
          }
        });
      });
    });
  });
};

// Get group statistics function
const getGroupStatistics = async () => {
  return new Promise((resolve) => {
    rl.question('Enter group ID: ', async (groupId) => {
      console.log('\nGetting group statistics...');
      
      const response = await apiRequest('get', `/api/splitPayment/group-statistics/${groupId}`);
      
      if (response.success || response.data) {
        console.log('Group statistics:');
        console.log(JSON.stringify(response.data, null, 2));
        resolve(response.data);
      } else {
        console.log('Failed to get group statistics.');
        resolve(null);
      }
    });
  });
};

// Settle debt function
const settleDebt = async () => {
  return new Promise((resolve) => {
    rl.question('Enter group ID: ', (groupId) => {
      rl.question('Enter debtor ID: ', (debtorId) => {
        rl.question('Enter creditor ID: ', (creditorId) => {
          rl.question('Enter amount: ', async (amount) => {
            console.log('\nSettling debt...');
            
            const data = {
              groupId,
              debtorId,
              creditorId,
              amount: parseFloat(amount)
            };
            
            const response = await apiRequest('post', '/api/splitPayment/settle-debt', data);
            
            if (response.success || (response.data && response.data._id)) {
              console.log('Debt settled successfully!');
              resolve(response.data);
            } else {
              console.log('Failed to settle debt.');
              resolve(null);
            }
          });
        });
      });
    });
  });
};

// Main menu
const showMenu = () => {
  console.log('\n===== SPLIT PAYMENT MANUAL TEST =====');
  console.log('1. Login');
  console.log('2. Create Group');
  console.log('3. Join Group');
  console.log('4. Contribute to Group');
  console.log('5. Make Payment');
  console.log('6. Get Group Statistics');
  console.log('7. Settle Debt');
  console.log('8. Exit');
  
  rl.question('\nSelect an option: ', async (option) => {
    switch (option) {
      case '1':
        await login();
        showMenu();
        break;
      case '2':
        await createGroup();
        showMenu();
        break;
      case '3':
        await joinGroup();
        showMenu();
        break;
      case '4':
        await contributeToGroup();
        showMenu();
        break;
      case '5':
        await makePayment();
        showMenu();
        break;
      case '6':
        await getGroupStatistics();
        showMenu();
        break;
      case '7':
        await settleDebt();
        showMenu();
        break;
      case '8':
        console.log('Exiting...');
        rl.close();
        break;
      default:
        console.log('Invalid option. Please try again.');
        showMenu();
        break;
    }
  });
};

// Start the test
console.log('===== SPLIT PAYMENT MANUAL TEST =====');
console.log(`API URL: ${API_URL}`);
showMenu();
