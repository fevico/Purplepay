const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 9883;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add middleware to handle Authorization header
app.use((req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In a real app, we would verify the token
    // For this mock, we'll just accept any token
    req.user = { id: 'mock-user-id' };
  }
  
  next();
});

// Mock database
const mockUsers = {};
const mockSavingsGroups = {};
const mockTransactions = {};
const mockUssdSessions = {};

// Authentication routes
app.post('/api/auth/register', (req, res) => {
  const { name, email, phoneNumber, password, country } = req.body;
  
  if (!name || !email || !phoneNumber || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required'
    });
  }
  
  // Generate a unique ID
  const userId = `mock-user-id`;
  
  // Store user in mock database
  mockUsers[email] = {
    _id: userId,
    name,
    email,
    phoneNumber,
    country,
    balance: 25000, // Initial balance for testing
    bvnVerified: false,
    transactionPin: null
  };
  
  return res.json({
    message: 'User registered successfully',
    token: 'mock-jwt-token-for-testing',
    user: {
      _id: userId,
      name,
      email,
      phoneNumber,
      country
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
  
  // Check if user exists
  if (!mockUsers[email]) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  return res.json({
    message: 'Login successful',
    token: 'mock-jwt-token-for-testing',
    user: {
      _id: mockUsers[email]._id,
      name: mockUsers[email].name,
      email: mockUsers[email].email,
      phoneNumber: mockUsers[email].phoneNumber,
      country: mockUsers[email].country
    }
  });
});

// Security routes
app.post('/api/security/set-transaction-pin', (req, res) => {
  const { pin } = req.body;
  const userId = getUserIdFromToken(req);
  
  if (!pin) {
    return res.status(400).json({
      success: false,
      message: 'PIN is required'
    });
  }
  
  // Validate PIN format
  if (!/^\d{4}$/.test(pin)) {
    return res.status(400).json({
      success: false,
      message: 'PIN must be a 4-digit number'
    });
  }
  
  // Find user by ID
  const user = findUserById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Set transaction PIN
  user.transactionPin = pin;
  
  return res.json({
    success: true,
    message: 'Transaction PIN set successfully'
  });
});

// BVN verification routes
app.post('/api/bvn/verify', (req, res) => {
  const userId = getUserIdFromToken(req);
  const { bvn, firstName, lastName, dateOfBirth, phoneNumber } = req.body;
  
  if (!bvn) {
    return res.status(400).json({
      success: false,
      message: 'BVN is required'
    });
  }
  
  if (!firstName || !lastName) {
    return res.status(400).json({
      success: false,
      message: 'First name and last name are required'
    });
  }
  
  // Find user by ID
  const user = findUserById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Update user's BVN verification status
  user.bvnVerified = true;
  user.bvnVerificationDate = new Date();
  user.bvnData = {
    bvn,
    firstName: firstName.toUpperCase(),
    lastName: lastName.toUpperCase(),
    middleName: "",
    dateOfBirth: dateOfBirth || "01-01-1990",
    phoneNumber: phoneNumber || "08012345678",
    gender: "Male",
    verified: true,
    transactionRef: `TRX-${Date.now()}`
  };
  
  return res.status(200).json({
    success: true,
    message: 'BVN verified successfully',
    data: {
      verified: true,
      bvn,
      name: `${firstName} ${lastName}`,
      transactionRef: user.bvnData.transactionRef
    }
  });
});

app.get('/api/bvn/status', (req, res) => {
  const userId = getUserIdFromToken(req);
  
  // Find user by ID
  const user = findUserById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  return res.status(200).json({
    success: true,
    data: {
      verified: user.bvnVerified || false,
      bvn: user.bvnData?.bvn || null,
      verificationDate: user.bvnVerificationDate || null
    }
  });
});

app.post('/api/bvn/confirm', (req, res) => {
  const userId = getUserIdFromToken(req);
  const { transactionRef, otp } = req.body;
  
  if (!transactionRef || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Transaction reference and OTP are required'
    });
  }
  
  // Find user by ID
  const user = findUserById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Update user's BVN confirmation status
  user.bvnConfirmed = true;
  user.bvnConfirmationDate = new Date();
  
  return res.status(200).json({
    success: true,
    message: 'BVN confirmed successfully',
    data: {
      confirmed: true
    }
  });
});

