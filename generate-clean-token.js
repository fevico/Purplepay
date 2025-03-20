// Script to generate a clean JWT token for testing
const jwt = require('jsonwebtoken');
const fs = require('fs');

// Use hardcoded JWT secret
const JWT_SECRET = 'purplepay-virtual-card-api-secret';

console.log('Using JWT_SECRET:', JWT_SECRET);

// Create a test user payload
const testUser = {
  userId: '67daaaa961855171211de6f8', // Use the ID from our MongoDB test
  email: 'test@example.com',
  name: 'Test User',
  verified: true
};

// Generate token with 24 hour expiration
const token = jwt.sign({ userId: testUser.userId }, JWT_SECRET, { expiresIn: '24h' });

console.log('✅ Test JWT token generated successfully:');
console.log(token);

// Save token to a file for easy access (with no line breaks)
fs.writeFileSync('clean-token.txt', token);
console.log('✅ Token saved to clean-token.txt');
