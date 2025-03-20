const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');

// Configuration
const PORT = process.env.PORT || 9876;
const JWT_SECRET = process.env.JWT_SECRET || 'mock-secret-key';
const TOKEN_EXPIRY = '1h'; // Shorter token expiry for better security

// Create Express app
const app = express();

// Security middleware
app.use(helmet()); // Set security headers
app.use(xss()); // Sanitize input against XSS attacks

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests from this IP, please try again later' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all API endpoints
app.use('/api/', apiLimiter);

// More strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply stricter rate limiting to auth endpoints
app.use('/auth/', authLimiter);

// Apply rate limiting to bills payment endpoints
app.use('/billsPayment/', apiLimiter);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory database
const db = {
  users: [],
  wallets: [],
  transactions: [],
  billPayments: [],
  refreshTokens: [], 
  trustedDevices: [],
  securitySettings: [],
  notifications: [],
  notificationPreferences: []
};

// Load mock data if exists
function loadMockData() {
  const dataPath = path.join(__dirname, 'mock-data.json');
  
  if (fs.existsSync(dataPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      Object.assign(db, data);
      console.log('Mock data loaded successfully');
    } catch (error) {
      console.error('Error loading mock data:', error);
    }
  } else {
    console.log('No mock data found, using empty database');
  }
}

// Debounce mechanism for saving mock data
let saveTimeout = null;
const SAVE_DELAY = 500; // 500ms debounce

function saveMockData() {
  // Clear any existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Set a new timeout
  saveTimeout = setTimeout(() => {
    const dataPath = path.join(__dirname, 'mock-data.json');
    
    try {
      // Use asynchronous write
      fs.writeFile(dataPath, JSON.stringify(db, null, 2), (err) => {
        if (err) {
          console.error('Error saving mock data:', err);
        } else {
          console.log('Mock data saved successfully');
        }
      });
    } catch (error) {
      console.error('Error saving mock data:', error);
    }
  }, SAVE_DELAY);
}

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    // Check if user exists
    const user = db.users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return res.status(401).json({ message: 'Unauthorized: Token expired' });
    }
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Unauthorized: Token expired' });
    }
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
}

// Validation helper functions
function isValidBillType(billType) {
  const validBillTypes = ['electricity', 'water', 'internet', 'tv', 'education', 'tax', 'other'];
  return validBillTypes.includes(billType);
}

function isValidCurrency(currency) {
  const validCurrencies = ['NGN', 'USD', 'EUR', 'GBP'];
  return validCurrencies.includes(currency);
}

function isValidAmount(amount) {
  const numAmount = parseFloat(amount);
  return !isNaN(numAmount) && numAmount > 0 && numAmount <= 1000000;
}

function hasSqlInjection(str) {
  if (!str) return false;
  const sqlInjectionPattern = /(union\s+select|insert\s+into|update\s+.*\s+set|delete\s+from|drop\s+table|exec\s+.*sp_|declare\s+.*@|select\s+.*from)/i;
  return sqlInjectionPattern.test(str);
}

function hasXssAttack(str) {
  if (!str) return false;
  const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|javascript:|on\w+\s*=|<img[^>]+src\s*=\s*["']?[^"'>]+["']?[^>]*>/i;
  return xssPattern.test(str);
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/&/g, '&amp;')
    .replace(/\\/g, '&#92;');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    services: {
      api: 'UP',
      database: 'UP'
    }
  });
});

// Database health check
app.get('/health/db', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    database: 'MongoDB',
    connection: 'Connected'
  });
});

// Auth endpoints
app.post('/auth/register', (req, res) => {
  const { email, password, name, phoneNumber } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }
  
  // Check if user already exists - use find instead of some for early exit
  const existingUser = db.users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  // Create new user
  const userId = uuidv4();
  const verificationToken = uuidv4();
  
  const newUser = {
    id: userId,
    email: sanitizeInput(email),
    password, // In a real app, this would be hashed
    name: sanitizeInput(name),
    phoneNumber: phoneNumber ? sanitizeInput(phoneNumber) : null,
    verified: false,
    verificationToken,
    createdAt: new Date().toISOString()
  };
  
  // Add user to database
  db.users.push(newUser);
  
  // Save data asynchronously - don't wait for it to complete
  saveMockData();
  
  // Return response immediately
  res.status(201).json({
    message: 'User registered successfully',
    id: userId,
    token: verificationToken
  });
});

