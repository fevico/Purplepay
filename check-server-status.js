const axios = require('axios');

// Try different ports
const ports = [9876, 9877, 3000];

async function checkPort(port) {
  try {
    console.log(`Checking if server is running on port ${port}...`);
    const response = await axios.get(`http://localhost:${port}`, { timeout: 2000 });
    console.log(`✅ Server responded on port ${port} with status: ${response.status}`);
    return true;
  } catch (error) {
    if (error.response) {
      // The server responded with a status code outside of 2xx
      console.log(`✅ Server is running on port ${port} but returned status: ${error.response.status}`);
      return true;
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`❌ Server is not running on port ${port} (Connection refused)`);
      return false;
    } else {
      console.log(`❌ Error checking port ${port}: ${error.message}`);
      return false;
    }
  }
}

async function main() {
  console.log('Checking server status...');
  
  let serverFound = false;
  
  for (const port of ports) {
    const isRunning = await checkPort(port);
    if (isRunning) {
      serverFound = true;
      console.log(`\nServer is running on port ${port}`);
      break;
    }
  }
  
  if (!serverFound) {
    console.log('\n❌ Server is not running on any of the checked ports.');
    console.log('Please make sure the server is started with: npm start');
  }
}

main().catch(error => {
  console.error('Error:', error.message);
});
