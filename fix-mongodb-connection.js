// Script to fix MongoDB connection issues
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/purple-pay';
const CONNECTION_TIMEOUT_MS = 30000; // 30 seconds

async function checkMongoDBConnection() {
  console.log('Checking MongoDB connection...');
  console.log(`Attempting to connect to: ${MONGODB_URI}`);
  
  try {
    // Configure mongoose connection options
    const options = {
      connectTimeoutMS: CONNECTION_TIMEOUT_MS,
      socketTimeoutMS: CONNECTION_TIMEOUT_MS,
      serverSelectionTimeoutMS: CONNECTION_TIMEOUT_MS,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      w: 'majority'
    };
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, options);
    
    console.log('✅ MongoDB connection successful!');
    
    // Check if we can create and retrieve a document
    const TestModel = mongoose.model('TestConnection', new mongoose.Schema({
      name: String,
      timestamp: { type: Date, default: Date.now }
    }));
    
    console.log('Testing document creation and retrieval...');
    
    // Create a test document
    const testDoc = await TestModel.create({
      name: `test-${Date.now()}`
    });
    
    console.log(`Created test document with ID: ${testDoc._id}`);
    
    // Retrieve the test document
    const retrievedDoc = await TestModel.findById(testDoc._id);
    
    if (retrievedDoc) {
      console.log('✅ Document creation and retrieval successful!');
    } else {
      console.log('❌ Failed to retrieve the test document');
    }
    
    // Clean up test collection
    await mongoose.connection.dropCollection('testconnections');
    console.log('Test collection cleaned up');
    
    // Create a .env file with the working MongoDB URI if it doesn't exist
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
      console.log('Creating .env file with working MongoDB URI...');
      fs.writeFileSync(envPath, `MONGODB_URI=${MONGODB_URI}\n`);
      console.log('✅ .env file created successfully');
    } else {
      // Update existing .env file
      let envContent = fs.readFileSync(envPath, 'utf8');
      if (!envContent.includes('MONGODB_URI=')) {
        envContent += `\nMONGODB_URI=${MONGODB_URI}\n`;
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Added MongoDB URI to existing .env file');
      } else {
        // Replace existing MongoDB URI
        envContent = envContent.replace(
          /MONGODB_URI=.*/,
          `MONGODB_URI=${MONGODB_URI}`
        );
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Updated MongoDB URI in existing .env file');
      }
    }
    
    console.log('\nMongoDB connection test completed successfully!');
    console.log('To fix connection issues in your application:');
    console.log('1. Make sure MongoDB is running');
    console.log('2. Use the connection options from this script in your application');
    console.log('3. Increase the connection timeout values if needed');
    console.log('4. Ensure your application is using the correct MongoDB URI');
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('\nTroubleshooting steps:');
    console.error('1. Make sure MongoDB is running on the specified host and port');
    console.error('2. Check if the database name is correct');
    console.error('3. Verify network connectivity to the MongoDB server');
    console.error('4. Check if authentication credentials are required and correct');
    console.error('5. Increase connection timeout values');
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the check
checkMongoDBConnection();