app.post('/auth/verify', (req, res) => {
  const { userId, token } = req.body;
  
  if (!userId || !token) {
    return res.status(400).json({ message: 'User ID and token are required' });
  }
  
  // Find user - use findIndex for direct access to the array element
  const userIndex = db.users.findIndex(u => u.id === userId && u.verificationToken === token);
  
  if (userIndex === -1) {
    return res.status(400).json({ message: 'Invalid verification token' });
  }
  
  // Update user
  db.users[userIndex].verified = true;
  db.users[userIndex].verificationToken = null;
  
  // Save data asynchronously - don't wait for it to complete
  saveMockData();
  
  // Generate JWT token for authenticated user
  const authToken = jwt.sign(
    { userId: db.users[userIndex].id, email: db.users[userIndex].email },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
  
  // Return response immediately
  res.status(200).json({ 
    message: 'User verified successfully',
    token: authToken,
    user: {
      id: db.users[userIndex].id,
      email: db.users[userIndex].email,
      name: db.users[userIndex].name,
      onboardingComplete: false
    }
  });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Find user
  const user = db.users.find(u => u.email === sanitizeInput(email) && u.password === password);
  
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  if (!user.verified) {
    return res.status(401).json({ message: 'User not verified' });
  }
  
  // Generate JWT token with shorter expiry
  const token = jwt.sign(
    { userId: user.id, name: user.name },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
  
  // Generate refresh token
  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  
  // Store refresh token
  db.refreshTokens.push({
    token: refreshToken,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  });
  
  saveMockData();
  
  res.status(200).json({
    message: 'Login successful',
    token,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email
    }
  });
});

// Token refresh endpoint
app.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required' });
  }
  
  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    // Find the user
    const user = db.users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const newToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    const newRefreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({
      message: 'Token refreshed successfully',
      token: newToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

app.get('/auth/status', (req, res) => {
  res.status(200).json({ status: 'Authentication service is running' });
});

// Wallet endpoints
app.post('/wallet/create', authenticate, (req, res) => {
  const userId = req.user.userId;
  
  // Check if wallet already exists
  if (db.wallets.some(w => w.userId === userId)) {
    return res.status(400).json({ message: 'Wallet already exists' });
  }
  
  // Create new wallet
  const wallet = {
    id: uuidv4(),
    userId,
    balance: 0,
    currency: 'NGN',
    createdAt: new Date().toISOString()
  };
  
  db.wallets.push(wallet);
  saveMockData();
  
  res.status(201).json({
    message: 'Wallet created successfully',
    wallet: {
      id: wallet.id,
      balance: wallet.balance,
      currency: wallet.currency
    }
  });
});

app.post('/wallet/fund', authenticate, (req, res) => {
  const userId = req.user.userId;
  const { amount, currency } = req.body;
  
  if (!amount || !currency) {
    return res.status(400).json({ message: 'Amount and currency are required' });
  }
  
  // Validate amount
  if (!isValidAmount(amount)) {
    return res.status(400).json({ message: 'Invalid amount' });
  }
  
  // Validate currency
  if (!isValidCurrency(currency)) {
    return res.status(400).json({ message: 'Invalid currency' });
  }
  
  // Find wallet
  const walletIndex = db.wallets.findIndex(w => w.userId === userId);
  
  if (walletIndex === -1) {
    return res.status(404).json({ message: 'Wallet not found' });
  }
  
  // Update wallet balance
  db.wallets[walletIndex].balance += parseFloat(amount);
  
  // Create transaction record
  const transaction = {
    id: uuidv4(),
    userId,
    walletId: db.wallets[walletIndex].id,
    type: 'credit',
    amount: parseFloat(amount),
    currency,
    description: 'Wallet funding',
    status: 'completed',
    reference: uuidv4(),
    createdAt: new Date().toISOString()
  };
  
  db.transactions.push(transaction);
  saveMockData();
  
  res.status(200).json({
    message: 'Wallet funded successfully',
    wallet: {
      id: db.wallets[walletIndex].id,
      balance: db.wallets[walletIndex].balance,
      currency: db.wallets[walletIndex].currency
    },
    transaction: {
      id: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      type: transaction.type,
      status: transaction.status
    }
  });
});

app.get('/wallet/details', authenticate, (req, res) => {
  const userId = req.user.userId;
  
  // Find wallet
  const wallet = db.wallets.find(w => w.userId === userId);
  
  if (!wallet) {
    return res.status(404).json({ message: 'Wallet not found' });
  }
  
  res.status(200).json({
    message: 'Wallet details retrieved successfully',
    wallet: {
      id: wallet.id,
      balance: wallet.balance,
      currency: wallet.currency
    }
  });
});

// Bills Payment endpoints
app.post('/billsPayment/initiate', authenticate, (req, res) => {
  const { billType, provider, customerReference, amount, currency } = req.body;
  const userId = req.user.userId;
  
  // Validate required fields
  if (!billType || !provider || !customerReference || !amount || !currency) {
    return res.status(400).json({ message: 'All fields are required: billType, provider, customerReference, amount, currency' });
  }
  
  // Validate bill type
  if (!isValidBillType(billType)) {
    return res.status(400).json({ message: 'Invalid bill type' });
  }
  
  // Validate amount
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }
  
  if (numAmount > 1000000) {
    return res.status(400).json({ message: 'Amount exceeds maximum limit' });
  }
  
  // Validate currency
  if (!isValidCurrency(currency)) {
    return res.status(400).json({ message: 'Invalid currency' });
  }
  
  // Sanitize inputs
  const sanitizedCustomerRef = sanitizeInput(customerReference);
  
  // Check for SQL injection patterns
  if (hasSqlInjection(customerReference)) {
    return res.status(400).json({ message: 'Invalid customer reference' });
  }
  
  // Check for XSS attacks
  if (hasXssAttack(provider)) {
    return res.status(400).json({ message: 'Invalid provider' });
  }
  
  // Find user's wallet
  const wallet = db.wallets.find(w => w.userId === userId);
  if (!wallet) {
    return res.status(404).json({ message: 'Wallet not found' });
  }
  
  // Check wallet balance
  if (wallet.balance < numAmount) {
    return res.status(400).json({ message: 'Insufficient wallet balance' });
  }
  
  // Create bill payment record
  const reference = uuidv4();
  const billPayment = {
    id: uuidv4(),
    userId,
    walletId: wallet.id,
    billType,
    provider: sanitizeInput(provider),
    customerReference: sanitizedCustomerRef,
    amount: numAmount,
    currency,
    status: 'pending',
    reference,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  db.billPayments.push(billPayment);
  saveMockData();
  
  res.status(201).json({
    message: 'Bill payment initiated successfully',
    reference,
    status: 'pending'
  });
});

app.post('/billsPayment/process/:reference', authenticate, (req, res) => {
  const userId = req.user.userId;
  const { reference } = req.params;
  
  if (!reference) {
    return res.status(400).json({ message: 'Reference is required' });
  }
  
  // Sanitize reference
  const sanitizedReference = sanitizeInput(reference);
  
  // Find bill payment
  const billPaymentIndex = db.billPayments.findIndex(bp => bp.reference === sanitizedReference && bp.userId === userId);
  
  if (billPaymentIndex === -1) {
    return res.status(404).json({ message: 'Bill payment not found' });
  }
  
  const billPayment = db.billPayments[billPaymentIndex];
  
  if (billPayment.status !== 'pending') {
    return res.status(400).json({ message: `Bill payment already ${billPayment.status}` });
  }
  
  // Find wallet
  const walletIndex = db.wallets.findIndex(w => w.id === billPayment.walletId);
  
  if (walletIndex === -1) {
    return res.status(404).json({ message: 'Wallet not found' });
  }
  
  // Check wallet balance again (double validation)
  if (db.wallets[walletIndex].balance < billPayment.amount) {
    // Update bill payment status
    db.billPayments[billPaymentIndex].status = 'failed';
    db.billPayments[billPaymentIndex].failedAt = new Date().toISOString();
    db.billPayments[billPaymentIndex].failureReason = 'Insufficient funds';
    
    saveMockData();
    
    return res.status(400).json({ message: 'Insufficient funds' });
  }
  
  // Update wallet balance
  db.wallets[walletIndex].balance -= billPayment.amount;
  
  // Create transaction record
  const transactionId = uuidv4();
  
  db.transactions.push({
    id: transactionId,
    userId,
    walletId: billPayment.walletId,
    type: 'debit',
    amount: billPayment.amount,
    currency: billPayment.currency,
    description: `Bill payment for ${billPayment.provider} (${billPayment.billType})`,
    status: 'completed',
    reference: billPayment.reference,
    metadata: {
      billPaymentId: billPayment.id,
      billType: billPayment.billType,
      provider: billPayment.provider,
      customerReference: billPayment.customerReference
    },
    createdAt: new Date().toISOString()
  });
  
  // Update bill payment status
  db.billPayments[billPaymentIndex].status = 'completed';
  db.billPayments[billPaymentIndex].transactionId = transactionId;
  db.billPayments[billPaymentIndex].completedAt = new Date().toISOString();
  
  saveMockData();
  
  res.status(200).json({
    message: 'Bill payment processed successfully',
    reference: billPayment.reference,
    status: 'completed',
    transactionId
  });
});

app.get('/billsPayment/status/:reference', authenticate, (req, res) => {
  const userId = req.user.userId;
  const { reference } = req.params;
  
  if (!reference) {
    return res.status(400).json({ message: 'Reference is required' });
  }
  
  // Sanitize reference
  const sanitizedReference = sanitizeInput(reference);
  
  // Find bill payment
  const billPayment = db.billPayments.find(bp => bp.reference === sanitizedReference && bp.userId === userId);
  
  if (!billPayment) {
    return res.status(404).json({ message: 'Bill payment not found' });
  }
  
  res.status(200).json({
    message: 'Bill payment status retrieved successfully',
    reference: billPayment.reference,
    status: billPayment.status,
    billPayment
  });
});

app.get('/billsPayment/history', authenticate, (req, res) => {
  const userId = req.user.userId;
  const { status, billType, provider, startDate, endDate, limit = 10, page = 1 } = req.query;
  
  // Validate and sanitize query parameters
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;
  const offset = (pageNum - 1) * limitNum;
  
  // Sanitize inputs
  const sanitizedStatus = status ? sanitizeInput(status) : null;
  const sanitizedBillType = billType ? sanitizeInput(billType) : null;
  const sanitizedProvider = provider ? sanitizeInput(provider) : null;
  
  // Filter bill payments
  let filteredBillPayments = db.billPayments.filter(bp => bp.userId === userId);
  
  if (sanitizedStatus) {
    filteredBillPayments = filteredBillPayments.filter(bp => bp.status === sanitizedStatus);
  }
  
  if (sanitizedBillType) {
    filteredBillPayments = filteredBillPayments.filter(bp => bp.billType === sanitizedBillType);
  }
  
  if (sanitizedProvider) {
    filteredBillPayments = filteredBillPayments.filter(bp => bp.provider === sanitizedProvider);
  }
  
  if (startDate) {
    const start = new Date(startDate);
    filteredBillPayments = filteredBillPayments.filter(bp => new Date(bp.createdAt) >= start);
  }
  
  if (endDate) {
    const end = new Date(endDate);
    filteredBillPayments = filteredBillPayments.filter(bp => new Date(bp.createdAt) <= end);
  }
  
  // Sort by creation date (newest first)
  filteredBillPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  // Paginate results
  const paginatedBillPayments = filteredBillPayments.slice(offset, offset + limitNum);
  
  res.status(200).json({
    message: 'Bill payment history retrieved successfully',
    total: filteredBillPayments.length,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(filteredBillPayments.length / limitNum),
    billPayments: paginatedBillPayments
  });
});

// Security Settings Endpoints
app.get('/security/settings', authenticate, (req, res) => {
  const userId = req.user.id;
  let userSettings = db.securitySettings.find(settings => settings.userId === userId);
  
  if (!userSettings) {
    // Create default settings if none exist
    userSettings = {
      userId,
      id: uuidv4(),
      twoFactorEnabled: false,
      loginNotifications: true,
      transactionNotifications: true,
      highValueTransferThreshold: 100000,
      requireAdditionalAuthForHighValue: true,
      lastUpdated: new Date().toISOString()
    };
    db.securitySettings.push(userSettings);
    saveMockData();
  }
  
  res.json({ success: true, settings: userSettings });
});

app.put('/security/settings', authenticate, (req, res) => {
  const userId = req.user.id;
  const { 
    twoFactorEnabled, 
    loginNotifications, 
    transactionNotifications,
    highValueTransferThreshold,
    requireAdditionalAuthForHighValue
  } = req.body;
  
  // Input validation
  if (highValueTransferThreshold !== undefined && 
      (typeof highValueTransferThreshold !== 'number' || 
       highValueTransferThreshold < 0 || 
       highValueTransferThreshold > 10000000)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid high value transfer threshold. Must be between 0 and 10,000,000' 
    });
  }
  
  let userSettings = db.securitySettings.find(settings => settings.userId === userId);
  
  if (!userSettings) {
    userSettings = {
      userId,
      id: uuidv4(),
      twoFactorEnabled: false,
      loginNotifications: true,
      transactionNotifications: true,
      highValueTransferThreshold: 100000,
      requireAdditionalAuthForHighValue: true,
      lastUpdated: new Date().toISOString()
    };
    db.securitySettings.push(userSettings);
  }
  
  // Update settings
  if (twoFactorEnabled !== undefined) userSettings.twoFactorEnabled = !!twoFactorEnabled;
  if (loginNotifications !== undefined) userSettings.loginNotifications = !!loginNotifications;
  if (transactionNotifications !== undefined) userSettings.transactionNotifications = !!transactionNotifications;
  if (highValueTransferThreshold !== undefined) userSettings.highValueTransferThreshold = highValueTransferThreshold;
  if (requireAdditionalAuthForHighValue !== undefined) userSettings.requireAdditionalAuthForHighValue = !!requireAdditionalAuthForHighValue;
  
  userSettings.lastUpdated = new Date().toISOString();
  saveMockData();
  
  res.json({ success: true, settings: userSettings });
});

