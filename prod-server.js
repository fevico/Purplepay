// Production server launcher that builds TypeScript and runs the real implementation
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting PurplePay production server...');

// Check if .env file exists
if (!fs.existsSync(path.join(__dirname, '.env'))) {
  console.log('⚠️ No .env file found, creating from example...');
  
  // If .env doesn't exist, copy from .env.example
  if (fs.existsSync(path.join(__dirname, '.env.example'))) {
    fs.copyFileSync(
      path.join(__dirname, '.env.example'),
      path.join(__dirname, '.env')
    );
    console.log('✅ Created .env file from .env.example');
  } else {
    console.log('❌ No .env.example file found. Please create a .env file manually.');
    process.exit(1);
  }
}

// Check if MongoDB URI is set
const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
if (!envContent.includes('MONGODB_URI=')) {
  console.log('⚠️ MONGODB_URI not found in .env file');
  
  // For deployment on platforms like Heroku, we'll use MongoDB Atlas free tier
  // In a real production environment, you should set this environment variable manually
  console.log('ℹ️ Using MongoDB Atlas for database');
  
  // Add a note to remind users they need to set this
  console.log('⚠️ Make sure to set MONGODB_URI in your environment variables or .env file');
}

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Build TypeScript code
  console.log('🔨 Building TypeScript code...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Start the server
  console.log('🌐 Starting server...');
  require('./dist');
} catch (error) {
  console.error('❌ Error during setup:', error.message);
  process.exit(1);
}
