// Script to generate a valid JWT token for testing
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

// Get JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET;

console.log('Using JWT_SECRET:', JWT_SECRET);

if (!JWT_SECRET) {
  console.error('❌ JWT_SECRET not found in environment variables');
  process.exit(1);
}

// Create a test user payload
const testUser = {
  userId: '67daa8a93299ef107562fa76', // Use the ID from our MongoDB test
  email: 'test@example.com',
  name: 'Test User',
  verified: true
};

// Generate token with 24 hour expiration
const token = jwt.sign({ userId: testUser.userId }, JWT_SECRET, { expiresIn: '24h' });

console.log('✅ Test JWT token generated successfully:');
console.log(token);

// Save token to a file for easy access
fs.writeFileSync('test-token.txt', token);
console.log('✅ Token saved to test-token.txt');

// Also save to simple-token.txt for the simple test script
fs.writeFileSync('simple-token.txt', token);
console.log('✅ Token saved to simple-token.txt');

// Also output the token in the format needed for the test script
console.log('\nFor test-virtual-card-security.js, update the authToken variable to:');
console.log(`let authToken = '${token}';`);
