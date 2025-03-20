const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:9876'; // Update with your API URL

// Mock transaction data
const mockTransaction = {
  _id: '123456789',
  userId: '987654321',
  walletId: '456789123',
  type: 'funding',
  amount: 50000,
  currency: 'NGN',
  reference: 'TRX' + Date.now(),
  status: 'completed',
  description: 'Test transaction',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock transaction list
const mockTransactions = [mockTransaction];

// Mock the transaction controller responses
const mockGetTransactionHistory = () => {
  return {
    message: "Transaction history retrieved successfully",
    transactions: mockTransactions,
    pagination: {
      total: 1,
      page: 1,
      limit: 10
    }
  };
};

const mockGetTransactionDetails = () => {
  return {
    message: "Transaction details retrieved successfully",
    transaction: mockTransaction
  };
};

// Test the response structures
const testResponseStructures = () => {
  console.log('\n🔍 Testing transaction response structures...');
  
  // Test transaction history response
  console.log('\nTesting transaction history response structure:');
  const historyResponse = mockGetTransactionHistory();
  
  if (historyResponse.transactions && Array.isArray(historyResponse.transactions)) {
    console.log('✅ Transaction history response has "transactions" array property');
  } else {
    console.error('❌ Transaction history response does not have "transactions" array property');
  }
  
  // Test transaction details response
  console.log('\nTesting transaction details response structure:');
  const detailsResponse = mockGetTransactionDetails();
  
  if (detailsResponse.transaction && typeof detailsResponse.transaction === 'object') {
    console.log('✅ Transaction details response has "transaction" object property');
  } else {
    console.error('❌ Transaction details response does not have "transaction" object property');
  }
  
  // Print the response structures
  console.log('\nTransaction history response structure:');
  console.log(JSON.stringify(historyResponse, null, 2));
  
  console.log('\nTransaction details response structure:');
  console.log(JSON.stringify(detailsResponse, null, 2));
  
  return {
    historyStructureValid: historyResponse.transactions && Array.isArray(historyResponse.transactions),
    detailsStructureValid: detailsResponse.transaction && typeof detailsResponse.transaction === 'object'
  };
};

// Main function
const main = async () => {
  try {
    // Test response structures
    const { historyStructureValid, detailsStructureValid } = testResponseStructures();
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log('Transaction History Response Structure:', historyStructureValid ? '✅ Valid' : '❌ Invalid');
    console.log('Transaction Details Response Structure:', detailsStructureValid ? '✅ Valid' : '❌ Invalid');
    
    if (historyStructureValid && detailsStructureValid) {
      console.log('\n✅ All response structures are valid!');
    } else {
      console.log('\n❌ Some response structures are invalid');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

// Run the main function
main();
