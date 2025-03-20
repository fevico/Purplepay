const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

// Configuration
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_here'; // Use the environment variable or fallback
const USER_ID = '67da375af4727658a76cfe33'; // User ID from the previous test

console.log('Using JWT Secret:', SECRET_KEY);

// Generate token
const token = jwt.sign(
  { userId: USER_ID },
  SECRET_KEY,
  { expiresIn: '1h' }
);

console.log('\nGenerated JWT Token:');
console.log(token);

// Save token to file
fs.writeFileSync('manual-token.txt', token, 'utf8');
console.log('\nToken saved to manual-token.txt');