// Trusted Device Management Endpoints
app.post('/security/trusted-devices', authenticate, (req, res) => {
  const userId = req.user.id;
  const { deviceId, deviceName, deviceType } = req.body;
  
  // Input validation
  if (!deviceId || !deviceName || !deviceType) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: deviceId, deviceName, deviceType' 
    });
  }
  
  // Check if device already exists
  const existingDevice = db.trustedDevices.find(
    device => device.userId === userId && device.deviceId === deviceId
  );
  
  if (existingDevice) {
    return res.status(400).json({ 
      success: false, 
      error: 'Device already registered' 
    });
  }
  
  // Create new trusted device
  const newDevice = {
    id: uuidv4(),
    userId,
    deviceId,
    deviceName,
    deviceType,
    trusted: true,
    lastUsed: new Date().toISOString(),
    dateAdded: new Date().toISOString()
  };
  
  db.trustedDevices.push(newDevice);
  saveMockData();
  
  res.json({ success: true, device: newDevice });
});

app.get('/security/trusted-devices', authenticate, (req, res) => {
  const userId = req.user.id;
  const userDevices = db.trustedDevices.filter(device => device.userId === userId);
  
  res.json({ success: true, devices: userDevices });
});

app.put('/security/trusted-devices/:deviceId', authenticate, (req, res) => {
  const userId = req.user.id;
  const { deviceId } = req.params;
  const { deviceName, trusted } = req.body;
  
  const device = db.trustedDevices.find(
    d => d.userId === userId && d.deviceId === deviceId
  );
  
  if (!device) {
    return res.status(404).json({ 
      success: false, 
      error: 'Device not found' 
    });
  }
  
  // Update device
  if (deviceName !== undefined) device.deviceName = deviceName;
  if (trusted !== undefined) device.trusted = !!trusted;
  device.lastUsed = new Date().toISOString();
  
  saveMockData();
  
  res.json({ success: true, device });
});

