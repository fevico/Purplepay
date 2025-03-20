const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Create Express app
const app = express();
const PORT = process.env.PORT || 9878;

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id']
}));

app.use(express.json());

// In-memory database
const db = {
  users: [],
  securitySettings: [],
  bvnVerifications: [],
  tags: [
    { id: '1', name: 'Finance', icon: '💰' },
    { id: '2', name: 'Technology', icon: '💻' },
    { id: '3', name: 'Health', icon: '🏥' },
    { id: '4', name: 'Education', icon: '🎓' },
    { id: '5', name: 'Entertainment', icon: '🎬' }
  ],
  userTags: [],
  usernames: []
};

// Middleware to check for user-id header
const requireUserId = (req, res, next) => {
  const userId = req.headers['user-id'];
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required in the headers' });
  }
  req.userId = userId;
  next();
};

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

// Auth endpoints
app.post('/auth/register', (req, res) => {
  const { email, password, name, phoneNumber } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Email, password, and name are required' });
  }
  
  // Check if user already exists
  const existingUser = db.users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'User already exists' });
  }
  
  // Create new user
  const userId = uuidv4();
  const verificationToken = uuidv4().substring(0, 6);
  
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
  
  res.status(201).json({
    message: 'User registered successfully',
    userId,
    verificationToken
  });
});

app.post('/auth/verify', requireUserId, (req, res) => {
  const { userId, token } = req.body;
  
  if (!userId || !token) {
    return res.status(400).json({ message: 'User ID and token are required' });
  }
  
  // Check if user-id in headers matches userId in body
  if (req.userId !== userId) {
    return res.status(400).json({ message: 'User ID in headers does not match User ID in request body' });
  }
  
  // Find user
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  if (db.users[userIndex].verificationToken !== token) {
    return res.status(400).json({ message: 'Invalid verification token' });
  }
  
  // Update user
  db.users[userIndex].verified = true;
  db.users[userIndex].verificationToken = null;
  
  // Generate auth token
  const authToken = uuidv4();
  
  res.status(200).json({
    message: 'User verified successfully',
    token: authToken,
    user: {
      id: db.users[userIndex].id,
      email: db.users[userIndex].email,
      name: db.users[userIndex].name,
      onboardingStatus: db.users[userIndex].onboardingStatus
    }
  });
});

// Security endpoints
app.post('/security/set-transaction-pin', requireUserId, (req, res) => {
  const { pin } = req.body;
  const userId = req.userId;
  
  if (!pin) {
    return res.status(400).json({ message: 'PIN is required' });
  }
  
  // Validate PIN format
  if (!/^\d{4}$/.test(pin)) {
    return res.status(400).json({ message: 'PIN must be a 4-digit number' });
  }
  
  // Find user
  const userIndex = db.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Update security settings
  const existingSettingsIndex = db.securitySettings.findIndex(s => s.userId === userId);
  
  if (existingSettingsIndex === -1) {
    // Create new security settings
    db.securitySettings.push({
      userId,
      pin,
      createdAt: new Date().toISOString()
    });
  } else {
    // Update existing security settings
    db.securitySettings[existingSettingsIndex].pin = pin;
    db.securitySettings[existingSettingsIndex].updatedAt = new Date().toISOString();
  }
  
  // Update onboarding status
  db.users[userIndex].onboardingStatus.pinSetup = true;
  
  res.status(200).json({
    message: 'Transaction PIN set successfully',
    onboardingStatus: db.users[userIndex].onboardingStatus
  });
});

app.post('/security/verify-transaction-pin', requireUserId, (req, res) => {
  const { pin } = req.body;
  const userId = req.userId;
  
  if (!pin) {
    return res.status(400).json({ message: 'PIN is required' });
  }
  
  // Find security settings
  const securitySettings = db.securitySettings.find(s => s.userId === userId);
  
  if (!securitySettings) {
    return res.status(404).json({ message: 'Security settings not found' });
  }
  
  if (securitySettings.pin !== pin) {
    return res.status(400).json({ message: 'Invalid PIN' });
  }
  
  res.status(200).json({
    message: 'PIN verified successfully',
    verified: true
  });
});

app.get('/security/settings', requireUserId, (req, res) => {
  const userId = req.userId;
  
  // Find user
  const user = db.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Find security settings
  const securitySettings = db.securitySettings.find(s => s.userId === userId);
  
  res.status(200).json({
    hasPinSetup: !!securitySettings,
    onboardingStatus: user.onboardingStatus
  });
});

// BVN endpoints
app.post('/bvn/verify', requireUserId, (req, res) => {
  const { bvn, firstName, lastName, dateOfBirth, phoneNumber } = req.body;
  const userId = req.userId;
  
  if (!bvn || !firstName || !lastName || !dateOfBirth) {
    return res.status(400).json({ message: 'BVN, firstName, lastName, and dateOfBirth are required' });
  }
  
  // Validate BVN format
  if (!/^\d{11}$/.test(bvn)) {
    return res.status(400).json({ message: 'BVN must be an 11-digit number' });
  }
  
  // Create BVN verification record
  const transactionRef = uuidv4();
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  
  db.bvnVerifications.push({
    userId,
    bvn,
    firstName,
    lastName,
    dateOfBirth,
    phoneNumber,
    transactionRef,
    otp,
    verified: false,
    createdAt: new Date().toISOString()
  });
  
  res.status(200).json({
    message: 'BVN verification initiated',
    transactionRef,
    phoneNumber: phoneNumber ? phoneNumber.substring(0, 4) + '****' + phoneNumber.substring(phoneNumber.length - 4) : null
  });
});

