const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to get user input
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Check if npm is available
async function checkNpm() {
  return new Promise((resolve) => {
    exec('npm --version', (error) => {
      if (error) {
        console.log('❌ npm is not available in the PATH. Please install Node.js and npm.');
        resolve(false);
      } else {
        console.log('✅ npm is available.');
        resolve(true);
      }
    });
  });
}

// Check if package.json exists
function checkPackageJson() {
  const packagePath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found. This doesn\'t appear to be a Node.js project.');
    return false;
  }
  
  console.log('✅ package.json found.');
  return true;
}

// Check if .env file exists
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found. Creating a sample .env file...');
    
    const sampleEnvContent = `# Server Configuration
PORT=9876
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/purplepay

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1d

# Logging Configuration
LOG_LEVEL=debug

# Test Configuration
TEST_MODE=true
`;
    
    fs.writeFileSync(envPath, sampleEnvContent);
    console.log('✅ Sample .env file created. Please update it with your actual values.');
    return false;
  }
  
  console.log('✅ .env file found.');
  return true;
}

// Start the server using exec instead of spawn
async function startServerWithExec() {
  return new Promise((resolve) => {
    console.log('Starting server with exec...');
    
    // Use exec to start the server in the background
    exec('start cmd.exe /K "npm start"', { cwd: process.cwd() }, (error) => {
      if (error) {
        console.error('Failed to start server with exec:', error);
        resolve(false);
      } else {
        console.log('Server started in a new command window.');
        resolve(true);
      }
    });
  });
}

// Start the server with spawn
async function startServerWithSpawn() {
  return new Promise((resolve) => {
    try {
      console.log('Starting server with spawn...');
      
      const server = spawn('npm', ['start'], {
        cwd: process.cwd(),
        detached: true,
        stdio: 'ignore'
      });
      
      if (server.pid) {
        console.log(`Server process started with PID: ${server.pid}`);
        
        // Save PID to file for later reference
        fs.writeFileSync('server-pid.txt', server.pid.toString());
        console.log('Server PID saved to server-pid.txt');
        
        // Unref the child process so it doesn't keep the parent alive
        server.unref();
        resolve(true);
      } else {
        console.log('Failed to get server PID.');
        resolve(false);
      }
    } catch (error) {
      console.error('Error starting server with spawn:', error);
      resolve(false);
    }
  });
}

// Start the server
async function startServer() {
  console.log('\n=== Starting Server ===');
  
  // Check if npm is available
  const npmAvailable = await checkNpm();
  if (!npmAvailable) {
    rl.close();
    return false;
  }
  
  // Check if package.json exists
  const packageExists = checkPackageJson();
  if (!packageExists) {
    rl.close();
    return false;
  }
  
  // Check if .env file exists
  const envExists = checkEnvFile();
  
  if (!envExists) {
    const updateEnv = await askQuestion('Do you want to update the .env file now? (y/n): ');
    
    if (updateEnv.toLowerCase() === 'y') {
      console.log('Please update the .env file and then restart this script.');
      rl.close();
      return false;
    }
  }
  
  // Ask for confirmation
  const confirm = await askQuestion('Do you want to start the server? (y/n): ');
  
  if (confirm.toLowerCase() !== 'y') {
    console.log('Server start aborted by user.');
    rl.close();
    return false;
  }
  
  // Check if we need to install dependencies
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    console.log('Node modules not found. Installing dependencies...');
    
    try {
      await new Promise((resolve, reject) => {
        const install = exec('npm install', { cwd: process.cwd() }, (error) => {
          if (error) {
            console.error('npm install failed:', error);
            reject(error);
          } else {
            console.log('Dependencies installed successfully.');
            resolve();
          }
        });
        
        // Pipe the output to the console
        install.stdout?.pipe(process.stdout);
        install.stderr?.pipe(process.stderr);
      });
    } catch (error) {
      console.error('Failed to install dependencies.');
      rl.close();
      return false;
    }
  }
  
  // Try to start the server using spawn first
  let serverStarted = await startServerWithSpawn();
  
  // If spawn fails, try exec as a fallback
  if (!serverStarted) {
    console.log('Failed to start server with spawn, trying exec...');
    serverStarted = await startServerWithExec();
  }
  
  if (serverStarted) {
    console.log('Server is now running.');
    console.log('You can now run the test scripts to interact with the server.');
    return true;
  } else {
    console.log('Failed to start the server. Please try starting it manually with "npm start".');
    return false;
  }
}

// Main function
async function main() {
  try {
    console.log('=== Purplepay Server Starter ===');
    console.log('This script will help you start the Purplepay server');
    console.log('------------------------------------------------------');
    
    const serverStarted = await startServer();
    
    console.log(`\n=== Server Start Process ${serverStarted ? 'Completed Successfully' : 'Failed'} ===`);
    
    if (serverStarted) {
      console.log('\nNext steps:');
      console.log('1. Run "node server-health-check.js" to verify server health');
      console.log('2. Run "node auto-create-test-user.js" to create a test user and wallet');
      console.log('3. Use the generated JWT token for further testing');
    } else {
      console.log('\nTroubleshooting:');
      console.log('1. Check if Node.js and npm are installed correctly');
      console.log('2. Verify that the package.json file exists and is valid');
      console.log('3. Ensure that all required environment variables are set in .env');
      console.log('4. Try starting the server manually with "npm start"');
    }
    
    rl.close();
  } catch (error) {
    console.error('Error in main function:', error);
    rl.close();
  }
}

main().catch(error => {
  console.error('Unhandled error:', error);
  rl.close();
});