app.delete('/security/trusted-devices/:deviceId', authenticate, (req, res) => {
  const userId = req.user.id;
  const { deviceId } = req.params;
  
  const deviceIndex = db.trustedDevices.findIndex(
    d => d.userId === userId && d.deviceId === deviceId
  );
  
  if (deviceIndex === -1) {
    return res.status(404).json({ 
      success: false, 
      error: 'Device not found' 
    });
  }
  
  // Remove device
  db.trustedDevices.splice(deviceIndex, 1);
  saveMockData();
  
  res.json({ success: true, message: 'Device removed successfully' });
});

app.post('/security/verify-device', authenticate, (req, res) => {
  const userId = req.user.id;
  const { deviceId, verificationCode } = req.body;
  
  // Input validation
  if (!deviceId || !verificationCode) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: deviceId, verificationCode' 
    });
  }
  
  // For mock purposes, we'll accept any 6-digit code
  if (!/^\d{6}$/.test(verificationCode)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid verification code. Must be 6 digits.' 
    });
  }
  
  const device = db.trustedDevices.find(
    d => d.userId === userId && d.deviceId === deviceId
  );
  
  if (!device) {
    return res.status(404).json({ 
      success: false, 
      error: 'Device not found' 
    });
  }
  
  // Verify device
  device.trusted = true;
  device.lastUsed = new Date().toISOString();
  saveMockData();
  
  res.json({ success: true, device });
});

