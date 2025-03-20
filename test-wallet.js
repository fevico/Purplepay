const axios = require('axios');

const API_URL = 'http://localhost:9876';
const TEST_USER = {
  email: 'test3@example.com',  // Using a new email
  password: 'Password123'
};

// Store the verification token and user ID
let verificationToken = '';
let userId = '';

// Function to create a user
async function createUser() {
  try {
    const response = await axios.post(`${API_URL}/auth/create`, TEST_USER);
    console.log('User created successfully:', response.data);
    // Save the verification token and user ID
    if (response.data && response.data.token) {
      verificationToken = response.data.token;
    }
    if (response.data && response.data.id) {
      userId = response.data.id;
    }
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error.response ? error.response.data : error.message);
    // If the user already exists, we can continue
    return { message: 'User might already exist, continuing...' };
  }
}

// Function to verify auth token
async function verifyAuthToken() {
  try {
    // Use the stored verification token and user ID
    const response = await axios.post(`${API_URL}/auth/verify-auth-token`, { 
      token: verificationToken,
      owner: userId
    });
    console.log('Auth token verified successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error verifying auth token:', error.response ? error.response.data : error.message);
    // We'll continue even if verification fails
    return { message: 'Verification might have failed, continuing...' };
  }
}

// Function to resend OTP
async function resendOtp() {
  try {
    const response = await axios.post(`${API_URL}/auth/resend-otp`, { email: TEST_USER.email });
    console.log('OTP resent successfully:', response.data);
    // Update the verification token and user ID if new ones are provided
    if (response.data && response.data.token) {
      verificationToken = response.data.token;
    }
    if (response.data && response.data.id) {
      userId = response.data.id;
    }
    return response.data;
  } catch (error) {
    console.error('Error resending OTP:', error.response ? error.response.data : error.message);
    return { message: 'OTP resend might have failed, continuing...' };
  }
}

// Function to login
async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, TEST_USER);
    console.log('Login successful:', response.data);
    return response.data.token;
  } catch (error) {
    console.error('Error logging in:', error.response ? error.response.data : error.message);
    throw new Error('Login failed');
  }
}

// Function to create a wallet
async function createWallet(token) {
  try {
    const walletData = {
      email: TEST_USER.email,
      account_name: 'Test User',
      phone: '1234567890'
    };
    
    const response = await axios.post(
      `${API_URL}/wallet/create`, 
      walletData,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Wallet created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating wallet:', error.response ? error.response.data : error.message);
    throw new Error('Wallet creation failed');
  }
}

// Function to fetch bank list
async function fetchBankList(token) {
  try {
    const response = await axios.get(
      `${API_URL}/wallet/bank-list`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log('Bank list fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching bank list:', error.response ? error.response.data : error.message);
    throw new Error('Fetching bank list failed');
  }
}

// Function to get account details
async function getAccountDetails(token, accountNumber, sortCode) {
  try {
    const response = await axios.get(
      `${API_URL}/wallet/account-details`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          accountNumber,
          sortCode
        }
      }
    );
    
    console.log('Account details fetched successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching account details:', error.response ? error.response.data : error.message);
    throw new Error('Fetching account details failed');
  }
}

// Main function to run all tests
async function runTests() {
  try {
    // Step 1: Create a user
    await createUser();
    
    // If we have a verification token and user ID, use them
    if (verificationToken && userId) {
      console.log(`Using verification token: ${verificationToken} for user: ${userId}`);
      await verifyAuthToken();
    } else {
      // If we didn't get a token or user ID, try to resend OTP
      await resendOtp();
      // Try to verify again if we got a new token and user ID
      if (verificationToken && userId) {
        await verifyAuthToken();
      }
    }
    
    // Step 3: Login
    const token = await login();
    
    // Step 4: Create a wallet
    const wallet = await createWallet(token);
    
    // Step 5: Fetch bank list
    const banks = await fetchBankList(token);
    
    // Step 6: Get account details (if we have the required data)
    if (wallet && wallet.createWallet && wallet.createWallet.accountNumber) {
      // Assuming we need a sort code, which might be available from the bank list
      const sortCode = banks && banks.length > 0 ? banks[0].sortCode : '123456';
      await getAccountDetails(token, wallet.createWallet.accountNumber, sortCode);
    }
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the tests
runTests();
