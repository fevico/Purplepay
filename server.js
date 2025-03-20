const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { Resend } = require('resend');
const Prelude = require('@prelude.so/sdk');

const app = express();
const PORT = process.env.PORT || 9877;

// Initialize Resend for email
const resend = new Resend('re_e9jSYtdk_5hJjPGTJGeJ7rc5YGMVjhiuV');

// Initialize Prelude for SMS
const prelude = new Prelude({
  apiToken: 'sk_Ul3aeDkmRjAEdtftMSzO2UIHreemcrRD',
});

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static('public'));

// Initialize database
let db = {
  users: [],
  transactions: [],
  bvnVerifications: [],
  tags: [
    { id: '1', name: 'Finance', icon: '💰' },
    { id: '2', name: 'Technology', icon: '💻' },
    { id: '3', name: 'Health', icon: '🏥' },
    { id: '4', name: 'Education', icon: '🎓' },
    { id: '5', name: 'Entertainment', icon: '🎬' },
    { id: '6', name: 'Food', icon: '🍔' },
    { id: '7', name: 'Travel', icon: '✈️' },
    { id: '8', name: 'Shopping', icon: '🛍️' },
    { id: '9', name: 'Sports', icon: '⚽' },
    { id: '10', name: 'Music', icon: '🎵' }
  ],
  userTags: [],
  emailVerifications: [], // Store email verification data
  smsVerifications: [] // Store SMS verification data
};

// Load mock data if exists
const mockDataPath = path.join(__dirname, 'mock-data.json');
try {
  if (fs.existsSync(mockDataPath)) {
    const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));
    db = { ...db, ...mockData };
    console.log('Loaded mock data from file');
  }
} catch (error) {
  console.error('Error loading mock data:', error);
}

// Function to save mock data
function saveMockData() {
  try {
    fs.writeFileSync(mockDataPath, JSON.stringify(db, null, 2), 'utf8');
    console.log('Mock data saved to file');
  } catch (error) {
    console.error('Error saving mock data:', error);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    services: {
      api: 'UP',
      database: 'UP'
    }
  });
});