// High-Value Transfer Authentication
app.post('/security/verify-high-value-transfer', authenticate, (req, res) => {
  const userId = req.user.id;
  const { transferId, verificationCode } = req.body;
  
  // Input validation
  if (!transferId || !verificationCode) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: transferId, verificationCode' 
    });
  }
  
  // For mock purposes, we'll accept any 6-digit code
  if (!/^\d{6}$/.test(verificationCode)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid verification code. Must be 6 digits.' 
    });
  }
  
  // Get user's security settings
  const userSettings = db.securitySettings.find(settings => settings.userId === userId);
  
  if (!userSettings || !userSettings.requireAdditionalAuthForHighValue) {
    return res.status(400).json({ 
      success: false, 
      error: 'High-value transfer verification not enabled for this user' 
    });
  }
  
  // In a real implementation, we would verify the transfer exists and belongs to the user
  
  res.json({ 
    success: true, 
    message: 'High-value transfer verified successfully',
    transferId
  });
});

// Notification Preferences
app.get('/notification-preferences', authenticate, (req, res) => {
  const userId = req.user.id;
  let preferences = db.notificationPreferences.find(pref => pref.userId === userId);
  
  if (!preferences) {
    // Create default preferences if none exist
    preferences = {
      userId,
      id: uuidv4(),
      email: true,
      push: true,
      sms: false,
      loginAlerts: true,
      paymentAlerts: true,
      promotionalAlerts: false,
      lastUpdated: new Date().toISOString()
    };
    db.notificationPreferences.push(preferences);
    saveMockData();
  }
  
  res.json({ success: true, preferences });
});

