const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const API_URL = 'http://localhost:9876'; // Change this to your API URL
let TOKEN = ''; // Will be set by user input

// Headers with authentication
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
});

// Test data
const testBillPayment = {
  billType: 'electricity',
  provider: 'IKEDC',
  customerReference: '12345678901',
  amount: 5000,
  currency: 'NGN',
  metadata: {
    service_id: 'ikedc_prepaid',
    variation_code: 'prepaid'
  }
};

// Utility function to prompt user
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Test functions
async function testInitiateBillPayment() {
  try {
    console.log('\n=== Testing Initiate Bill Payment ===');
    
    // Allow customization of test data
    const customize = await prompt('Do you want to customize the bill payment data? (y/n): ');
    
    let paymentData = { ...testBillPayment };
    
    if (customize.toLowerCase() === 'y') {
      console.log('Current test data:', JSON.stringify(paymentData, null, 2));
      
      const billType = await prompt('Bill type (electricity, water, internet, tv, education, tax, other) [electricity]: ');
      const provider = await prompt('Provider [IKEDC]: ');
      const customerReference = await prompt('Customer reference [12345678901]: ');
      const amount = await prompt('Amount [5000]: ');
      
      if (billType) paymentData.billType = billType;
      if (provider) paymentData.provider = provider;
      if (customerReference) paymentData.customerReference = customerReference;
      if (amount) paymentData.amount = Number(amount);
    }
    
    console.log('Request:', JSON.stringify(paymentData, null, 2));
    
    const response = await axios.post(`${API_URL}/billsPayment/initiate`, paymentData, { 
      headers: getHeaders() 
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    // Save reference for further tests
    if (response.data.reference) {
      global.billPaymentReference = response.data.reference;
      console.log(`\nSaved reference: ${global.billPaymentReference} for further tests`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error initiating bill payment:', error.response?.data || error.message);
    return null;
  }
}

async function testProcessBillPayment() {
  try {
    if (!global.billPaymentReference) {
      const reference = await prompt('Enter bill payment reference: ');
      global.billPaymentReference = reference;
    }
    
    console.log('\n=== Testing Process Bill Payment ===');
    console.log(`Processing payment with reference: ${global.billPaymentReference}`);
    
    const response = await axios.post(`${API_URL}/billsPayment/process/${global.billPaymentReference}`, {}, { 
      headers: getHeaders() 
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error processing bill payment:', error.response?.data || error.message);
    return null;
  }
}

async function testGetBillPaymentStatus() {
  try {
    if (!global.billPaymentReference) {
      const reference = await prompt('Enter bill payment reference: ');
      global.billPaymentReference = reference;
    }
    
    console.log('\n=== Testing Get Bill Payment Status ===');
    console.log(`Getting status for reference: ${global.billPaymentReference}`);
    
    const response = await axios.get(`${API_URL}/billsPayment/status/${global.billPaymentReference}`, { 
      headers: getHeaders() 
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error getting bill payment status:', error.response?.data || error.message);
    return null;
  }
}

async function testGetBillPaymentHistory() {
  try {
    console.log('\n=== Testing Get Bill Payment History ===');
    
    // Ask for filters
    const useFilters = await prompt('Do you want to apply filters? (y/n): ');
    
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', 1);
    params.append('limit', 10);
    
    if (useFilters.toLowerCase() === 'y') {
      const billType = await prompt('Filter by bill type (leave empty for no filter): ');
      const provider = await prompt('Filter by provider (leave empty for no filter): ');
      const status = await prompt('Filter by status (pending, completed, failed) (leave empty for no filter): ');
      
      if (billType) params.append('billType', billType);
      if (provider) params.append('provider', provider);
      if (status) params.append('status', status);
    }
    
    console.log(`Getting bill payment history with params: ${params.toString()}`);
    
    const response = await axios.get(`${API_URL}/billsPayment/history?${params.toString()}`, { 
      headers: getHeaders() 
    });
    
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('Error getting bill payment history:', error.response?.data || error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('=== Bills Payment API Test Script ===');
  
  // Get token
  TOKEN = await prompt('Enter your JWT token: ');
  
  if (!TOKEN) {
    console.log('Token is required. Please run login-test.js to get a token.');
    rl.close();
    return;
  }
  
  while (true) {
    console.log('\nAvailable Tests:');
    console.log('1. Initiate Bill Payment');
    console.log('2. Process Bill Payment');
    console.log('3. Get Bill Payment Status');
    console.log('4. Get Bill Payment History');
    console.log('5. Run All Tests');
    console.log('0. Exit');
    
    const choice = await prompt('\nSelect a test to run (0-5): ');
    
    switch (choice) {
      case '1':
        await testInitiateBillPayment();
        break;
      case '2':
        await testProcessBillPayment();
        break;
      case '3':
        await testGetBillPaymentStatus();
        break;
      case '4':
        await testGetBillPaymentHistory();
        break;
      case '5':
        await testInitiateBillPayment();
        await testProcessBillPayment();
        await testGetBillPaymentStatus();
        await testGetBillPaymentHistory();
        break;
      case '0':
        console.log('Exiting test script...');
        rl.close();
        return;
      default:
        console.log('Invalid choice. Please select a number between 0 and 5.');
    }
    
    await prompt('\nPress Enter to continue...');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  rl.close();
});
