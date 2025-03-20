// Test script for Virtual Card API with database connection
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

async function testVirtualCardAPI() {
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

    console.log('\nTesting Virtual Card API with token\n');

    // 1. Test customer creation
    console.log('1. Testing customer creation...');
    const timestamp = Date.now();
    const customerData = {
      firstName: 'John',
      lastName: 'Doe',
      customerEmail: `customer-${timestamp}@example.com`,
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
      idNumber: `PASS${timestamp}`
    };

    const customerResponse = await axios.post(
      `${API_URL}/card/create-customer`,
      customerData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Customer creation response:', JSON.stringify(customerResponse.data, null, 2));
    console.log('✅ Customer created successfully');

    const customerEmail = customerResponse.data.response.customerEmail;

    // 2. Test card creation
    console.log('\n2. Testing card creation...');
    const cardData = {
      name_on_card: 'John Doe',
      amount: 5000,
      customerEmail
    };

    const cardResponse = await axios.post(
      `${API_URL}/card/create-card`,
      cardData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Card creation response:', JSON.stringify(cardResponse.data, null, 2));
    console.log('✅ Card created successfully');

    const cardId = cardResponse.data.response.card_id;

    // 3. Test fund card
    console.log('\n3. Testing card funding...');
    const fundData = {
      card_id: cardId,
      amount: 10000
    };

    const fundResponse = await axios.post(
      `${API_URL}/card/fund-card`,
      fundData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Card funding response:', JSON.stringify(fundResponse.data, null, 2));
    console.log('✅ Card funded successfully');

    // 4. Test card details
    console.log('\n4. Testing card details...');
    const detailsResponse = await axios.post(
      `${API_URL}/card/card-details`,
      { card_id: cardId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Card details response:', JSON.stringify(detailsResponse.data, null, 2));
    console.log('✅ Card details retrieved successfully');

    // 5. Test freeze card
    console.log('\n5. Testing freeze card...');
    const freezeResponse = await axios.post(
      `${API_URL}/card/freeze-unfreze-card`,
      { card_id: cardId, status: 'freeze' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Freeze card response:', JSON.stringify(freezeResponse.data, null, 2));
    console.log('✅ Card frozen successfully');

    // 6. Test unfreeze card
    console.log('\n6. Testing unfreeze card...');
    const unfreezeResponse = await axios.post(
      `${API_URL}/card/freeze-unfreze-card`,
      { card_id: cardId, status: 'unfreeze' },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('Unfreeze card response:', JSON.stringify(unfreezeResponse.data, null, 2));
    console.log('✅ Card unfrozen successfully');

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', JSON.stringify(error.response.headers, null, 2));
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
testVirtualCardAPI();