app.put('/notification-preferences', authenticate, (req, res) => {
  const userId = req.user.id;
  const { 
    email, 
    push, 
    sms, 
    loginAlerts, 
    paymentAlerts, 
    promotionalAlerts 
  } = req.body;
  
  let preferences = db.notificationPreferences.find(pref => pref.userId === userId);
  
  if (!preferences) {
    preferences = {
      userId,
      id: uuidv4(),
      email: true,
      push: true,
      sms: false,
      loginAlerts: true,
      paymentAlerts: true,
      promotionalAlerts: false,
      lastUpdated: new Date().toISOString()
    };
    db.notificationPreferences.push(preferences);
  }
  
  // Update preferences
  if (email !== undefined) preferences.email = !!email;
  if (push !== undefined) preferences.push = !!push;
  if (sms !== undefined) preferences.sms = !!sms;
  if (loginAlerts !== undefined) preferences.loginAlerts = !!loginAlerts;
  if (paymentAlerts !== undefined) preferences.paymentAlerts = !!paymentAlerts;
  if (promotionalAlerts !== undefined) preferences.promotionalAlerts = !!promotionalAlerts;
  
  preferences.lastUpdated = new Date().toISOString();
  saveMockData();
  
  res.json({ success: true, preferences });
});

app.post('/notification-preferences/reset', authenticate, (req, res) => {
  const userId = req.user.id;
  
  // Reset to default preferences
  const defaultPreferences = {
    userId,
    id: uuidv4(),
    email: true,
    push: true,
    sms: false,
    loginAlerts: true,
    paymentAlerts: true,
    promotionalAlerts: false,
    lastUpdated: new Date().toISOString()
  };
  
  // Remove existing preferences
  const prefIndex = db.notificationPreferences.findIndex(pref => pref.userId === userId);
  if (prefIndex !== -1) {
    db.notificationPreferences.splice(prefIndex, 1);
  }
  
  // Add default preferences
  db.notificationPreferences.push(defaultPreferences);
  saveMockData();
  
  res.json({ success: true, preferences: defaultPreferences });
});

// Notifications
app.get('/notifications', authenticate, (req, res) => {
  const userId = req.user.id;
  const userNotifications = db.notifications.filter(notif => notif.userId === userId);
  
  // If no notifications exist, create some sample ones
  if (userNotifications.length === 0) {
    const sampleNotifications = [
      {
        id: uuidv4(),
        userId,
        type: 'login',
        title: 'New Login Detected',
        message: 'A new login was detected from your account on a new device.',
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      },
      {
        id: uuidv4(),
        userId,
        type: 'payment',
        title: 'Bill Payment Successful',
        message: 'Your bill payment of NGN 5,000 to IKEDC was successful.',
        read: false,
        createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
      },
      {
        id: uuidv4(),
        userId,
        type: 'security',
        title: 'Security Settings Updated',
        message: 'Your security settings were updated. If this was not you, please contact support.',
        read: true,
        createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    ];
    
    db.notifications.push(...sampleNotifications);
    saveMockData();
    
    return res.json({ success: true, notifications: sampleNotifications });
  }
  
  res.json({ success: true, notifications: userNotifications });
});

app.put('/notifications/:notificationId/read', authenticate, (req, res) => {
  const userId = req.user.id;
  const { notificationId } = req.params;
  
  const notification = db.notifications.find(
    n => n.id === notificationId && n.userId === userId
  );
  
  if (!notification) {
    return res.status(404).json({ 
      success: false, 
      error: 'Notification not found' 
    });
  }
  
  // Mark as read
  notification.read = true;
  saveMockData();
  
  res.json({ success: true, notification });
});

// Security endpoints
app.post('/security/set-transaction-pin', authenticate, (req, res) => {
  const { pin } = req.body;
  const userId = req.user.userId;
  
  if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
    return res.status(400).json({ message: 'PIN must be a 4-digit number' });
  }
  
  // Find user
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Update user with PIN
  db.users[userIndex].transactionPin = pin;
  db.users[userIndex].onboardingSteps = db.users[userIndex].onboardingSteps || {};
  db.users[userIndex].onboardingSteps.pinSetup = true;
  saveMockData();
  
  res.status(200).json({ 
    message: 'Transaction PIN set successfully',
    onboardingStatus: {
      pinSetup: true,
      bvnVerified: db.users[userIndex].onboardingSteps.bvnVerified || false,
      usernameTagSet: db.users[userIndex].onboardingSteps.usernameTagSet || false,
      tagsSelected: db.users[userIndex].onboardingSteps.tagsSelected || false,
      onboardingComplete: false
    }
  });
});

app.post('/security/verify-transaction-pin', authenticate, (req, res) => {
  const { pin } = req.body;
  const userId = req.user.userId;
  
  if (!pin) {
    return res.status(400).json({ message: 'PIN is required' });
  }
  
  // Find user
  const user = db.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Check if PIN is set
  if (!user.transactionPin) {
    return res.status(400).json({ message: 'Transaction PIN not set' });
  }
  
  // Verify PIN
  if (user.transactionPin !== pin) {
    return res.status(400).json({ message: 'Invalid PIN' });
  }
  
  res.status(200).json({ message: 'PIN verified successfully' });
});

