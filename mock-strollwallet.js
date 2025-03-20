const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Create Express app
const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Data storage
const dataDir = path.join(__dirname, 'mock-data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const customersFile = path.join(dataDir, 'customers.json');
const cardsFile = path.join(dataDir, 'cards.json');

// Initialize data files if they don't exist
if (!fs.existsSync(customersFile)) {
  fs.writeFileSync(customersFile, JSON.stringify([], null, 2));
}

if (!fs.existsSync(cardsFile)) {
  fs.writeFileSync(cardsFile, JSON.stringify([], null, 2));
}

// Helper functions
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

const readData = (file) => {
  try {
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${file}:`, error);
    return [];
  }
};

const writeData = (file, data) => {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to ${file}:`, error);
    return false;
  }
};

// Middleware to validate API key
const validateApiKey = (req, res, next) => {
  const publicKey = req.body.public_key || req.query.public_key;
  
  // For testing purposes, accept any public key or the specific test key
  if (!publicKey) {
    return res.status(403).json({
      success: false,
      message: 'Public key is required'
    });
  }
  
  // Log the received public key for debugging
  console.log('Received public key:', publicKey);
  
  next();
};

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Mock StrollWallet API',
    endpoints: [
      '/api/bitvcard/create-user/',
      '/api/bitvcard/create-card/',
      '/api/bitvcard/fund-card/',
      '/api/bitvcard/fetch-card-detail/',
      '/api/bitvcard/card-transactions/',
      '/api/bitvcard/freeze-unfreeze-card/',
      '/api/bitvcard/card-history/',
      '/api/bitvcard/card-status/',
      '/api/bitvcard/withdraw-from-card/'
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Mock StrollWallet API is running'
  });
});

// Create customer
app.post('/api/bitvcard/create-user', validateApiKey, (req, res) => {
  const customerData = req.body;
  const customers = readData(customersFile);
  
  // Check if customer with email already exists
  const existingCustomer = customers.find(c => c.customerEmail === customerData.customerEmail);
  if (existingCustomer) {
    return res.json({
      success: false,
      message: 'Customer with this email already exists'
    });
  }
  
  // Check if customer with ID number already exists
  const existingIdNumber = customers.find(c => c.idNumber === customerData.idNumber);
  if (existingIdNumber) {
    return res.json({
      success: false,
      message: 'a card user with this Id Number already exists'
    });
  }
  
  // Create new customer
  const newCustomer = {
    ...customerData,
    customerId: generateId(),
    createdAt: new Date().toISOString()
  };
  
  customers.push(newCustomer);
  writeData(customersFile, customers);
  
  res.json({
    success: true,
    message: 'successfully registered user',
    response: newCustomer
  });
});

// Create card
app.post('/api/bitvcard/create-card', validateApiKey, (req, res) => {
  const { name_on_card, amount, customerEmail, card_type, mode } = req.body;
  
  // Validate required fields
  if (!name_on_card || !amount || !customerEmail) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Log the request for debugging
  console.log('Create card request:', req.body);
  
  // Find customer
  const customers = readData(customersFile);
  const customer = customers.find(c => c.customerEmail === customerEmail);
  
  if (!customer) {
    return res.status(404).json({
      success: false,
      message: 'Customer not found'
    });
  }
  
  // Create card
  const cards = readData(cardsFile);
  const newCard = {
    card_id: generateId(),
    name_on_card,
    card_type: card_type || 'visa',
    amount: parseFloat(amount),
    customerEmail,
    customerId: customer.customerId,
    status: 'active',
    createdAt: new Date().toISOString(),
    last_four: Math.floor(1000 + Math.random() * 9000).toString(),
    expiry_month: Math.floor(1 + Math.random() * 12).toString().padStart(2, '0'),
    expiry_year: (new Date().getFullYear() + 3).toString().slice(-2),
    cvv: Math.floor(100 + Math.random() * 900).toString()
  };
  
  cards.push(newCard);
  writeData(cardsFile, cards);
  
  res.json({
    success: true,
    message: 'Card created successfully',
    response: {
      card_id: newCard.card_id,
      last_four: newCard.last_four,
      expiry_month: newCard.expiry_month,
      expiry_year: newCard.expiry_year,
      cvv: newCard.cvv,
      name_on_card: newCard.name_on_card,
      amount: newCard.amount,
      status: newCard.status
    }
  });
});

// Fund card
app.post('/api/bitvcard/fund-card', validateApiKey, (req, res) => {
  const { card_id, amount } = req.body;
  
  // Validate required fields
  if (!card_id || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Find card
  const cards = readData(cardsFile);
  const cardIndex = cards.findIndex(c => c.card_id === card_id);
  
  if (cardIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }
  
  // Update card amount
  cards[cardIndex].amount += parseFloat(amount);
  writeData(cardsFile, cards);
  
  res.json({
    success: true,
    message: 'Card funded successfully',
    response: {
      card_id,
      amount: cards[cardIndex].amount,
      status: cards[cardIndex].status
    }
  });
});

// Get card details
app.post('/api/bitvcard/fetch-card-detail', validateApiKey, (req, res) => {
  const { card_id } = req.body;
  
  // Validate required fields
  if (!card_id) {
    return res.status(400).json({
      success: false,
      message: 'Card ID is required'
    });
  }
  
  // Find card
  const cards = readData(cardsFile);
  const card = cards.find(c => c.card_id === card_id);
  
  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Card details retrieved successfully',
    response: {
      card_id: card.card_id,
      last_four: card.last_four,
      expiry_month: card.expiry_month,
      expiry_year: card.expiry_year,
      cvv: card.cvv,
      name_on_card: card.name_on_card,
      amount: card.amount,
      status: card.status
    }
  });
});