app.get('/api/bvn/details', (req, res) => {
  const userId = getUserIdFromToken(req);
  
  // Find user by ID
  const user = findUserById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  // Check if user has verified BVN
  if (!user.bvnVerified) {
    return res.status(400).json({
      success: false,
      message: 'BVN not verified yet'
    });
  }
  
  return res.status(200).json({
    success: true,
    data: {
      bvn: user.bvnData?.bvn || null,
      firstName: user.bvnData?.firstName || null,
      lastName: user.bvnData?.lastName || null,
      middleName: user.bvnData?.middleName || null,
      dateOfBirth: user.bvnData?.dateOfBirth || null,
      phoneNumber: user.bvnData?.phoneNumber || null,
      gender: user.bvnData?.gender || null,
      verified: user.bvnVerified || false,
      confirmed: user.bvnConfirmed || false,
      verificationDate: user.bvnVerificationDate || null
    }
  });
});

// Savings group routes
app.post('/api/savings-groups', (req, res) => {
  const userId = getUserIdFromToken(req);
  const { name, description, contributionAmount, frequency, startDate, totalCycles } = req.body;
  
  if (!name || !contributionAmount) {
    return res.status(400).json({
      success: false,
      message: 'Name and contribution amount are required'
    });
  }
  
  // Generate a unique ID
  const groupId = 'mock-savings-group-id';
  
  // Create savings group
  const savingsGroup = {
    _id: groupId,
    name,
    description: description || 'A test savings group for API testing',
    contributionAmount,
    frequency: frequency || 'weekly',
    startDate: startDate || new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    totalCycles: totalCycles || 10,
    creator: userId,
    members: [userId],
    createdAt: new Date()
  };
  
  // Store in mock database
  mockSavingsGroups[groupId] = savingsGroup;
  
  return res.json({
    success: true,
    message: 'Savings group created successfully',
    savingsGroup
  });
});

app.get('/api/savings-groups', (req, res) => {
  const userId = getUserIdFromToken(req);
  
  // Filter savings groups by user ID
  const userSavingsGroups = Object.values(mockSavingsGroups).filter(group => 
    group.members.includes(userId)
  );
  
  return res.json({
    success: true,
    savingsGroups: userSavingsGroups
  });
});

app.get('/api/savings-groups/:id', (req, res) => {
  const userId = getUserIdFromToken(req);
  const groupId = req.params.id;
  
  // Find savings group by ID
  const savingsGroup = mockSavingsGroups[groupId];
  
  if (!savingsGroup) {
    return res.status(404).json({
      success: false,
      message: 'Savings group not found'
    });
  }
  
  // Check if user is a member
  if (!savingsGroup.members.includes(userId)) {
    return res.status(403).json({
      success: false,
      message: 'You are not a member of this savings group'
    });
  }
  
  return res.json({
    success: true,
    savingsGroup
  });
});

