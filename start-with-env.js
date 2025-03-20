// Script to start the server with environment variables
const { spawn, execSync } = require('child_process');

// Set environment variables
process.env.PUBLIC_KEY = 'test-key';
process.env.PRIVATE_KEY = 'test-secret';
process.env.JWT_SECRET = 'purplepay-virtual-card-api-secret';

console.log('Server environment variables set:');
console.log('PUBLIC_KEY:', process.env.PUBLIC_KEY);
console.log('PRIVATE_KEY:', process.env.PRIVATE_KEY);
console.log('JWT_SECRET:', process.env.JWT_SECRET);

// Generate a test token with the JWT_SECRET
console.log('\nGenerating test token...');
try {
  execSync('node generate-test-token.js', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to generate test token:', error);
}

// Start the server
const server = spawn('node', ['dist/index.js'], {
  env: process.env,
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
});
