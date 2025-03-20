/**
 * Bills Payment API Test Script
 * 
 * This script tests the Bills Payment API endpoints:
 * 1. Initiate a bill payment
 * 2. Process the bill payment
 * 3. Check the bill payment status
 * 4. Get bill payment history
 * 
 * Usage: node test-bills-payment-api.js [options]
 * 
 * Options:
 *   --bill-type=TYPE       Type of bill (electricity, water, internet, tv, education, tax, other)
 *   --provider=PROVIDER    Service provider name
 *   --reference=REF        Reference number for checking status (skips initiation)
 *   --amount=AMOUNT        Amount to pay (default: 5000)
 *   --history-only         Only fetch payment history
 *   --filter=TYPE          Filter history by bill type
 */

const axios = require('axios');
const fs = require('fs');
const readline = require('readline');

// Configuration
const API_URL = 'http://localhost:9876';
let token = '';

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  billType: getArgValue(args, '--bill-type') || 'electricity',
  provider: getArgValue(args, '--provider') || 'IKEDC',
  reference: getArgValue(args, '--reference') || null,
  amount: parseInt(getArgValue(args, '--amount') || '5000'),
  historyOnly: args.includes('--history-only'),
  filter: getArgValue(args, '--filter') || null
};

// Helper function to get argument value
function getArgValue(args, name) {
  const arg = args.find(arg => arg.startsWith(`${name}=`));
  return arg ? arg.split('=')[1] : null;
}

// Helper function to handle API errors
function handleApiError(error) {
  if (error.response) {
    console.error('API Error Response:', {
      status: error.response.status,
      data: error.response.data
    });
  } else if (error.request) {
    console.error('No response received:', error.request);
  } else {
    console.error('Error setting up request:', error.message);
  }
}

// Read token from file or prompt user
async function getToken() {
  try {
    // Try to read token from file
    if (fs.existsSync('jwt-token.txt')) {
      token = fs.readFileSync('jwt-token.txt', 'utf8').trim();
      console.log('Using token from jwt-token.txt');
      return token;
    }
  } catch (error) {
    console.error('Error reading token file:', error.message);
  }
  
  // If no token in file, prompt user
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Enter your JWT token: ', (answer) => {
      token = answer.trim();
      rl.close();
      
      // Save token to file for future use
      fs.writeFileSync('jwt-token.txt', token);
      console.log('Token saved to jwt-token.txt for future use');
      
      resolve(token);
    });
  });
}

// Initiate a bill payment
async function initiateBillPayment() {
  console.log(`\n=== Initiating ${options.billType} bill payment ===`);
  
  try {
    // Prepare metadata based on bill type
    let metadata = {};
    
    switch(options.billType) {
      case 'electricity':
        metadata = {
          service_id: `${options.provider.toLowerCase()}_prepaid`,
          variation_code: 'prepaid'
        };
        break;
      case 'tv':
        metadata = {
          service_id: options.provider.toLowerCase(),
          variation_code: `${options.provider.toLowerCase()}-basic`
        };
        break;
      case 'internet':
        metadata = {
          service_id: `${options.provider.toLowerCase()}_data`,
          variation_code: `${options.provider.toLowerCase()}-5gb`
        };
        break;
      case 'water':
        metadata = {
          service_id: options.provider.toLowerCase(),
          customer_name: 'Test Customer'
        };
        break;
      default:
        metadata = {
          service_id: options.provider.toLowerCase()
        };
    }
    
    // Create request payload
    const payload = {
      billType: options.billType,
      provider: options.provider,
      customerReference: '12345678901',
      amount: options.amount,
      currency: 'NGN',
      metadata: metadata
    };
    
    console.log('Request Payload:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Make API call
    const response = await axios.post(`${API_URL}/billsPayment/initiate`, payload, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('\nInitiate Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.reference;
  } catch (error) {
    console.error('Error initiating bill payment:');
    handleApiError(error);
    return null;
  }
}

// Process a bill payment
async function processBillPayment(reference) {
  console.log(`\n=== Processing bill payment with reference: ${reference} ===`);
  
  try {
    const response = await axios.post(`${API_URL}/billsPayment/process/${reference}`, {}, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Process Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error processing bill payment:');
    handleApiError(error);
    return false;
  }
}

// Check bill payment status
async function checkBillPaymentStatus(reference) {
  console.log(`\n=== Checking bill payment status for reference: ${reference} ===`);
  
  try {
    const response = await axios.get(`${API_URL}/billsPayment/status/${reference}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Status Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.status;
  } catch (error) {
    console.error('Error checking bill payment status:');
    handleApiError(error);
    return null;
  }
}

// Get bill payment history
async function getBillPaymentHistory() {
  console.log('\n=== Getting bill payment history ===');
  
  try {
    // Build query string for filters
    let queryParams = '';
    if (options.filter) {
      queryParams = `?billType=${options.filter}`;
    }
    
    const response = await axios.get(`${API_URL}/billsPayment/history${queryParams}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('History Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error getting bill payment history:');
    handleApiError(error);
    return null;
  }
}

// Main function
async function main() {
  try {
    // Get token
    await getToken();
    
    // If history only flag is set, just get history
    if (options.historyOnly) {
      await getBillPaymentHistory();
      return;
    }
    
    // Use provided reference or initiate a new payment
    let reference = options.reference;
    if (!reference) {
      reference = await initiateBillPayment();
      if (!reference) {
        console.error('Failed to initiate bill payment, cannot continue.');
        return;
      }
      
      // Process the payment
      const processed = await processBillPayment(reference);
      if (!processed) {
        console.error('Failed to process bill payment, cannot continue.');
        return;
      }
    }
    
    // Check status
    await checkBillPaymentStatus(reference);
    
    // Get history
    await getBillPaymentHistory();
    
    console.log('\n=== Test completed successfully ===');
  } catch (error) {
    console.error('Unhandled error in main function:', error);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
});
