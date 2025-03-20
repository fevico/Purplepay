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

// Virtual Card Schema
const virtualCardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cardNumber: {
    type: String,
    required: true
  },
  cardHolderName: {
    type: String,
    required: true
  },
  expiryMonth: {
    type: Number,
    required: true
  },
  expiryYear: {
    type: Number,
    required: true
  },
  cvv: {
    type: String,
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
  isFrozen: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['visa', 'mastercard'],
    default: 'visa'
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

const VirtualCard = mongoose.model('VirtualCard', virtualCardSchema);

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

// Helper function to generate card details
const generateCardDetails = (name) => {
  // Generate a 16-digit card number
  const cardNumber = '4' + Array(15).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
  
  // Generate expiry date (2-5 years from now)
  const now = new Date();
  const expiryYear = now.getFullYear() + Math.floor(Math.random() * 3) + 2;
  const expiryMonth = Math.floor(Math.random() * 12) + 1;
  
  // Generate CVV
  const cvv = Array(3).fill(0).map(() => Math.floor(Math.random() * 10)).join('');
  
  return {
    cardNumber,
    cardHolderName: name.toUpperCase(),
    expiryMonth,
    expiryYear,
    cvv
  };
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

// Virtual Card routes
app.post('/api/virtual-cards', isAuthenticated, verifyTransactionPin, async (req, res) => {
  try {
    // Check if user already has a card
    const existingCard = await VirtualCard.findOne({ userId: req.user.id });
    
    if (existingCard) {
      return res.status(400).json({ message: 'You already have a virtual card' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate card details
    const cardDetails = generateCardDetails(user.name);
    
    // Create virtual card
    const virtualCard = new VirtualCard({
      userId: req.user.id,
      ...cardDetails
    });
    
    await virtualCard.save();
    
    // Mask card number for response
    const maskedCardNumber = cardDetails.cardNumber.replace(/^(\d{4})(\d{8})(\d{4})$/, '$1********$3');
    
    res.status(201).json({
      message: 'Virtual card created successfully',
      card: {
        id: virtualCard._id,
        cardNumber: maskedCardNumber,
        cardHolderName: virtualCard.cardHolderName,
        expiryMonth: virtualCard.expiryMonth,
        expiryYear: virtualCard.expiryYear,
        type: virtualCard.type,
        balance: virtualCard.balance,
        isActive: virtualCard.isActive,
        isFrozen: virtualCard.isFrozen
      }
    });
  } catch (error) {
    console.error('Create virtual card error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/virtual-cards', isAuthenticated, async (req, res) => {
  try {
    const virtualCards = await VirtualCard.find({ userId: req.user.id });
    
    // Mask card numbers for response
    const maskedCards = virtualCards.map(card => {
      const maskedCardNumber = card.cardNumber.replace(/^(\d{4})(\d{8})(\d{4})$/, '$1********$3');
      
      return {
        id: card._id,
        cardNumber: maskedCardNumber,
        cardHolderName: card.cardHolderName,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        type: card.type,
        balance: card.balance,
        isActive: card.isActive,
        isFrozen: card.isFrozen
      };
    });
    
    res.json({ cards: maskedCards });
  } catch (error) {
    console.error('Get virtual cards error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/virtual-cards/:id', isAuthenticated, async (req, res) => {
  try {
    const virtualCard = await VirtualCard.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!virtualCard) {
      return res.status(404).json({ message: 'Virtual card not found' });
    }
    
    // Mask card number for response
    const maskedCardNumber = virtualCard.cardNumber.replace(/^(\d{4})(\d{8})(\d{4})$/, '$1********$3');
    
    res.json({
      card: {
        id: virtualCard._id,
        cardNumber: maskedCardNumber,
        cardHolderName: virtualCard.cardHolderName,
        expiryMonth: virtualCard.expiryMonth,
        expiryYear: virtualCard.expiryYear,
        type: virtualCard.type,
        balance: virtualCard.balance,
        isActive: virtualCard.isActive,
        isFrozen: virtualCard.isFrozen
      }
    });
  } catch (error) {
    console.error('Get virtual card error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/virtual-cards/:id/fund', isAuthenticated, verifyTransactionPin, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    
    // Find virtual card
    const virtualCard = await VirtualCard.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!virtualCard) {
      return res.status(404).json({ message: 'Virtual card not found' });
    }
    
    if (!virtualCard.isActive || virtualCard.isFrozen) {
      return res.status(400).json({ message: 'Card is inactive or frozen' });
    }
    
    // Find wallet
    const wallet = await Wallet.findOne({ userId: req.user.id });
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }
    
    if (wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }
    
    // Create transaction
    const transaction = new Transaction({
      userId: req.user.id,
      type: 'card_funding',
      amount,
      status: 'completed',
      reference: generateReference(),
      description: 'Virtual card funding',
      metadata: {
        cardId: virtualCard._id
      }
    });
    
    await transaction.save();
    
    // Update wallet balance
    wallet.balance -= amount;
    wallet.updatedAt = Date.now();
    await wallet.save();
    
    // Update card balance
    virtualCard.balance += amount;
    virtualCard.updatedAt = Date.now();
    await virtualCard.save();
    
    res.json({
      message: 'Card funded successfully',
      transaction,
      newCardBalance: virtualCard.balance,
      newWalletBalance: wallet.balance
    });
  } catch (error) {
    console.error('Fund virtual card error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/virtual-cards/:id/toggle-freeze', isAuthenticated, verifyTransactionPin, async (req, res) => {
  try {
    // Find virtual card
    const virtualCard = await VirtualCard.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!virtualCard) {
      return res.status(404).json({ message: 'Virtual card not found' });
    }
    
    if (!virtualCard.isActive) {
      return res.status(400).json({ message: 'Card is inactive' });
    }
    
    // Toggle freeze status
    virtualCard.isFrozen = !virtualCard.isFrozen;
    virtualCard.updatedAt = Date.now();
    await virtualCard.save();
    
    res.json({
      message: `Card ${virtualCard.isFrozen ? 'frozen' : 'unfrozen'} successfully`,
      card: {
        id: virtualCard._id,
        isFrozen: virtualCard.isFrozen
      }
    });
  } catch (error) {
    console.error('Toggle freeze virtual card error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/virtual-cards/:id/details', isAuthenticated, verifyTransactionPin, async (req, res) => {
  try {
    const virtualCard = await VirtualCard.findOne({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!virtualCard) {
      return res.status(404).json({ message: 'Virtual card not found' });
    }
    
    // Return full card details including CVV
    res.json({
      card: {
        id: virtualCard._id,
        cardNumber: virtualCard.cardNumber,
        cardHolderName: virtualCard.cardHolderName,
        expiryMonth: virtualCard.expiryMonth,
        expiryYear: virtualCard.expiryYear,
        cvv: virtualCard.cvv,
        type: virtualCard.type,
        balance: virtualCard.balance,
        isActive: virtualCard.isActive,
        isFrozen: virtualCard.isFrozen
      }
    });
  } catch (error) {
    console.error('Get virtual card details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
const PORT = 9882;
app.listen(PORT, () => {
  console.log(`Virtual Card system test server is running on port ${PORT}`);
});
