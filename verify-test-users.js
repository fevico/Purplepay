const mongoose = require('mongoose');
const chalk = require('chalk');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/purplepay')
  .then(() => console.log(chalk.green('Connected to MongoDB')))
  .catch(err => console.error(chalk.red('MongoDB connection error:', err)));

// Define User schema
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  verified: Boolean
});

// Create User model
const User = mongoose.model('User', UserSchema);

// Test users to verify
const TEST_USERS = [
  'user1@example.com',
  'user2@example.com'
];

// Verify users
const verifyUsers = async () => {
  console.log(chalk.yellow('================================================='));
  console.log(chalk.yellow('     VERIFYING TEST USERS FOR SPLIT PAYMENT'));
  console.log(chalk.yellow('================================================='));
  
  for (const email of TEST_USERS) {
    console.log(chalk.blue(`\n===== Verifying User ${email} =====`));
    
    try {
      // Find the user
      const user = await User.findOne({ email });
      
      if (!user) {
        console.log(chalk.red(`User ${email} not found in database`));
        continue;
      }
      
      // Update verification status
      user.verified = true;
      await user.save();
      
      console.log(chalk.green(`User ${email} verified successfully!`));
    } catch (error) {
      console.error(chalk.red(`Error verifying user ${email}:`, error.message));
    }
  }
  
  console.log(chalk.green('\n===== User verification complete ====='));
  
  // Close MongoDB connection
  mongoose.connection.close();
};

// Run the verification
verifyUsers();