// USSD routes
app.post('/api/ussd', (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;
  
  if (!sessionId || !serviceCode || !phoneNumber) {
    return res.status(400).json({
      success: false,
      message: 'Session ID, service code, and phone number are required'
    });
  }
  
  // Find or create session
  let session = mockUssdSessions[sessionId] || {
    id: sessionId,
    phoneNumber,
    step: 0,
    data: {}
  };
  
  mockUssdSessions[sessionId] = session;
  
  // Process USSD request based on text
  let response = '';
  
  if (!text) {
    // Initial request - show main menu
    response = 'CON Welcome to PurplePay USSD Service\n1. Check Balance\n2. Transfer Money\n3. Buy Airtime\n4. Pay Bills\n5. Savings Groups';
    session.step = 1;
  } else if (session.step === 1) {
    // User selected an option from the main menu
    const option = text;
    
    switch (option) {
      case '1': // Check Balance
        // Find user by phone number
        const user = findUserByPhoneNumber(phoneNumber);
        if (user) {
          response = `END Your balance is NGN ${user.balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
          response = 'END User not found. Please register with PurplePay.';
        }
        break;
        
      case '2': // Transfer Money
        response = 'CON Enter recipient\'s phone number or tag:';
        session.step = 2;
        session.data.action = 'transfer';
        break;
        
      case '3': // Buy Airtime
        response = 'CON Enter phone number:';
        session.step = 2;
        session.data.action = 'airtime';
        break;
        
      case '4': // Pay Bills
        response = 'CON Select bill type:\n1. Electricity\n2. Water\n3. TV Subscription';
        session.step = 2;
        session.data.action = 'bills';
        break;
        
      case '5': // Savings Groups
        response = 'CON Savings Groups:\n1. View my groups\n2. Make contribution\n3. Check next payout';
        session.step = 2;
        session.data.action = 'savings';
        break;
        
      default:
        response = 'END Invalid option selected.';
    }
  } else if (session.step === 2 && session.data.action === 'transfer') {
    // User entered recipient's phone number
    session.data.recipient = text;
    response = 'CON Enter amount to transfer:';
    session.step = 3;
  } else if (session.step === 3 && session.data.action === 'transfer') {
    // User entered amount
    session.data.amount = parseFloat(text);
    response = 'CON Enter your 4-digit PIN to confirm transfer:';
    session.step = 4;
  } else if (session.step === 4 && session.data.action === 'transfer') {
    // User entered PIN
    const pin = text;
    const user = findUserByPhoneNumber(phoneNumber);
    
    if (user && user.transactionPin === pin) {
      // Process transfer
      if (user.balance >= session.data.amount) {
        user.balance -= session.data.amount;
        
        // Record transaction
        const transactionId = `TRX-${Date.now()}`;
        mockTransactions[transactionId] = {
          id: transactionId,
          userId: user._id,
          type: 'transfer',
          amount: session.data.amount,
          recipient: session.data.recipient,
          date: new Date()
        };
        
        response = `END Transfer of NGN ${session.data.amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to ${session.data.recipient} successful. Your new balance is NGN ${user.balance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } else {
        response = 'END Insufficient balance for this transfer.';
      }
    } else {
      response = 'END Invalid PIN. Transaction cancelled.';
    }
  }
  
  // Return USSD response
  res.set('Content-Type', 'text/plain');
  res.send(response);
});

// Virtual Card API Routes
app.post('/api/virtual-cards', (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Check if transaction PIN is provided and correct
  if (!req.body.transactionPin) {
    return res.status(400).json({ success: false, message: 'Transaction PIN is required' });
  }

  if (req.body.transactionPin !== '1234') {
    return res.status(400).json({ success: false, message: 'Invalid transaction PIN' });
  }

  // Create a new virtual card
  const card = {
    id: `card-${Date.now()}`,
    cardNumber: '4111111111111111',
    expiryMonth: '12',
    expiryYear: '25',
    cvv: '123',
    balance: 0,
    frozen: false,
    createdAt: new Date().toISOString(),
    userId: req.user.id
  };

  res.json({
    success: true,
    message: 'Virtual card created successfully',
    card
  });
});

app.get('/api/virtual-cards', (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Return mock cards
  const cards = [
    {
      id: `card-${Date.now()}`,
      cardNumber: '4111XXXXXXXX1111',
      expiryMonth: '12',
      expiryYear: '25',
      balance: 2000,
      frozen: false,
      createdAt: new Date().toISOString(),
      userId: req.user.id
    }
  ];

  res.json({
    success: true,
    cards
  });
});

app.post('/api/virtual-cards/:cardId/fund', (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Check if card ID is valid
  if (!req.params.cardId || !req.params.cardId.startsWith('card-')) {
    return res.status(404).json({ success: false, message: 'Card not found' });
  }

  // Check if amount is provided
  if (!req.body.amount) {
    return res.status(400).json({ success: false, message: 'Amount is required' });
  }

  // Check if amount is valid
  const amount = parseInt(req.body.amount);
  if (isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: 'Amount must be a positive number' });
  }

  // Check if transaction PIN is provided and correct
  if (!req.body.transactionPin) {
    return res.status(400).json({ success: false, message: 'Transaction PIN is required' });
  }

  if (req.body.transactionPin !== '1234') {
    return res.status(400).json({ success: false, message: 'Invalid transaction PIN' });
  }

  // Check if amount is too large (simulate insufficient funds)
  if (amount > 50000) {
    return res.status(400).json({ success: false, message: 'Insufficient funds in wallet' });
  }

  // Check if card is frozen
  const cardIsFrozen = req.params.cardId.includes('frozen');
  if (cardIsFrozen) {
    return res.status(400).json({ success: false, message: 'Cannot fund a frozen card' });
  }

  // Return mock funding response
  res.json({
    success: true,
    message: 'Virtual card funded successfully',
    card: {
      id: req.params.cardId,
      balance: amount,
      updatedAt: new Date().toISOString()
    }
  });
});