app.post('/security/trusted-devices', authenticate, (req, res) => {
  const userId = req.user.id;
  const { deviceId, deviceName, deviceType } = req.body;
  
  // Input validation
  if (!deviceId || !deviceName || !deviceType) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: deviceId, deviceName, deviceType' 
    });
  }
  
  // Check if device already exists
  const existingDevice = db.trustedDevices.find(
    device => device.userId === userId && device.deviceId === deviceId
  );
  
  if (existingDevice) {
    return res.status(400).json({ 
      success: false, 
      error: 'Device already registered' 
    });
  }
  
  // Create new trusted device
  const newDevice = {
    id: uuidv4(),
    userId,
    deviceId,
    deviceName,
    deviceType,
    trusted: true,
    lastUsed: new Date().toISOString(),
    dateAdded: new Date().toISOString()
  };
  
  db.trustedDevices.push(newDevice);
  saveMockData();
  
  res.json({ success: true, device: newDevice });
});

// Username tag endpoints
app.get('/tag/check-availability/:username', authenticate, (req, res) => {
  const { username } = req.params;
  
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }
  
  // Validate username format
  if (!/^[a-z0-9_]+$/.test(username)) {
    return res.status(400).json({ 
      message: 'Username can only contain lowercase letters, numbers, and underscores',
      isAvailable: false
    });
  }
  
  if (username.length < 3) {
    return res.status(400).json({ 
      message: 'Username must be at least 3 characters long',
      isAvailable: false
    });
  }
  
  // Check if username is taken
  const isUsernameTaken = db.users.some(u => u.usernameTag === username);
  
  if (isUsernameTaken) {
    return res.status(200).json({ 
      message: 'Username is already taken',
      isAvailable: false
    });
  }
  
  res.status(200).json({ 
    message: 'Username is available',
    isAvailable: true
  });
});

app.post('/tag/set-username', authenticate, (req, res) => {
  const { username } = req.body;
  const userId = req.user.userId;
  
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }
  
  // Validate username format
  if (!/^[a-z0-9_]+$/.test(username)) {
    return res.status(400).json({ 
      message: 'Username can only contain lowercase letters, numbers, and underscores'
    });
  }
  
  if (username.length < 3) {
    return res.status(400).json({ 
      message: 'Username must be at least 3 characters long'
    });
  }
  
  // Check if username is taken
  const isUsernameTaken = db.users.some(u => u.usernameTag === username && u.id !== userId);
  
  if (isUsernameTaken) {
    return res.status(400).json({ 
      message: 'Username is already taken'
    });
  }
  
  // Find user
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Update user with username tag
  db.users[userIndex].usernameTag = username;
  db.users[userIndex].onboardingSteps = db.users[userIndex].onboardingSteps || {};
  db.users[userIndex].onboardingSteps.usernameTagSet = true;
  saveMockData();
  
  res.status(200).json({ 
    message: 'Username tag set successfully',
    usernameTag: username,
    onboardingStatus: {
      pinSetup: db.users[userIndex].onboardingSteps.pinSetup || false,
      bvnVerified: db.users[userIndex].onboardingSteps.bvnVerified || false,
      usernameTagSet: true,
      tagsSelected: db.users[userIndex].onboardingSteps.tagsSelected || false,
      onboardingComplete: false
    }
  });
});

// BVN verification endpoints
app.post('/bvn/verify', authenticate, (req, res) => {
  const { bvn, firstName, lastName, dateOfBirth, phoneNumber } = req.body;
  const userId = req.user.userId;
  
  if (!bvn || !firstName || !lastName) {
    return res.status(400).json({ message: 'BVN, first name, and last name are required' });
  }
  
  // Validate BVN format (11 digits)
  if (!/^\d{11}$/.test(bvn)) {
    return res.status(400).json({ message: 'BVN must be 11 digits' });
  }
  
  // Simulate BVN verification
  const transactionRef = uuidv4();
  
  // Find user - use findIndex for direct access to the array element
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Save BVN verification data
  db.users[userIndex].bvnVerification = {
    bvn,
    firstName,
    lastName,
    dateOfBirth,
    phoneNumber,
    transactionRef,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  // Save data asynchronously - don't wait for it to complete
  saveMockData();
  
  // Return success with transaction reference immediately
  res.status(200).json({
    message: 'BVN verification initiated successfully',
    transactionRef,
    requiresOtp: true
  });
});

app.post('/bvn/confirm-otp', authenticate, (req, res) => {
  const { transactionRef, otp } = req.body;
  const userId = req.user.userId;
  
  if (!transactionRef || !otp) {
    return res.status(400).json({ message: 'Transaction reference and OTP are required' });
  }
  
  // Find user - use findIndex for direct access to the array element
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Check if BVN verification exists
  if (!db.users[userIndex].bvnVerification || db.users[userIndex].bvnVerification.transactionRef !== transactionRef) {
    return res.status(400).json({ message: 'Invalid transaction reference' });
  }
  
  // Validate OTP (for mock, any 6-digit number is valid)
  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({ message: 'OTP must be 6 digits' });
  }
  
  // Update BVN verification status
  db.users[userIndex].bvnVerification.status = 'verified';
  db.users[userIndex].bvnVerification.verifiedAt = new Date().toISOString();
  db.users[userIndex].onboardingSteps = db.users[userIndex].onboardingSteps || {};
  db.users[userIndex].onboardingSteps.bvnVerified = true;
  
  // Save data asynchronously - don't wait for it to complete
  saveMockData();
  
  // Return response immediately
  res.status(200).json({
    message: 'BVN verified successfully',
    onboardingStatus: {
      pinSetup: db.users[userIndex].onboardingSteps.pinSetup || false,
      bvnVerified: true,
      usernameTagSet: db.users[userIndex].onboardingSteps.usernameTagSet || false,
      tagsSelected: db.users[userIndex].onboardingSteps.tagsSelected || false,
      onboardingComplete: false
    }
  });
});

