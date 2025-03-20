const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/purplepay';
const USER_ID = '67da9f93ff21f937aa28f92b'; // The user ID we're trying to use

async function verifyUserId() {
  try {
    console.log(`Connecting to MongoDB at: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    
    // Get the users collection
    const usersCollection = mongoose.connection.collection('users');
    
    // Try to find the user with the specified ID
    console.log(`Searching for user with ID: ${USER_ID}`);
    
    try {
      const user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(USER_ID) });
      
      if (user) {
        console.log(' User found:');
        console.log(`- ID: ${user._id}`);
        console.log(`- Name: ${user.name}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Verified: ${user.verified}`);
      } else {
        console.log(' No user found with that ID');
        
        // List some users to help identify a valid ID
        console.log('\nListing available users:');
        const users = await usersCollection.find({}).limit(5).toArray();
        
        if (users.length > 0) {
          users.forEach((user, index) => {
            console.log(`\nUser ${index + 1}:`);
            console.log(`- ID: ${user._id}`);
            console.log(`- Name: ${user.name || 'N/A'}`);
            console.log(`- Email: ${user.email || 'N/A'}`);
          });
        } else {
          console.log('No users found in the database');
        }
      }
    } catch (error) {
      console.error('Error searching for user:', error.message);
      
      // If the error is related to invalid ObjectId, list some users
      if (error.message.includes('ObjectId')) {
        console.log('\nListing available users:');
        const users = await usersCollection.find({}).limit(5).toArray();
        
        if (users.length > 0) {
          users.forEach((user, index) => {
            console.log(`\nUser ${index + 1}:`);
            console.log(`- ID: ${user._id}`);
            console.log(`- Name: ${user.name || 'N/A'}`);
            console.log(`- Email: ${user.email || 'N/A'}`);
          });
        } else {
          console.log('No users found in the database');
        }
      }
    }
    
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
  }
}

verifyUserId().catch(console.error);