// Freeze/Unfreeze card
app.post('/api/bitvcard/freeze-unfreeze-card', validateApiKey, (req, res) => {
  const { card_id, status } = req.body;
  
  // Validate required fields
  if (!card_id || !status) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Check if status is valid
  if (status !== 'freeze' && status !== 'unfreeze') {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be "freeze" or "unfreeze"'
    });
  }
  
  // Find card
  const cards = readData(cardsFile);
  const cardIndex = cards.findIndex(c => c.card_id === card_id);
  
  if (cardIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }
  
  // Update card status
  cards[cardIndex].status = status === 'freeze' ? 'frozen' : 'active';
  writeData(cardsFile, cards);
  
  res.json({
    success: true,
    message: `Card ${status === 'freeze' ? 'frozen' : 'unfrozen'} successfully`,
    response: {
      card_id,
      status: cards[cardIndex].status
    }
  });
});

// Card transactions
app.post('/api/bitvcard/card-transactions', validateApiKey, (req, res) => {
  const { card_id } = req.body;
  
  // Validate required fields
  if (!card_id) {
    return res.status(400).json({
      success: false,
      message: 'Card ID is required'
    });
  }
  
  // Find card
  const cards = readData(cardsFile);
  const card = cards.find(c => c.card_id === card_id);
  
  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }
  
  // Generate mock transactions
  const transactions = [
    {
      id: generateId(),
      card_id,
      amount: 1000,
      type: 'funding',
      status: 'successful',
      date: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    },
    {
      id: generateId(),
      card_id,
      amount: 500,
      type: 'purchase',
      merchant: 'Amazon',
      status: 'successful',
      date: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
    }
  ];
  
  res.json({
    success: true,
    message: 'Transactions retrieved successfully',
    response: transactions
  });
});

// Withdraw from card
app.post('/api/bitvcard/withdraw-from-card', validateApiKey, (req, res) => {
  const { card_id, amount } = req.body;
  
  // Validate required fields
  if (!card_id || !amount) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields'
    });
  }
  
  // Find card
  const cards = readData(cardsFile);
  const cardIndex = cards.findIndex(c => c.card_id === card_id);
  
  if (cardIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }
  
  const card = cards[cardIndex];
  
  // Check if card is active
  if (card.status !== 'active') {
    return res.status(400).json({
      success: false,
      message: 'Card is not active'
    });
  }
  
  // Check if card has sufficient balance
  if (card.amount < parseFloat(amount)) {
    return res.status(400).json({
      success: false,
      message: 'Insufficient funds'
    });
  }
  
  // Update card balance
  cards[cardIndex].amount -= parseFloat(amount);
  writeData(cardsFile, cards);
  
  res.json({
    success: true,
    message: 'Withdrawal successful',
    response: {
      card_id,
      amount: cards[cardIndex].amount,
      withdrawn: parseFloat(amount)
    }
  });
});

// Card history
app.post('/api/bitvcard/card-history', validateApiKey, (req, res) => {
  const { card_id } = req.body;
  
  // Validate required fields
  if (!card_id) {
    return res.status(400).json({
      success: false,
      message: 'Card ID is required'
    });
  }
  
  // Find card
  const cards = readData(cardsFile);
  const card = cards.find(c => c.card_id === card_id);
  
  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }
  
  // Generate mock history
  const history = [
    {
      id: generateId(),
      card_id,
      action: 'created',
      status: 'active',
      date: new Date(Date.now() - 86400000 * 3).toISOString() // 3 days ago
    },
    {
      id: generateId(),
      card_id,
      action: 'funded',
      amount: 5000,
      status: 'active',
      date: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
    },
    {
      id: generateId(),
      card_id,
      action: 'purchase',
      amount: 1500,
      merchant: 'Netflix',
      status: 'active',
      date: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
  ];
  
  res.json({
    success: true,
    message: 'Card history retrieved successfully',
    response: history
  });
});

// GET endpoint for card history
app.get('/api/bitvcard/card-history/', validateApiKey, (req, res) => {
  const { card_id } = req.query;
  
  // Validate required fields
  if (!card_id) {
    return res.status(400).json({
      success: false,
      message: 'Card ID is required'
    });
  }
  
  // Find card
  const cards = readData(cardsFile);
  const card = cards.find(c => c.card_id === card_id);
  
  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }
  
  // Generate mock history
  const history = [
    {
      id: generateId(),
      card_id,
      action: 'created',
      status: 'active',
      date: new Date(Date.now() - 86400000 * 3).toISOString() // 3 days ago
    },
    {
      id: generateId(),
      card_id,
      action: 'funded',
      amount: 5000,
      status: 'active',
      date: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
    },
    {
      id: generateId(),
      card_id,
      action: 'purchase',
      amount: 1500,
      merchant: 'Netflix',
      status: 'active',
      date: new Date(Date.now() - 86400000).toISOString() // 1 day ago
    }
  ];
  
  res.json({
    success: true,
    message: 'Card history retrieved successfully',
    response: history
  });
});

// Card status
app.post('/api/bitvcard/card-status/', validateApiKey, (req, res) => {
  const { card_id } = req.body;
  
  // Validate required fields
  if (!card_id) {
    return res.status(400).json({
      success: false,
      message: 'Card ID is required'
    });
  }
  
  // Find card
  const cards = readData(cardsFile);
  const card = cards.find(c => c.card_id === card_id);
  
  if (!card) {
    return res.status(404).json({
      success: false,
      message: 'Card not found'
    });
  }
  
  res.json({
    success: true,
    message: 'Card status retrieved successfully',
    response: {
      card_id: card.card_id,
      status: card.status,
      last_updated: new Date().toISOString()
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock StrollWallet API running on http://localhost:${PORT}`);
});