// Authentication endpoints
app.post('/auth/register', (req, res) => {
  const { email, password, name, phoneNumber } = req.body;
  
  console.log('Registration request received:', { email, name, phoneNumber });
  
  // Validate required fields
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }
  
  // Check if user already exists
  const existingUser = db.users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }
  
  // Create new user
  const userId = uuidv4();
  const verificationToken = crypto.randomBytes(3).toString('hex'); // 6-character code
  
  const newUser = {
    id: userId,
    email,
    password, // In a real app, this would be hashed
    name,
    phoneNumber: phoneNumber || '',
    verified: false,
    verificationToken,
    createdAt: new Date().toISOString(),
    onboardingStatus: {
      pinSetup: false,
      bvnVerified: false,
      usernameTagSet: false,
      tagsSelected: false,
      onboardingComplete: false
    }
  };
  
  db.users.push(newUser);
  
  // Store verification data
  db.emailVerifications.push({
    userId,
    email,
    token: verificationToken,
    createdAt: new Date().toISOString()
  });
  
  // Send verification email
  // Send email using Resend
  resend.emails.send({
    from: 'PurplePay <onboarding@email.propease.ca>',
    to: email,
    subject: 'Verify your PurplePay account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h1 style="color: #6200ee;">Welcome to PurplePay!</h1>
        <p>Hello ${name},</p>
        <p>You requested a new verification code. Please use the code below to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #6200ee;">
          ${verificationToken}
        </div>
        <p>If you did not create an account with PurplePay, please ignore this email.</p>
        <p>Best regards,<br>The PurplePay Team</p>
      </div>
    `
  }).then(response => {
    console.log('Verification email sent:', response);
  }).catch(error => {
    console.error('Error sending verification email:', error);
  });
  
  // Log verification info for testing
  console.log('Email verification info:', {
    userId,
    email,
    token: verificationToken
  });
  
  // Save data asynchronously
  saveMockData();
  
  // Return success response
  res.status(201).json({
    message: 'User registered successfully',
    id: userId,
    token: verificationToken
  });
});

// Add a mock email verification page
app.get('/verify-email', (req, res) => {
  const { userId, token } = req.query;
  
  // Check if verification data exists
  const verificationData = db.emailVerifications.find(v => v.userId === userId && v.token === token);
  
  if (!verificationData) {
    return res.send(`
      <html>
        <head>
          <title>Email Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
            .error { color: #e74c3c; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Verification Failed</h1>
            <p>The verification link is invalid or has expired.</p>
            <p>Please try again or contact support.</p>
          </div>
        </body>
      </html>
    `);
  }
  
  // Find user
  const userIndex = db.users.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.send(`
      <html>
        <head>
          <title>Email Verification Failed</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
            .error { color: #e74c3c; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="error">Verification Failed</h1>
            <p>User not found.</p>
            <p>Please try again or contact support.</p>
          </div>
        </body>
      </html>
    `);
  }
  
  // Update user verification status
  db.users[userIndex].verified = true;
  
  // Remove verification data
  db.emailVerifications = db.emailVerifications.filter(v => !(v.userId === userId && v.token === token));
  
  // Save data
  saveMockData();
  
  // Return success page
  res.send(`
    <html>
      <head>
        <title>Email Verified Successfully</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; }
          .success { color: #2ecc71; }
          h1 { color: #333; }
          .button {
            display: inline-block;
            background-color: #6200ee;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="success">Email Verified Successfully!</h1>
          <p>Your email has been verified successfully.</p>
          <p>You can now proceed with the PurplePay onboarding process.</p>
          <a href="exp://localhost:19000" class="button">Open PurplePay App</a>
        </div>
      </body>
    </html>
  `);
});

// Add an endpoint to get verification link for testing
app.get('/get-verification-link/:email', (req, res) => {
  const { email } = req.params;
  
  // Find verification data
  const verificationData = db.emailVerifications.find(v => v.email === email);
  
  if (!verificationData) {
    return res.status(404).json({ message: 'Verification data not found for this email' });
  }
  
  // Generate verification link
  const verificationLink = `${req.protocol}://${req.get('host')}/verify-email?userId=${verificationData.userId}&token=${verificationData.token}`;
  
  res.json({
    email,
    verificationLink
  });
});

app.post('/auth/resend-otp', (req, res) => {
  const { email } = req.body;
  
  // Find user
  const user = db.users.find(user => user.email === email);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Check if user is already verified
  if (user.verified) {
    return res.status(400).json({ message: 'User is already verified' });
  }
  
  // Generate new verification token
  const verificationToken = crypto.randomBytes(3).toString('hex'); // 6-character code
  
  // Update user
  user.verificationToken = verificationToken;
  
  // Store verification data
  const existingVerificationIndex = db.emailVerifications.findIndex(v => v.userId === user.id);
  
  if (existingVerificationIndex !== -1) {
    // Update existing verification
    db.emailVerifications[existingVerificationIndex].token = verificationToken;
    db.emailVerifications[existingVerificationIndex].createdAt = new Date().toISOString();
  } else {
    // Create new verification
    db.emailVerifications.push({
      userId: user.id,
      email,
      token: verificationToken,
      createdAt: new Date().toISOString()
    });
  }
  
  // Send verification email
  // Send email using Resend
  resend.emails.send({
    from: 'PurplePay <onboarding@email.propease.ca>',
    to: email,
    subject: 'Verify your PurplePay account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h1 style="color: #6200ee;">Welcome to PurplePay!</h1>
        <p>Hello ${user.name},</p>
        <p>You requested a new verification code. Please use the code below to verify your email address:</p>
        <div style="background-color: #f4f4f4; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0; font-size: 24px; letter-spacing: 5px; font-weight: bold; color: #6200ee;">
          ${verificationToken}
        </div>
        <p>If you did not create an account with PurplePay, please ignore this email.</p>
        <p>Best regards,<br>The PurplePay Team</p>
      </div>
    `
  }).then(response => {
    console.log('Verification email resent:', response);
  }).catch(error => {
    console.error('Error resending verification email:', error);
  });
  
  // Log verification info for testing
  console.log('Resent email verification info:', {
    userId: user.id,
    email,
    token: verificationToken
  });
  
  // Save data
  saveMockData();
  
  // Return success response
  res.json({
    message: 'Verification code resent successfully',
    id: user.id,
    token: verificationToken
  });
});

app.post('/auth/verify', (req, res) => {
  const { userId, token } = req.body;
  
  // Validate required fields
  if (!userId || !token) {
    return res.status(400).json({ message: 'User ID and verification token are required' });
  }
  
  // Find user
  const userIndex = db.users.findIndex(user => user.id === userId && user.verificationToken === token);
  if (userIndex === -1) {
    return res.status(400).json({ message: 'Invalid verification token' });
  }
  
  // Update user's verification status
  db.users[userIndex].verified = true;
  
  // Generate access token for automatic login
  const accessToken = uuidv4();
  
  // Save data
  saveMockData();
  
  // Return success response
  res.json({
    message: 'User verified',
    token: accessToken,
    userId: db.users[userIndex].id,
    onboardingStatus: db.users[userIndex].onboardingStatus
  });
});

// Keep the GET endpoint for backward compatibility
app.get('/auth/verify', (req, res) => {
  const { userId, token } = req.query;
  
  // Validate required fields
  if (!userId || !token) {
    return res.status(400).json({ message: 'User ID and verification token are required' });
  }
  
  // Find user
  const userIndex = db.users.findIndex(user => user.id === userId && user.verificationToken === token);
  if (userIndex === -1) {
    return res.status(400).json({ message: 'Invalid verification token' });
  }
  
  // Update user's verification status
  db.users[userIndex].verified = true;
  
  // Save data
  saveMockData();
  
  // Return success response
  res.json({
    message: 'Email verified successfully',
    onboardingStatus: db.users[userIndex].onboardingStatus
  });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Find user
  const user = db.users.find(user => user.email === email && user.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  
  // Check if email is verified
  if (!user.verified) {
    return res.status(403).json({
      message: 'Email not verified',
      userId: user.id,
      requiresVerification: true
    });
  }
  
  // Generate access token
  const accessToken = uuidv4();
  
  // Return success response
  res.json({
    message: 'Login successful',
    token: accessToken,
    userId: user.id,
    name: user.name,
    email: user.email,
    onboardingStatus: user.onboardingStatus
  });
});

// BVN verification endpoints
app.post('/bvn/verify', (req, res) => {
  const { bvn, firstName, lastName, dateOfBirth, phoneNumber } = req.body;
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: 'User ID is required' });
  }
  
  if (!bvn || !firstName || !lastName) {
    return res.status(400).json({ message: 'BVN, first name, and last name are required' });
  }
  
  // Find user
  const userIndex = db.users.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Generate a verification code (in a real app, this would be sent via SMS)
  const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationId = uuidv4();
  
  // Store verification data
  db.bvnVerifications.push({
    id: verificationId,
    userId,
    bvn,
    verificationCode,
    verified: false,
    createdAt: new Date().toISOString()
  });
  
  // Save data
  saveMockData();
  
  // In a real app, we would send an SMS with the verification code
  // For testing, we'll include it in the response
  res.json({
    message: 'BVN verification initiated. Please check your phone for the verification code.',
    verificationId,
    verificationCode // This would not be included in a real app
  });
});

app.post('/bvn/confirm-otp', (req, res) => {
  const { verificationId, otp } = req.body;
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: 'User ID is required' });
  }
  
  if (!verificationId || !otp) {
    return res.status(400).json({ message: 'Verification ID and OTP are required' });
  }
  
  // Find verification
  const verificationIndex = db.bvnVerifications.findIndex(v => v.id === verificationId && v.userId === userId);
  if (verificationIndex === -1) {
    return res.status(404).json({ message: 'Verification not found' });
  }
  
  // Check OTP
  if (db.bvnVerifications[verificationIndex].verificationCode !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  
  // Update verification status
  db.bvnVerifications[verificationIndex].verified = true;
  
  // Update user's BVN verification status
  const userIndex = db.users.findIndex(user => user.id === userId);
  if (userIndex !== -1) {
    db.users[userIndex].bvnVerified = true;
    db.users[userIndex].onboardingStatus.bvnVerified = true;
  }
  
  // Save data
  saveMockData();
  
  // Return success response
  res.json({
    message: 'BVN verified successfully',
    onboardingStatus: db.users[userIndex].onboardingStatus
  });
});

app.get('/bvn/status', (req, res) => {
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: 'User ID is required' });
  }
  
  // Find user
  const user = db.users.find(user => user.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Return BVN verification status
  res.json({
    bvnVerified: user.bvnVerified || false,
    onboardingStatus: user.onboardingStatus
  });
});

// Security endpoints
app.post('/security/set-transaction-pin', (req, res) => {
  const { pin } = req.body;
  const userId = req.headers['user-id'];
  
  if (!userId || !pin) {
    return res.status(400).json({ message: 'User ID and PIN are required' });
  }
  
  // Find user
  const userIndex = db.users.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Update user
  db.users[userIndex].transactionPin = pin;
  db.users[userIndex].onboardingStatus.pinSetup = true;
  
  // Save data
  saveMockData();
  
  // Return success response
  res.json({
    message: 'Transaction PIN set successfully',
    onboardingStatus: db.users[userIndex].onboardingStatus
  });
});

app.post('/security/verify-transaction-pin', (req, res) => {
  const { pin } = req.body;
  const userId = req.headers['user-id'];
  
  if (!userId || !pin) {
    return res.status(400).json({ message: 'User ID and PIN are required' });
  }
  
  // Find user
  const user = db.users.find(user => user.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Check PIN
  if (user.transactionPin !== pin) {
    return res.status(400).json({ message: 'Invalid PIN' });
  }
  
  // Return success response
  res.json({
    message: 'PIN verified successfully',
    onboardingStatus: user.onboardingStatus
  });
});

// Tag endpoints
app.get('/tag/check-availability/:username', (req, res) => {
  const { username } = req.params;
  
  // Remove @ prefix if present for validation
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  
  // Validate username format
  if (!cleanUsername || cleanUsername.length < 3 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
    return res.status(400).json({ 
      message: 'Invalid username format. Username must be at least 3 characters and contain only lowercase letters, numbers, and underscores.',
      available: false
    });
  }
  
  // Check if username exists (without @ prefix)
  const usernameExists = db.users.some(user => user.username === cleanUsername);
  
  res.json({
    username: cleanUsername,
    displayUsername: `@${cleanUsername}`,
    available: !usernameExists,
    message: usernameExists ? 'Username is already taken' : 'Username is available'
  });
});

app.post('/tag/set-username', (req, res) => {
  const { username } = req.body;
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: 'User ID is required' });
  }
  
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }
  
  // Remove @ prefix if present for validation
  const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
  
  // Validate username format
  if (cleanUsername.length < 3 || !/^[a-z0-9_]+$/.test(cleanUsername)) {
    return res.status(400).json({ 
      message: 'Invalid username format. Username must be at least 3 characters and contain only lowercase letters, numbers, and underscores.'
    });
  }
  
  // Check if username exists (without @ prefix)
  const usernameExists = db.users.some(user => 
    user.username === cleanUsername && user.id !== userId
  );
  
  if (usernameExists) {
    return res.status(400).json({ message: 'Username is already taken' });
  }
  
  // Find user
  const userIndex = db.users.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Update user with clean username (without @ prefix)
  db.users[userIndex].username = cleanUsername;
  db.users[userIndex].onboardingStatus.usernameTagSet = true;
  
  // Save data
  saveMockData();
  
  // Return success response with @ prefix for display
  res.json({
    message: 'Username set successfully',
    username: cleanUsername,
    displayUsername: `@${cleanUsername}`,
    onboardingStatus: db.users[userIndex].onboardingStatus
  });
});

app.get('/tag/available-tags', (req, res) => {
  res.json({
    tags: db.tags
  });
});

app.post('/tag/select-tags', (req, res) => {
  const { tagIds } = req.body;
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: 'User ID is required' });
  }
  
  if (!tagIds || !Array.isArray(tagIds)) {
    return res.status(400).json({ message: 'Tag IDs are required and must be an array' });
  }
  
  // Enforce 5-tag limit
  if (tagIds.length > 5) {
    return res.status(400).json({ message: 'You can select a maximum of 5 tags' });
  }
  
  // Validate tag IDs
  const validTagIds = tagIds.filter(id => db.tags.some(tag => tag.id === id));
  
  // Find user
  const userIndex = db.users.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Update user tags
  db.userTags = db.userTags.filter(ut => ut.userId !== userId);
  
  validTagIds.forEach(tagId => {
    db.userTags.push({
      userId,
      tagId,
      createdAt: new Date().toISOString()
    });
  });
  
  // Update onboarding status
  db.users[userIndex].onboardingStatus.tagsSelected = true;
  
  // Check if onboarding is complete
  if (db.users[userIndex].onboardingStatus.pinSetup && 
      db.users[userIndex].onboardingStatus.usernameTagSet && 
      db.users[userIndex].onboardingStatus.tagsSelected) {
    db.users[userIndex].onboardingStatus.onboardingComplete = true;
  }
  
  // Save data
  saveMockData();
  
  // Return success response
  res.json({
    message: 'Tags selected successfully',
    selectedTags: validTagIds,
    onboardingStatus: db.users[userIndex].onboardingStatus
  });
});

// Onboarding status endpoint
app.get('/auth/onboarding-status', (req, res) => {
  const userId = req.headers['user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: 'User ID is required' });
  }
  
  // Find user
  const user = db.users.find(user => user.id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Return onboarding status
  res.json({
    onboardingStatus: user.onboardingStatus
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
});
