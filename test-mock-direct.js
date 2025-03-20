const axios = require('axios');

async function testMockServer() {
  try {
    console.log('Testing mock server directly...');
    
    // Test customer creation
    const customerResponse = await axios.post('http://localhost:3000/api/bitvcard/create-user', {
      public_key: 'test-key',
      customerEmail: `customer-${Date.now()}@example.com`,
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '08012345678',
      city: 'Accra',
      state: 'Accra',
      country: 'Ghana',
      line1: '123 Test Street',
      zipCode: '00233',
      houseNumber: '123',
      idNumber: `PASS${Date.now()}`,
      idType: 'PASSPORT',
      idImage: 'https://example.com/id-image.jpg',
      userPhoto: 'https://example.com/user-photo.jpg',
      dateOfBirth: '1990-01-01'
    });
    
    console.log('Customer creation response:', JSON.stringify(customerResponse.data, null, 2));
    
    if (customerResponse.data.success) {
      const customerEmail = customerResponse.data.response.customerEmail;
      
      // Test card creation
      const cardResponse = await axios.post('http://localhost:3000/api/bitvcard/create-card', {
        public_key: 'test-key',
        name_on_card: 'John Doe',
        card_type: 'visa',
        amount: 5000,
        customerEmail,
        mode: 'sandbox'
      });
      
      console.log('Card creation response:', JSON.stringify(cardResponse.data, null, 2));
    }
  } catch (error) {
    console.error('Error testing mock server:', error.response ? error.response.data : error.message);
  }
}

testMockServer();
