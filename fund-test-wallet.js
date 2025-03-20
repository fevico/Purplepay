/**
 * Script to fund a test wallet for Purplepay backend testing
 * 
 * This script directly updates the wallet balance in the database
 * to allow for proper testing of transfer functionality.
 * 
 * Run with: node fund-test-wallet.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Define wallet schema
    const walletSchema = new mongoose.Schema({
      balance: {
        type: Number,
        required: true,
        default: 0
      },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    });
    
    // Define transaction schema for creating a funding transaction
    const transactionSchema = new mongoose.Schema({
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true
      },
      type: {
        type: String,
        enum: ['funding', 'withdrawal', 'transfer'],
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      currency: {
        type: String,
        default: 'NGN'
      },
      reference: {
        type: String,
        required: true,
        unique: true
      },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      description: {
        type: String
      },
      metadata: {
        type: Object
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      updatedAt: {
        type: Date,
        default: Date.now
      }
    });
    
    // Create models
    const Wallet = mongoose.model('Wallet', walletSchema);
    const Transaction = mongoose.model('Transaction', transactionSchema);
    
    // Function to fund wallet
    const fundWallet = async (email, amount) => {
      try {
        // Find user by email
        const User = mongoose.model('User', new mongoose.Schema({
          email: String
        }));
        
        const user = await User.findOne({ email });
        
        if (!user) {
          console.error(`User with email ${email} not found`);
          return;
        }
        
        // Find wallet by userId
        const wallet = await Wallet.findOne({ userId: user._id });
        
        if (!wallet) {
          console.error(`Wallet for user ${email} not found`);
          return;
        }
        
        // Update wallet balance
        const oldBalance = wallet.balance;
        wallet.balance += amount;
        wallet.updatedAt = new Date();
        await wallet.save();
        
        // Create a funding transaction
        const reference = `FUND_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
        const transaction = new Transaction({
          userId: user._id,
          walletId: wallet._id,
          type: 'funding',
          amount,
          reference,
          status: 'completed',
          description: 'Test wallet funding',
          metadata: {
            method: 'direct_update',
            purpose: 'testing'
          }
        });
        
        await transaction.save();
        
        console.log(`✅ Wallet funded successfully!`);
        console.log(`User: ${email}`);
        console.log(`Wallet ID: ${wallet._id}`);
        console.log(`Previous Balance: ${oldBalance}`);
        console.log(`New Balance: ${wallet.balance}`);
        console.log(`Transaction Reference: ${reference}`);
        
      } catch (error) {
        console.error('Error funding wallet:', error);
      } finally {
        mongoose.connection.close();
      }
    };
    
    // Ask for user email and amount
    rl.question('Enter user email: ', (email) => {
      rl.question('Enter amount to fund (NGN): ', (amountStr) => {
        const amount = parseInt(amountStr, 10);
        
        if (isNaN(amount) || amount <= 0) {
          console.error('Invalid amount. Please enter a positive number.');
          rl.close();
          mongoose.connection.close();
          return;
        }
        
        fundWallet(email, amount)
          .then(() => {
            rl.close();
          })
          .catch(error => {
            console.error('Error:', error);
            rl.close();
            mongoose.connection.close();
          });
      });
    });
    
  })
  .catch(error => {
    console.error('MongoDB connection error:', error);
  });
