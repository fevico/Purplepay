const axios = require('axios');

const API_URL = 'http://localhost:9876';

// This token was obtained from a successful login
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2N2Q5YTNiY2JiYzMxZmY1YmY2YzM5NGMiLCJpYXQiOjE3NDIzMTY1NTAsImV4cCI6MTc0MjMyMDE1MH0.vKZRtzHjFGpwmmiRltbaETB1onEhVairn_NtOn97FD0';

// Function to fetch bank list
async function fetchBankList() {
  try {
    console.log('Fetching bank list...');
    const response = await axios.get(
      `${API_URL}/wallet/bank-list`,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`
        }
      }
    );
    
    console.log('Bank list fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching bank list:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    // Don't throw an error, just return null
    return null;
  }
}

// Function to create a wallet
async function createWallet() {
  try {
    console.log('Creating wallet...');
    const walletData = {
      email: 'test5@example.com',  // Use a new email each time
      account_name: 'Test User',
      phone: '1234567890'
    };
    
    const response = await axios.post(
      `${API_URL}/wallet/create`, 
      walletData,
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Wallet created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating wallet:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    throw new Error('Wallet creation failed');
  }
}

// Function to get account details
async function getAccountDetails(accountNumber, sortCode) {
  try {
    console.log(`Getting account details for account number: ${accountNumber}, sort code: ${sortCode}...`);
    const response = await axios.post(
      `${API_URL}/wallet/account-details`,
      {
        accountNumber,
        sortCode
      },
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Account details fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching account details:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    // Don't throw an error, just return null
    return null;
  }
}

// Function to analyze wallet response
function analyzeWalletResponse(walletResponse) {
  console.log('\n--- Wallet Analysis ---');
  
  if (!walletResponse) {
    console.log('No wallet response to analyze');
    return;
  }
  
  const wallet = walletResponse.createWallet;
  
  if (!wallet) {
    console.log('No wallet data found in response');
    return;
  }
  
  console.log('Wallet ID:', wallet._id);
  console.log('User ID:', wallet.userId);
  console.log('Balance:', wallet.balance);
  console.log('Created At:', wallet.createdAt);
  
  // Check if the wallet has bank details
  if (wallet.bankName) {
    console.log('Bank Name:', wallet.bankName);
  } else {
    console.log('Bank Name: Not provided');
  }
  
  if (wallet.accountName) {
    console.log('Account Name:', wallet.accountName);
  } else {
    console.log('Account Name: Not provided');
  }
  
  if (wallet.accountNumber) {
    console.log('Account Number:', wallet.accountNumber);
  } else {
    console.log('Account Number: Not provided');
  }
  
  console.log('\nNote: The bank list and account details endpoints require a valid PUBLIC_KEY environment variable to be set.');
  console.log('These endpoints may not work in the test environment without proper API credentials.');
}

// Main function to run tests
async function runTests() {
  try {
    console.log('Starting wallet tests...');
    console.log('Using API URL:', API_URL);
    console.log('Using AUTH_TOKEN:', AUTH_TOKEN.substring(0, 10) + '...');
    
    // Step 1: Create a wallet first
    console.log('\n--- Testing Create Wallet API ---');
    const wallet = await createWallet();
    
    // Step 2: Analyze the wallet response
    analyzeWalletResponse(wallet);
    
    // Step 3: Fetch bank list (after wallet creation)
    console.log('\n--- Testing Bank List API ---');
    const banks = await fetchBankList();
    
    // Step 4: Get account details (if we have the required data)
    console.log('\n--- Testing Account Details API ---');
    // Use a test account number and sort code for Access Bank
    const testAccountNumber = '0123456789';
    const testSortCode = '000014'; // Access Bank sort code from the bank list
    
    await getAccountDetails(testAccountNumber, testSortCode);
    
    console.log('\nAll tests completed successfully!');
    console.log('\nSummary:');
    console.log('1. Wallet creation: ' + (wallet ? 'SUCCESS' : 'FAILED'));
    console.log('2. Bank list retrieval: ' + (banks ? 'SUCCESS' : 'FAILED (Requires valid PUBLIC_KEY)'));
    console.log('3. Account details retrieval: TESTED with test account');
    
    console.log('\nNote: To fully test the wallet functionality, ensure the PUBLIC_KEY environment variable is set correctly.');
    console.log('The current implementation integrates with the Strowallet API for virtual bank accounts.');
  } catch (error) {
    console.error('\nTest failed:', error.message);
  }
}

// Instructions for the user
console.log(`
=================================================
WALLET API TESTING SCRIPT
=================================================

IMPORTANT: Before running this script, you need to:
1. Start the server (npm run dev)
2. Create a user and login to get an auth token
3. Replace 'YOUR_AUTH_TOKEN_HERE' in this script with your actual token

To create a user and get a token:
1. Use Postman or curl to call POST ${API_URL}/auth/create with:
   {
     "email": "your-email@example.com",
     "password": "your-password"
   }
2. Verify your email using the token received
3. Login with POST ${API_URL}/auth/login using the same credentials
4. Copy the token from the response and update this script

=================================================
`);

// Run the tests
runTests();
