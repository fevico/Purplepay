// Simple test to verify the server is running
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 9876,
  path: '/',
  method: 'GET'
};

const req = http.request(options, res => {
  console.log(`Status Code: ${res.statusCode}`);
  
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error('Error connecting to server:', error.message);
});

req.end();

console.log('Sent request to server...');
