// Script to set environment variables for testing
process.env.PUBLIC_KEY = 'test-key';
process.env.PRIVATE_KEY = 'test-secret';

// Import the main test script
require('./test-virtual-card-api.js');
