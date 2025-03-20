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

// Simple User Schema with Tag
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
    sparse: true,
    match: /^[a-zA-Z0-9_]{3,20}$/
  },
  tagPrivacy: {
    type: String,
    enum: ["public", "friends", "private"],
    default: "public"
  },
  profilePicture: {
    type: String,
    default: ""
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

const User = mongoose.model('User', userSchema);

// Authentication middleware
const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = decoded;
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Tag Service Functions
const generateTagSuggestion = (name) => {
  if (!name) return [];
  
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  return [
    cleanName,
    `${cleanName}${Math.floor(Math.random() * 1000)}`,
    `${cleanName}${Math.floor(Math.random() * 100)}`,
    `${cleanName}_${Math.floor(Math.random() * 100)}`,
  ];
};

const checkTagAvailability = async (tag) => {
  if (!tag.match(/^[a-zA-Z0-9_]{3,20}$/)) {
    return { available: false, message: 'Tag must be 3-20 alphanumeric characters or underscores' };
  }
  
  const existingUser = await User.findOne({ tag });
  
  return {
    available: !existingUser,
    message: existingUser ? 'Tag is already taken' : 'Tag is available'
  };
};

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phoneNumber, country, tag } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Check tag availability if provided
    if (tag) {
      const tagCheck = await checkTagAvailability(tag);
      if (!tagCheck.available) {
        return res.status(400).json({ message: tagCheck.message });
      }
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      phoneNumber,
      country,
      tag
    });
    
    await user.save();
    
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
        email: user.email,
        tag: user.tag
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Tag routes
app.get('/api/tag/suggestions', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Generate tag suggestions based on name
    const suggestions = generateTagSuggestion(user.name);
    
    res.json({ suggestions });
  } catch (error) {
    console.error('Tag suggestions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/tag/check', async (req, res) => {
  try {
    const { tag } = req.body;
    
    if (!tag) {
      return res.status(400).json({ message: 'Tag is required' });
    }
    
    const result = await checkTagAvailability(tag);
    
    res.json(result);
  } catch (error) {
    console.error('Tag check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/tag', isAuthenticated, async (req, res) => {
  try {
    const { tag } = req.body;
    
    if (!tag) {
      return res.status(400).json({ message: 'Tag is required' });
    }
    
    // Check tag availability
    const tagCheck = await checkTagAvailability(tag);
    if (!tagCheck.available) {
      return res.status(400).json({ message: tagCheck.message });
    }
    
    // Update user's tag
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { tag },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Tag updated successfully',
      tag: user.tag
    });
  } catch (error) {
    console.error('Tag update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/tag/privacy', isAuthenticated, async (req, res) => {
  try {
    const { privacy } = req.body;
    
    if (!privacy || !['public', 'friends', 'private'].includes(privacy)) {
      return res.status(400).json({ message: 'Valid privacy setting is required' });
    }
    
    // Update user's tag privacy
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { tagPrivacy: privacy },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      message: 'Tag privacy updated successfully',
      tagPrivacy: user.tagPrivacy
    });
  } catch (error) {
    console.error('Tag privacy update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/user/by-tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    
    // Find user by tag
    const user = await User.findOne({ tag, tagPrivacy: 'public' })
      .select('name tag profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found or tag is private' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Find user by tag error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
const PORT = 9883;
app.listen(PORT, () => {
  console.log(`Tag system test server is running on port ${PORT}`);
});
