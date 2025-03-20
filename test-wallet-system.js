const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Load environment variables
dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/purplepay';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create Express app
const app = express();

// Middleware
app.use(cors({ origin: "*", credentials: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true },
  password: { type: String },
  phoneNumber: { type: Number },
  country: { type: String },
  verified: { type: Boolean, default: false },
  role: { type: String, default: "user" },
  tag: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  transactionPin: {
    type: String,
    default: null
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  if (this.isModified('transactionPin') && this.transactionPin) {
    const salt = await bcrypt.genSalt(10);
    this.transactionPin = await bcrypt.hash(this.transactionPin, salt);
  }
  
  next();
});

const User = mongoose.model('User', userSchema);

// Wallet Schema
const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'NGN'
  },
  isActive: {
    type: Boolean,
    default: true
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

const Wallet = mongoose.model('Wallet', walletSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'transfer', 'bill_payment', 'card_funding'],
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
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  reference: {
    type: String,
    required: true,
    unique: true
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

const Transaction = mongoose.model('Transaction', transactionSchema);

// Authentication middleware
const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = { id: decoded.id };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Transaction PIN middleware
const verifyTransactionPin = async (req, res, next) => {
  try {
    const { transactionPin } = req.body;
    
    if (!transactionPin) {
      return res.status(400).json({ message: 'Transaction PIN is required' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.transactionPin) {
      return res.status(400).json({ message: 'Transaction PIN not set' });
    }
    
    const isMatch = await bcrypt.compare(transactionPin, user.transactionPin);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid transaction PIN' });
    }
    
    next();
  } catch (error) {
    console.error('Transaction PIN verification error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to generate reference
const generateReference = () => {
  return `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phoneNumber, country } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      phoneNumber,
      country
    });
    
    await user.save();
    
    // Create wallet for user
    const wallet = new Wallet({
      userId: user._id
    });
    
    await wallet.save();
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Wallet routes
app.get('/api/wallet', isAuthenticated, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ userId: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    res.json({ wallet });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/wallet/set-pin', isAuthenticated, async (req, res) => {
  try {
    const { transactionPin } = req.body;
    
    if (!transactionPin || transactionPin.length !== 4 || !/^\d+$/.test(transactionPin)) {
      return res.status(400).json({ message: 'Transaction PIN must be a 4-digit number' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.transactionPin = transactionPin;
    await user.save();
    
    res.json({ message: 'Transaction PIN set successfully' });
  } catch (error) {
    console.error('Set transaction PIN error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/wallet/deposit', isAuthenticated, async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    const wallet = await Wallet.findOne({ userId: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    // Create transaction
    const transaction = new Transaction({
      userId: req.user.id,
      type: 'deposit',
      amount,
      status: 'completed',
      reference: generateReference(),
      description: description || 'Wallet deposit'
    });
    
    await transaction.save();
    
    // Update wallet balance
    wallet.balance += amount;
    wallet.updatedAt = Date.now();
    await wallet.save();
    
    res.json({
      message: 'Deposit successful',
      transaction,
      newBalance: wallet.balance
    });
  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/wallet/withdraw', isAuthenticated, verifyTransactionPin, async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    const wallet = await Wallet.findOne({ userId: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    if (wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    // Create transaction
    const transaction = new Transaction({
      userId: req.user.id,
      type: 'withdrawal',
      amount,
      status: 'completed',
      reference: generateReference(),
      description: description || 'Wallet withdrawal'
    });
    
    await transaction.save();
    
    // Update wallet balance
    wallet.balance -= amount;
    wallet.updatedAt = Date.now();
    await wallet.save();
    
    res.json({
      message: 'Withdrawal successful',
      transaction,
      newBalance: wallet.balance
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/transactions', isAuthenticated, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
const PORT = 9881;
app.listen(PORT, () => {
  console.log(`Wallet system test server is running on port ${PORT}`);
});