app.post('/bvn/confirm-otp', requireUserId, (req, res) => {
  const { transactionRef, otp } = req.body;
  const userId = req.userId;
  
  if (!transactionRef || !otp) {
    return res.status(400).json({ message: 'Transaction reference and OTP are required' });
  }
  
  // Find BVN verification
  const bvnVerificationIndex = db.bvnVerifications.findIndex(v => v.userId === userId && v.transactionRef === transactionRef);
  
  if (bvnVerificationIndex === -1) {
    return res.status(404).json({ message: 'BVN verification not found' });
  }
  
  if (db.bvnVerifications[bvnVerificationIndex].otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  
  // Update BVN verification
  db.bvnVerifications[bvnVerificationIndex].verified = true;
  db.bvnVerifications[bvnVerificationIndex].verifiedAt = new Date().toISOString();
  
  // Update user's onboarding status
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    db.users[userIndex].onboardingStatus.bvnVerified = true;
  }
  
  res.status(200).json({
    message: 'BVN verified successfully',
    verified: true,
    onboardingStatus: userIndex !== -1 ? db.users[userIndex].onboardingStatus : null
  });
});

// Tag endpoints
app.get('/tag/check-availability/:username', (req, res) => {
  const { username } = req.params;
  const userId = req.headers['user-id']; // Optional for this endpoint
  
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }
  
  // Validate username format
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ 
      message: 'Username must be 3-20 characters long and contain only lowercase letters, numbers, and underscores',
      available: false
    });
  }
  
  // Check if username is taken
  const existingUsername = db.usernames.find(u => u.username === username);
  
  res.status(200).json({
    available: !existingUsername,
    username
  });
});

app.post('/tag/set-username', requireUserId, (req, res) => {
  const { username } = req.body;
  const userId = req.userId;
  
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }
  
  // Validate username format
  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return res.status(400).json({ 
      message: 'Username must be 3-20 characters long and contain only lowercase letters, numbers, and underscores'
    });
  }
  
  // Check if username is taken
  const existingUsername = db.usernames.find(u => u.username === username);
  if (existingUsername) {
    return res.status(400).json({ message: 'Username is already taken' });
  }
  
  // Find if user already has a username
  const existingUserUsernameIndex = db.usernames.findIndex(u => u.userId === userId);
  
  if (existingUserUsernameIndex === -1) {
    // Create new username
    db.usernames.push({
      userId,
      username,
      createdAt: new Date().toISOString()
    });
  } else {
    // Update existing username
    db.usernames[existingUserUsernameIndex].username = username;
    db.usernames[existingUserUsernameIndex].updatedAt = new Date().toISOString();
  }
  
  // Update user's onboarding status
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    db.users[userIndex].onboardingStatus.usernameTagSet = true;
  }
  
  res.status(200).json({
    message: 'Username set successfully',
    username,
    onboardingStatus: userIndex !== -1 ? db.users[userIndex].onboardingStatus : null
  });
});

app.get('/tag/available-tags', (req, res) => {
  const userId = req.headers['user-id']; // Optional for this endpoint
  
  res.status(200).json({
    tags: db.tags
  });
});

app.post('/tag/select-tags', requireUserId, (req, res) => {
  const { tagIds } = req.body;
  const userId = req.userId;
  
  if (!tagIds || !Array.isArray(tagIds)) {
    return res.status(400).json({ message: 'Tag IDs must be an array' });
  }
  
  if (tagIds.length > 5) {
    return res.status(400).json({ message: 'You can select up to 5 tags' });
  }
  
  // Validate tag IDs
  const validTagIds = tagIds.filter(id => db.tags.some(t => t.id === id));
  
  if (validTagIds.length !== tagIds.length) {
    return res.status(400).json({ message: 'Some tag IDs are invalid' });
  }
  
  // Remove existing user tags
  db.userTags = db.userTags.filter(ut => ut.userId !== userId);
  
  // Add new user tags
  validTagIds.forEach(tagId => {
    db.userTags.push({
      userId,
      tagId,
      createdAt: new Date().toISOString()
    });
  });
  
  // Update user's onboarding status
  const userIndex = db.users.findIndex(u => u.id === userId);
  if (userIndex !== -1) {
    db.users[userIndex].onboardingStatus.tagsSelected = true;
    
    // Check if onboarding is complete
    const { pinSetup, usernameTagSet, tagsSelected } = db.users[userIndex].onboardingStatus;
    if (pinSetup && usernameTagSet && tagsSelected) {
      db.users[userIndex].onboardingStatus.onboardingComplete = true;
    }
  }
  
  res.status(200).json({
    message: 'Tags selected successfully',
    selectedTags: validTagIds.map(id => db.tags.find(t => t.id === id)),
    onboardingStatus: userIndex !== -1 ? db.users[userIndex].onboardingStatus : null
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test endpoints server is running on port ${PORT}`);
});
