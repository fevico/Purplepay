const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876'; // Update with your API URL
const AUTH_TOKEN = 'YOUR_AUTH_TOKEN'; // Replace with a valid auth token

// Helper function for API calls
const apiCall = async (method, endpoint, data = null, auth = true) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (auth && AUTH_TOKEN) {
      headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
    }
    
    const config = {
      method,
      url: `${API_URL}${endpoint}`,
      headers,
      data: data ? data : undefined
    };
    
    const response = await axios(config);
    console.log(`✅ ${method.toUpperCase()} ${endpoint} - Success`);
    return response.data;
  } catch (error) {
    console.error(`❌ ${method.toUpperCase()} ${endpoint} - Failed:`, 
      error.response ? error.response.data : error.message);
    return null;
  }
};

// Test transaction filtering
const testTransactionFiltering = async () => {
  console.log('\n🔍 Testing transaction filtering...');
  
  // Test with no filters
  console.log('\nGetting all transactions...');
  const allTransactions = await apiCall('get', '/transactions');
  
  if (allTransactions && allTransactions.transactions) {
    console.log(`Found ${allTransactions.transactions.length} transactions`);
    console.log('Pagination:', allTransactions.pagination);
    
    // Test with type filter
    console.log('\nGetting funding transactions...');
    const fundingTransactions = await apiCall('get', '/transactions?type=funding');
    
    if (fundingTransactions && fundingTransactions.transactions) {
      console.log(`Found ${fundingTransactions.transactions.length} funding transactions`);
      
      // Test transaction details
      if (fundingTransactions.transactions.length > 0) {
        const reference = fundingTransactions.transactions[0].reference;
        console.log(`\nGetting details for transaction ${reference}...`);
        
        const transactionDetails = await apiCall('get', `/transactions/${reference}`);
        
        if (transactionDetails && transactionDetails.transaction) {
          console.log('Transaction details retrieved successfully!');
          console.log('Transaction:', transactionDetails.transaction);
          
          // Test transaction summary
          console.log('\nGetting transaction summary...');
          const summary = await apiCall('get', '/transactions/summary');
          
          if (summary) {
            console.log('Transaction summary retrieved successfully!');
            console.log('Summary:', summary);
            return true;
          }
        }
      }
    }
  }
  
  return false;
};

// Main function
const main = async () => {
  try {
    // Test transaction filtering
    const filteringResult = await testTransactionFiltering();
    
    if (filteringResult) {
      console.log('\n✅ All transaction filtering tests passed successfully!');
    } else {
      console.log('\n❌ Some transaction filtering tests failed');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the main function
main();
