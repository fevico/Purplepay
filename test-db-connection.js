/**
 * Test MongoDB connection
 */
const mongoose = require('mongoose');
require('dotenv').config();

// For local MongoDB or Docker container
const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/purple-pay";

console.log('Attempting to connect to MongoDB at:', uri);

// Increase the connection timeout to 30 seconds
mongoose.connect(uri, {
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000, // Socket timeout
  connectTimeoutMS: 30000, // Connection timeout
})
.then(() => {
  console.log('✅ Successfully connected to MongoDB!');
  
  // List all collections in the database
  return mongoose.connection.db.listCollections().toArray();
})
.then(collections => {
  console.log('\n📊 Database collections:');
  if (collections.length === 0) {
    console.log('No collections found. Database might be empty.');
  } else {
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
  }
  
  // Close the connection
  return mongoose.connection.close();
})
.then(() => {
  console.log('\n✅ Connection closed successfully.');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  if (err.name === 'MongoServerSelectionError') {
    console.error('\n⚠️ Could not select a MongoDB server. Possible causes:');
    console.error('1. MongoDB server is not running');
    console.error('2. Connection string is incorrect');
    console.error('3. Network issues preventing connection');
    console.error('4. Authentication failed');
  }
  process.exit(1);
});
