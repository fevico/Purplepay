// Script to create a test user directly in the database
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/purple-pay';
const JWT_SECRET = process.env.JWT_SECRET || 'purplepay-virtual-card-api-secret';

// User schema (simplified version of the actual schema)
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verified: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Create the user model
const User = mongoose.model('User', userSchema);

async function createTestUser() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      connectTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 30000
    });
    console.log('✅ Connected to MongoDB');

    // Check if test user already exists
    const timestamp = Date.now();
    const email = `testuser-${timestamp}@example.com`;
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      console.log('Test user already exists with ID:', existingUser._id);
      
      // Generate token for existing user
      const token = jwt.sign({ userId: existingUser._id.toString() }, JWT_SECRET, { expiresIn: '24h' });
      fs.writeFileSync('test-token.txt', token);
      fs.writeFileSync('simple-token.txt', token);
      
      console.log('✅ Token generated and saved for existing user');
      return existingUser._id;
    }

    // Create a new test user
    console.log('Creating new test user...');
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    
    const newUser = new User({
      name: 'Test User',
      email,
      password: hashedPassword,
      verified: true
    });

    await newUser.save();
    console.log('✅ Test user created with ID:', newUser._id);

    // Generate token for new user
    const token = jwt.sign({ userId: newUser._id.toString() }, JWT_SECRET, { expiresIn: '24h' });
    fs.writeFileSync('test-token.txt', token);
    fs.writeFileSync('simple-token.txt', token);
    
    console.log('✅ Token generated and saved for new user');
    console.log('✅ Email:', email);
    
    return newUser._id;
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createTestUser()
  .then(userId => {
    console.log('Test user ID:', userId);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error in main function:', error);
    process.exit(1);
  });
