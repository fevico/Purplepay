// Mock implementation of the createNotification function
function createNotification(userId, typeOrData, title, message, reference) {
  // Check if the first argument is an object (new format) and second argument is undefined
  if (typeof userId === 'object' && userId !== null && typeOrData === undefined) {
    const data = userId;
    console.log('Using object format for notification:');
    console.log({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      reference: data.data?.transactionReference || null,
      data: data.data || null
    });
    return {
      success: true,
      format: 'object'
    };
  } 
  // Using the old format with separate parameters
  else {
    console.log('Using parameter format for notification:');
    console.log({
      userId,
      type: typeOrData,
      title,
      message,
      reference
    });
    return {
      success: true,
      format: 'parameters'
    };
  }
}

// Test both formats
function testNotificationFormats() {
  console.log('\n🔔 Testing notification function with different formats...\n');
  
  // Test with parameter format
  const userId = '123456789';
  const type = 'wallet';
  const title = 'Wallet Funded';
  const message = 'Your wallet has been funded with 50,000 NGN';
  const reference = 'TRX123456789';
  
  console.log('Test 1: Parameter format');
  const result1 = createNotification(userId, type, title, message, reference);
  console.log('Result:', result1);
  
  // Test with object format
  const notificationData = {
    userId: userId,
    type: 'wallet',
    title: 'Funding Completed',
    message: 'Your wallet funding of 50,000 NGN has been completed',
    data: {
      transactionReference: 'TRX987654321',
      amount: 50000
    }
  };
  
  console.log('\nTest 2: Object format');
  const result2 = createNotification(notificationData);
  console.log('Result:', result2);
  
  // Test with parameter format in wallet controller
  console.log('\nTest 3: Simulating wallet controller call');
  const transaction = {
    amount: 50000,
    reference: 'TRX567890123'
  };
  
  const result3 = createNotification(
    userId,
    'wallet',
    'Funding Completed',
    `Your wallet funding of ${transaction.amount} NGN has been completed`,
    transaction.reference
  );
  console.log('Result:', result3);
  
  return {
    parameterFormatValid: result1.success && result1.format === 'parameters',
    objectFormatValid: result2.success && result2.format === 'object',
    walletControllerValid: result3.success && result3.format === 'parameters'
  };
}

// Main function
function main() {
  try {
    // Test notification formats
    const { parameterFormatValid, objectFormatValid, walletControllerValid } = testNotificationFormats();
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log('Parameter Format:', parameterFormatValid ? '✅ Valid' : '❌ Invalid');
    console.log('Object Format:', objectFormatValid ? '✅ Valid' : '❌ Invalid');
    console.log('Wallet Controller Format:', walletControllerValid ? '✅ Valid' : '❌ Invalid');
    
    if (parameterFormatValid && objectFormatValid && walletControllerValid) {
      console.log('\n✅ All notification formats are valid!');
    } else {
      console.log('\n❌ Some notification formats are invalid');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the main function
main();
