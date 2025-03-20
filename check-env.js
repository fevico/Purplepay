require('dotenv').config();

console.log('=== Environment Variables Check ===');
console.log('Checking for critical environment variables...');

// Check JWT_SECRET
if (process.env.JWT_SECRET) {
  console.log('JWT_SECRET: ✅ Set');
  console.log(`JWT_SECRET length: ${process.env.JWT_SECRET.length} characters`);
} else {
  console.log('JWT_SECRET: ❌ Not set');
}

// Check MONGODB_URI
if (process.env.MONGODB_URI) {
  console.log('MONGODB_URI: ✅ Set');
} else {
  console.log('MONGODB_URI: ❌ Not set');
}

// Check PORT
if (process.env.PORT) {
  console.log('PORT: ✅ Set to', process.env.PORT);
} else {
  console.log('PORT: ❌ Not set (will default to 9876)');
}

console.log('\n=== JWT Token Validation Test ===');
const jwt = require('jsonwebtoken');

try {
  // Read the token from file
  const fs = require('fs');
  const token = fs.readFileSync('jwt-token.txt', 'utf8').trim();
  
  console.log('Token from file:', token.substring(0, 20) + '...');
  
  // Try to verify the token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log('Token verification: ✅ Success');
  console.log('Decoded payload:', JSON.stringify(decoded, null, 2));
} catch (error) {
  console.log('Token verification: ❌ Failed');
  console.log('Error:', error.message);
}

console.log('\n=== Environment Check Complete ===');