app.get('/bvn/status', authenticate, (req, res) => {
  const userId = req.user.userId;
  
  // Find user
  const user = db.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Check BVN verification status
  if (!user.bvnVerification) {
    return res.status(200).json({
      isVerified: false,
      message: 'BVN not verified'
    });
  }
  
  res.status(200).json({
    isVerified: user.bvnVerification.status === 'verified',
    message: user.bvnVerification.status === 'verified' ? 'BVN verified' : 'BVN verification pending',
    bvnData: {
      bvn: user.bvnVerification.bvn,
      firstName: user.bvnVerification.firstName,
      lastName: user.bvnVerification.lastName,
      status: user.bvnVerification.status
    }
  });
});

// Tag selection endpoints
app.get('/tag/available-tags', authenticate, (req, res) => {
  // Return a list of available tags
  const availableTags = [
    { id: '1', name: 'Food', icon: '🍔' },
    { id: '2', name: 'Travel', icon: '✈️' },
    { id: '3', name: 'Shopping', icon: '🛍️' },
    { id: '4', name: 'Entertainment', icon: '🎬' },
    { id: '5', name: 'Sports', icon: '⚽' },
    { id: '6', name: 'Technology', icon: '💻' },
    { id: '7', name: 'Health', icon: '🏥' },
    { id: '8', name: 'Education', icon: '📚' },
    { id: '9', name: 'Finance', icon: '💰' },
    { id: '10', name: 'Art', icon: '🎨' },
    { id: '11', name: 'Music', icon: '🎵' },
    { id: '12', name: 'Fashion', icon: '👗' },
    { id: '13', name: 'Beauty', icon: '💄' },
    { id: '14', name: 'Fitness', icon: '🏋️' },
    { id: '15', name: 'Gaming', icon: '🎮' }
  ];
  
  res.status(200).json({ tags: availableTags });
});

app.post('/tag/select-tags', authenticate, (req, res) => {
  const { tagIds } = req.body;
  const userId = req.user.userId;
  
  if (!tagIds || !Array.isArray(tagIds)) {
    return res.status(400).json({ message: 'Tag IDs must be an array' });
  }
  
  if (tagIds.length > 5) {
    return res.status(400).json({ message: 'You can select up to 5 tags' });
  }
  
  // Find user
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Update user with selected tags
  db.users[userIndex].selectedTags = tagIds;
  db.users[userIndex].onboardingSteps = db.users[userIndex].onboardingSteps || {};
  db.users[userIndex].onboardingSteps.tagsSelected = true;
  
  // Check if all onboarding steps are complete
  const onboardingSteps = db.users[userIndex].onboardingSteps;
  const isOnboardingComplete = 
    onboardingSteps.pinSetup && 
    onboardingSteps.usernameTagSet && 
    onboardingSteps.tagsSelected;
  
  // Update onboarding status
  db.users[userIndex].onboardingSteps.onboardingComplete = isOnboardingComplete;
  saveMockData();
  
  res.status(200).json({
    message: 'Tags selected successfully',
    onboardingStatus: {
      pinSetup: onboardingSteps.pinSetup || false,
      bvnVerified: onboardingSteps.bvnVerified || false,
      usernameTagSet: onboardingSteps.usernameTagSet || false,
      tagsSelected: true,
      onboardingComplete: isOnboardingComplete
    }
  });
});

// Start server
function startServer() {
  // Load mock data
  loadMockData();
  
  // Start listening
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Mock server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API documentation: http://localhost:${PORT}/api-docs`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down mock server...');
  saveMockData();
  process.exit(0);
});

// Start the server
startServer();