app.put('/api/virtual-cards/:cardId/toggle-freeze', (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Check if card ID is valid
  if (!req.params.cardId || !req.params.cardId.startsWith('card-')) {
    return res.status(404).json({ success: false, message: 'Card not found' });
  }

  // Check if transaction PIN is provided and correct
  if (!req.body.transactionPin) {
    return res.status(400).json({ success: false, message: 'Transaction PIN is required' });
  }

  if (req.body.transactionPin !== '1234') {
    return res.status(400).json({ success: false, message: 'Invalid transaction PIN' });
  }

  // Determine if the card is currently frozen
  const isFrozen = req.params.cardId.includes('frozen');
  const newFrozenState = !isFrozen;
  
  // Return mock freeze/unfreeze response
  res.json({
    success: true,
    message: newFrozenState ? 'Virtual card frozen successfully' : 'Virtual card unfrozen successfully',
    card: {
      id: req.params.cardId,
      frozen: newFrozenState,
      updatedAt: new Date().toISOString()
    }
  });
});

app.get('/api/virtual-cards/:cardId/details', (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Check if card ID is valid
  if (!req.params.cardId || !req.params.cardId.startsWith('card-')) {
    return res.status(404).json({ success: false, message: 'Card not found' });
  }

  // Check if transaction PIN is provided and correct
  if (!req.query.transactionPin) {
    return res.status(400).json({ success: false, message: 'Transaction PIN is required' });
  }

  if (req.query.transactionPin !== '1234') {
    return res.status(400).json({ success: false, message: 'Invalid transaction PIN' });
  }

  // Return mock card details
  const card = {
    id: req.params.cardId,
    cardNumber: '4111111111111111',
    expiryMonth: '12',
    expiryYear: '25',
    cvv: '123',
    balance: 2000,
    frozen: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: req.user.id
  };

  res.json({
    success: true,
    card
  });
});

// Wallet API Routes
app.get('/api/wallet', (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Return mock wallet
  const wallet = {
    _id: 'wallet-123456',
    balance: 5000,
    currency: 'NGN',
    userId: req.user.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    wallet
  });
});

app.post('/api/wallet/deposit', (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Check if amount is provided
  if (!req.body.amount) {
    return res.status(400).json({ success: false, message: 'Amount is required' });
  }

  // Return mock deposit response
  const transaction = {
    _id: `transaction-${Date.now()}`,
    type: 'deposit',
    amount: req.body.amount,
    description: req.body.description || 'Wallet deposit',
    status: 'completed',
    walletId: 'wallet-123456',
    userId: req.user.id,
    createdAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'Deposit successful',
    transaction,
    newBalance: 5000 + parseInt(req.body.amount)
  });
});

app.post('/api/wallet/withdraw', (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Check if amount is provided
  if (!req.body.amount) {
    return res.status(400).json({ success: false, message: 'Amount is required' });
  }

  // Check if transaction PIN is provided
  if (!req.body.transactionPin) {
    return res.status(400).json({ success: false, message: 'Transaction PIN is required' });
  }

  // Check if amount is too large (simulate insufficient funds)
  if (req.body.amount > 5000) {
    return res.status(400).json({ success: false, message: 'Insufficient funds' });
  }

  // Return mock withdrawal response
  const transaction = {
    _id: `transaction-${Date.now()}`,
    type: 'withdrawal',
    amount: req.body.amount,
    description: req.body.description || 'Wallet withdrawal',
    status: 'completed',
    walletId: 'wallet-123456',
    userId: req.user.id,
    createdAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: 'Withdrawal successful',
    transaction,
    newBalance: 5000 - parseInt(req.body.amount)
  });
});

app.get('/api/transactions', (req, res) => {
  // Check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Return mock transactions
  const transactions = [
    {
      _id: 'transaction-1',
      type: 'deposit',
      amount: 10000,
      description: 'Initial deposit',
      status: 'completed',
      walletId: 'wallet-123456',
      userId: req.user.id,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'transaction-2',
      type: 'withdrawal',
      amount: 2000,
      description: 'ATM withdrawal',
      status: 'completed',
      walletId: 'wallet-123456',
      userId: req.user.id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: 'transaction-3',
      type: 'transfer',
      amount: 3000,
      description: 'Transfer to John',
      status: 'completed',
      walletId: 'wallet-123456',
      userId: req.user.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  res.json({
    success: true,
    transactions
  });
});

// Helper functions
function getUserIdFromToken(req) {
  // In a real implementation, this would decode the JWT token
  // For testing, we'll just return a mock user ID
  return req.user?.id || 'mock-user-id';
}

function findUserById(userId) {
  // Find user by ID in mock database
  return Object.values(mockUsers).find(user => user._id === userId);
}

function findUserByPhoneNumber(phoneNumber) {
  // Find user by phone number in mock database
  return Object.values(mockUsers).find(user => user.phoneNumber === phoneNumber);
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', error);
  }
});
