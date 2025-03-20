// Test script to directly test the StrollWallet API without MongoDB dependency
const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:3000/api/bitvcard';
const PUBLIC_KEY = 'test-key';

async function testStrollWalletAPI() {
  try {
    console.log('Testing StrollWallet API directly\n');
    
    // 1. Create customer
    console.log('1. Creating customer...');
    const timestamp = Date.now();
    const customerData = {
      public_key: PUBLIC_KEY,
      firstName: 'John',
      lastName: 'Doe',
      customerEmail: `customer-${timestamp}@example.com`,
      phoneNumber: '08012345678',
      dateOfBirth: '1990-01-01',
      idImage: 'https://example.com/id-image.jpg',
      userPhoto: 'https://example.com/user-photo.jpg',
      line1: '123 Test Street',
      state: 'Accra',
      zipCode: '00233',
      city: 'Accra',
      country: 'Ghana',
      idType: 'PASSPORT',
      houseNumber: '123',
      idNumber: `PASS${timestamp}`
    };
    
    const customerResponse = await axios.post(`${API_URL}/create-user`, customerData);
    console.log('Customer created:', JSON.stringify(customerResponse.data, null, 2));
    
    if (customerResponse.data.success) {
      const customerEmail = customerResponse.data.response.customerEmail;
      
      // 2. Create card
      console.log('\n2. Creating card...');
      const cardData = {
        public_key: PUBLIC_KEY,
        name_on_card: 'John Doe',
        card_type: 'visa',
        amount: 5000,
        customerEmail,
        mode: 'sandbox'
      };
      
      const cardResponse = await axios.post(`${API_URL}/create-card`, cardData);
      console.log('Card created:', JSON.stringify(cardResponse.data, null, 2));
      
      if (cardResponse.data.success) {
        const cardId = cardResponse.data.response.card_id;
        
        // 3. Fund card
        console.log('\n3. Funding card...');
        const fundData = {
          public_key: PUBLIC_KEY,
          card_id: cardId,
          amount: 2000
        };
        
        const fundResponse = await axios.post(`${API_URL}/fund-card`, fundData);
        console.log('Card funded:', JSON.stringify(fundResponse.data, null, 2));
        
        // 4. Get card details
        console.log('\n4. Getting card details...');
        const detailsResponse = await axios.post(`${API_URL}/fetch-card-detail`, {
          public_key: PUBLIC_KEY,
          card_id: cardId
        });
        console.log('Card details:', JSON.stringify(detailsResponse.data, null, 2));
        
        // 5. Freeze card
        console.log('\n5. Freezing card...');
        const freezeResponse = await axios.post(`${API_URL}/freeze-unfreeze-card`, {
          public_key: PUBLIC_KEY,
          card_id: cardId,
          status: 'freeze'
        });
        console.log('Card frozen:', JSON.stringify(freezeResponse.data, null, 2));
        
        // 6. Unfreeze card
        console.log('\n6. Unfreezing card...');
        const unfreezeResponse = await axios.post(`${API_URL}/freeze-unfreeze-card`, {
          public_key: PUBLIC_KEY,
          card_id: cardId,
          status: 'unfreeze'
        });
        console.log('Card unfrozen:', JSON.stringify(unfreezeResponse.data, null, 2));
        
        // 7. Get card transactions
        console.log('\n7. Getting card transactions...');
        const transactionsResponse = await axios.post(`${API_URL}/card-transactions`, {
          public_key: PUBLIC_KEY,
          card_id: cardId
        });
        console.log('Card transactions:', JSON.stringify(transactionsResponse.data, null, 2));
        
        // 8. Withdraw from card
        console.log('\n8. Withdrawing from card...');
        const withdrawResponse = await axios.post(`${API_URL}/withdraw-from-card`, {
          public_key: PUBLIC_KEY,
          card_id: cardId,
          amount: 1000
        });
        console.log('Withdrawal:', JSON.stringify(withdrawResponse.data, null, 2));
      }
    }
    
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message);
  }
}

testStrollWalletAPI();
