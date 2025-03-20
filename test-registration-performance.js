const axios = require('axios');

const API_URL = 'https://dry-lands-study.loca.lt';

// Test registration performance
async function testRegistrationPerformance() {
  try {
    console.log('Starting registration performance test...');
    
    // Test multiple registrations
    const numTests = 5;
    const results = [];
    
    for (let i = 0; i < numTests; i++) {
      const uniqueEmail = `perf${Date.now()}${i}@example.com`;
      
      console.log(`\nTest ${i + 1}: Registering user with email ${uniqueEmail}`);
      
      const startTime = Date.now();
      
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        email: uniqueEmail,
        password: 'Password123',
        name: 'Performance Test',
        phoneNumber: '+2347012345678'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`Registration completed in ${duration}ms`);
      console.log('Response status:', registerResponse.status);
      
      results.push({
        test: i + 1,
        email: uniqueEmail,
        duration,
        status: registerResponse.status
      });
    }
    
    // Calculate average
    const totalDuration = results.reduce((sum, result) => sum + result.duration, 0);
    const averageDuration = totalDuration / results.length;
    
    console.log('\n--- Performance Test Results ---');
    console.log(`Number of tests: ${numTests}`);
    console.log(`Average registration time: ${averageDuration.toFixed(2)}ms`);
    console.log('Individual test results:');
    results.forEach(result => {
      console.log(`Test ${result.test}: ${result.duration}ms (${result.status})`);
    });
    
  } catch (error) {
    console.error('Error during performance test:', error.response ? error.response.data : error.message);
  }
}

// Run the test
testRegistrationPerformance();
