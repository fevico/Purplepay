const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

// Configuration
const USER_ID = '67da9f93ff21f937aa28f92b'; // User ID from verification
const SECRET_KEY = process.env.JWT_SECRET || 'your_jwt_secret_here';

console.log('Using JWT Secret:', SECRET_KEY);
console.log('Using User ID:', USER_ID);

try {
  // Generate token
  const token = jwt.sign(
    { userId: USER_ID },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  console.log('\nGenerated JWT Token:');
  console.log(token);

  // Save token to file
  fs.writeFileSync('simple-token.txt', token, 'utf8');
  console.log('\nToken saved to simple-token.txt');

  // Verify token
  const decoded = jwt.verify(token, SECRET_KEY);
  console.log('\nDecoded token payload:');
  console.log(decoded);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
