/**
 * Quick script to fund a test wallet for Purplepay backend testing
 * 
 * This script directly updates the wallet balance in the database
 * with hardcoded values for quick testing.
 * 
 * Run with: node quick-fund-wallet.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

// Configuration - CHANGE THESE VALUES AS NEEDED
const TEST_USER_EMAIL = 'test@example.com';
const AMOUNT_TO_FUND = 50000; // NGN

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

console.log('Connecting to MongoDB...');
console.log('Using connection string:', MONGODB_URI);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Define wallet schema
    const walletSchema = new mongoose.Schema({
      balance: Number,
      userId: mongoose.Schema.Types.ObjectId,
      createdAt: Date,
      updatedAt: Date
    });
    
    // Define user schema
    const userSchema = new mongoose.Schema({
      email: String
    });
    
    // Define transaction schema
    const transactionSchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      walletId: mongoose.Schema.Types.ObjectId,
      type: String,
      amount: Number,
      currency: String,
      reference: String,
      status: String,
      description: String,
      metadata: Object,
      createdAt: Date,
      updatedAt: Date
    });
    
    // Create models
    const Wallet = mongoose.model('Wallet', walletSchema);
    const User = mongoose.model('User', userSchema);
    const Transaction = mongoose.model('Transaction', transactionSchema);
    
    console.log(`Looking for user with email: ${TEST_USER_EMAIL}`);
    
    // Find user by email
    User.findOne({ email: TEST_USER_EMAIL })
      .then(user => {
        if (!user) {
          console.error(`User with email ${TEST_USER_EMAIL} not found`);
          mongoose.connection.close();
          return;
        }
        
        console.log(`Found user: ${user._id}`);
        
        // Find wallet by userId
        return Wallet.findOne({ userId: user._id })
          .then(wallet => {
            if (!wallet) {
              console.error(`Wallet for user ${TEST_USER_EMAIL} not found`);
              mongoose.connection.close();
              return;
            }
            
            console.log(`Found wallet: ${wallet._id} with balance: ${wallet.balance}`);
            
            // Update wallet balance
            const oldBalance = wallet.balance;
            wallet.balance += AMOUNT_TO_FUND;
            wallet.updatedAt = new Date();
            
            return wallet.save()
              .then(() => {
                // Create a funding transaction
                const reference = `FUND_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
                const transaction = new Transaction({
                  userId: user._id,
                  walletId: wallet._id,
                  type: 'funding',
                  amount: AMOUNT_TO_FUND,
                  currency: 'NGN',
                  reference,
                  status: 'completed',
                  description: 'Test wallet funding',
                  metadata: {
                    method: 'direct_update',
                    purpose: 'testing'
                  },
                  createdAt: new Date(),
                  updatedAt: new Date()
                });
                
                return transaction.save()
                  .then(() => {
                    console.log(`✅ Wallet funded successfully!`);
                    console.log(`User: ${TEST_USER_EMAIL}`);
                    console.log(`Wallet ID: ${wallet._id}`);
                    console.log(`Previous Balance: ${oldBalance}`);
                    console.log(`New Balance: ${wallet.balance}`);
                    console.log(`Transaction Reference: ${reference}`);
                    
                    mongoose.connection.close();
                  });
              });
          });
      })
      .catch(error => {
        console.error('Error:', error);
        mongoose.connection.close();
      });
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
  });
