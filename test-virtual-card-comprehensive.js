// Comprehensive test script for Virtual Card API
const axios = require('axios');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

// Configuration
const API_URL = 'http://localhost:9877';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/purple-pay';

// Load token from file
let token;
try {
  token = fs.readFileSync('clean-token.txt', 'utf8').trim();
  console.log('Token loaded from file:', token.substring(0, 20) + '...');
} catch (error) {
  console.error('Error loading token:', error.message);
  process.exit(1);
}

// Create a simple User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  verified: Boolean
});

async function runTest() {
  let connection;
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    connection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000
    });
    console.log('✅ Connected to MongoDB');

    // Get the User model
    const User = mongoose.model('User', userSchema);

    // Find the user from the token
    const decoded = require('jsonwebtoken').decode(token);
    console.log('Token decoded:', decoded);

    if (!decoded || !decoded.userId) {
      throw new Error('Invalid token: userId not found');
    }

    const user = await User.findById(decoded.userId);
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('Creating test user in database...');
      const newUser = new User({
        _id: decoded.userId,
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword',
        verified: true
      });
      await newUser.save();
      console.log('✅ Test user created in database');
    }

    console.log('\n🧪 COMPREHENSIVE VIRTUAL CARD API TEST 🧪\n');
    
    // Generate unique identifiers for this test run
    const timestamp = Date.now();
    const testId = `test-${timestamp}`;
    
    // Test results tracking
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
    
    // Helper function to track test results
    function recordTestResult(testName, passed, response = null, error = null) {
      results.total++;
      if (passed) {
        results.passed++;
        console.log(`✅ ${testName} - PASSED`);
      } else {
        results.failed++;
        console.log(`❌ ${testName} - FAILED`);
        if (error) {
          console.error('  Error:', error.message);
          if (error.response) {
            console.error('  Status:', error.response.status);
            console.error('  Data:', JSON.stringify(error.response.data, null, 2));
          }
        }
      }
      
      results.tests.push({
        name: testName,
        passed,
        timestamp: new Date().toISOString(),
        response: response ? JSON.stringify(response) : null,
        error: error ? error.message : null
      });
    }

    // 1. Customer Creation
    console.log('\n1. CUSTOMER CREATION');
    console.log('-------------------');
    
    let customerEmail;
    let customerId;
    
    try {
      const customerData = {
        firstName: 'John',
        lastName: 'Doe',
        customerEmail: `customer-${testId}@example.com`,
        phoneNumber: '08012345678',
        dateOfBirth: '1990-01-01',
        idImage: 'https://example.com/id-image.jpg',
        userPhoto: 'https://example.com/user-photo.jpg',
        line1: '123 Test Street',
        state: 'Accra',
        zipCode: '00233',
        city: 'Accra',
        country: 'Ghana',
        idType: 'PASSPORT',
        houseNumber: '123',
        idNumber: `PASS-${testId}`
      };

      console.log('Creating customer with email:', customerData.customerEmail);
      
      const response = await axios.post(
        `${API_URL}/card/create-customer`,
        customerData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      customerEmail = response.data.response.customerEmail;
      customerId = response.data.response.customerId;
      
      console.log('Customer created with ID:', customerId);
      recordTestResult('Customer Creation', true, response.data);
    } catch (error) {
      recordTestResult('Customer Creation', false, null, error);
    }

    // 2. Card Creation
    console.log('\n2. CARD CREATION');
    console.log('---------------');
    
    let cardId;
    
    try {
      if (!customerEmail) throw new Error('Customer email not available from previous test');
      
      const cardData = {
        name_on_card: 'John Doe',
        amount: 5000,
        customerEmail
      };
      
      console.log('Creating card for customer:', customerEmail);
      
      const response = await axios.post(
        `${API_URL}/card/create-card`,
        cardData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      cardId = response.data.response.card_id;
      
      console.log('Card created with ID:', cardId);
      recordTestResult('Card Creation', true, response.data);
    } catch (error) {
      recordTestResult('Card Creation', false, null, error);
    }

    // 3. Fund Card
    console.log('\n3. FUND CARD');
    console.log('-----------');
    
    try {
      if (!cardId) throw new Error('Card ID not available from previous test');
      
      const fundData = {
        card_id: cardId,
        amount: 10000
      };
      
      console.log('Funding card with ID:', cardId);
      
      const response = await axios.post(
        `${API_URL}/card/fund-card`,
        fundData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      recordTestResult('Fund Card', true, response.data);
    } catch (error) {
      recordTestResult('Fund Card', false, null, error);
    }

    // 4. Card Details
    console.log('\n4. CARD DETAILS');
    console.log('--------------');
    
    try {
      if (!cardId) throw new Error('Card ID not available from previous test');
      
      console.log('Getting details for card ID:', cardId);
      
      const response = await axios.post(
        `${API_URL}/card/card-details`,
        { card_id: cardId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      recordTestResult('Card Details', true, response.data);
    } catch (error) {
      recordTestResult('Card Details', false, null, error);
    }

    // 5. Card Transactions
    console.log('\n5. CARD TRANSACTIONS');
    console.log('-------------------');
    
    try {
      if (!cardId) throw new Error('Card ID not available from previous test');
      
      console.log('Getting transactions for card ID:', cardId);
      
      const response = await axios.post(
        `${API_URL}/card/card-transactions`,
        { card_id: cardId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      recordTestResult('Card Transactions', true, response.data);
    } catch (error) {
      recordTestResult('Card Transactions', false, null, error);
    }

    // 6. Freeze Card
    console.log('\n6. FREEZE CARD');
    console.log('-------------');
    
    try {
      if (!cardId) throw new Error('Card ID not available from previous test');
      
      console.log('Freezing card with ID:', cardId);
      
      const response = await axios.post(
        `${API_URL}/card/freeze-unfreze-card`,
        { card_id: cardId, status: 'freeze' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      recordTestResult('Freeze Card', true, response.data);
    } catch (error) {
      recordTestResult('Freeze Card', false, null, error);
    }

    // 7. Unfreeze Card
    console.log('\n7. UNFREEZE CARD');
    console.log('---------------');
    
    try {
      if (!cardId) throw new Error('Card ID not available from previous test');
      
      console.log('Unfreezing card with ID:', cardId);
      
      const response = await axios.post(
        `${API_URL}/card/freeze-unfreze-card`,
        { card_id: cardId, status: 'unfreeze' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      recordTestResult('Unfreeze Card', true, response.data);
    } catch (error) {
      recordTestResult('Unfreeze Card', false, null, error);
    }

    // 8. Card History
    console.log('\n8. CARD HISTORY');
    console.log('--------------');
    
    try {
      if (!cardId) throw new Error('Card ID not available from previous test');
      
      console.log('Getting history for card ID:', cardId);
      
      const response = await axios.get(
        `${API_URL}/card/card-history?card_id=${cardId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      recordTestResult('Card History', true, response.data);
    } catch (error) {
      recordTestResult('Card History', false, null, error);
    }

    // 9. Withdraw from Card
    console.log('\n9. WITHDRAW FROM CARD');
    console.log('--------------------');
    
    try {
      if (!cardId) throw new Error('Card ID not available from previous test');
      
      console.log('Withdrawing from card ID:', cardId);
      
      const response = await axios.post(
        `${API_URL}/card/withdraw-from-card`,
        { 
          card_id: cardId,
          amount: 1000,
          account_number: '1234567890',
          account_name: 'John Doe',
          bank_name: 'Test Bank'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      recordTestResult('Withdraw from Card', true, response.data);
    } catch (error) {
      recordTestResult('Withdraw from Card', false, null, error);
    }

    // 10. Card Status
    console.log('\n10. CARD STATUS');
    console.log('--------------');
    
    try {
      if (!cardId) throw new Error('Card ID not available from previous test');
      
      console.log('Getting status for card ID:', cardId);
      
      const response = await axios.post(
        `${API_URL}/card/card-status`,
        { card_id: cardId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Response:', JSON.stringify(response.data, null, 2));
      recordTestResult('Card Status', true, response.data);
    } catch (error) {
      recordTestResult('Card Status', false, null, error);
    }

    // Print test summary
    console.log('\n📊 TEST SUMMARY');
    console.log('==============');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
    
    // Save test results to file
    const resultsFilename = `test-results-${timestamp}.json`;
    fs.writeFileSync(resultsFilename, JSON.stringify(results, null, 2));
    console.log(`\nTest results saved to ${resultsFilename}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  } finally {
    // Close MongoDB connection
    if (connection) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the test
runTest();
