# Virtual Card API Implementation Plan

## Overview

The Virtual Card API in the Purplepay backend integrates with the StrollWallet API to provide virtual card services. This document outlines a comprehensive plan to implement and enhance the Virtual Card API.

## Current Status

1. **Basic Integration**: The Virtual Card API is integrated with the StrollWallet API, but there are several issues:
   - Missing or invalid public key
   - Generic error handling
   - No authentication
   - Inconsistent parameter handling
   - Hardcoded values

2. **Authentication**: The authentication system is in place but needs to be properly integrated with the Virtual Card API.

## Implementation Plan

### 1. Fix Authentication

#### Tasks:
- Ensure the `/auth/register` and `/auth/login` endpoints are working
- Apply the `isAuth` middleware to all Virtual Card API routes
- Test authentication with valid and invalid tokens

#### Implementation Details:
```typescript
// src/routes/auth.ts
import { Router } from "express";
import { login, register } from "src/controller/auth";

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);

export default authRouter;
```

```typescript
// src/controller/auth.ts
import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "src/model/user";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";

export const register: RequestHandler = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      verified: true // For testing purposes
    });

    await newUser.save();

    res.status(201).json({ 
      message: "User registered successfully",
      email: newUser.email
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Error registering user" });
  }
};

export const login: RequestHandler = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    // Find user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ 
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Error logging in" });
  }
};
```

### 2. Configure StrollWallet API Keys

#### Tasks:
- Set up the StrollWallet API keys in the environment variables
- Create a configuration file for StrollWallet API settings
- Validate the API keys on startup

#### Implementation Details:
```typescript
// src/config/strollwallet.ts
export const strollwalletConfig = {
  publicKey: process.env.PUBLIC_KEY,
  privateKey: process.env.PRIVATE_KEY,
  baseUrl: 'https://strowallet.com/api/bitvcard',
  defaultValues: {
    state: "Accra",
    city: "Accra",
    country: "Ghana",
    idType: "PASSPORT",
    cardType: "visa"
  }
};

// Validate API keys
export const validateApiKeys = () => {
  if (!strollwalletConfig.publicKey) {
    console.error('StrollWallet public key not configured');
    return false;
  }
  
  if (!strollwalletConfig.privateKey) {
    console.error('StrollWallet private key not configured');
    return false;
  }
  
  return true;
};
```

```typescript
// src/index.ts
import { validateApiKeys } from './config/strollwallet';

// Validate API keys on startup
if (!validateApiKeys()) {
  console.warn('StrollWallet API keys not properly configured. Virtual Card API may not work correctly.');
}
```

### 3. Create a StrollWallet API Client

#### Tasks:
- Create a reusable client for StrollWallet API calls
- Implement proper error handling
- Add logging for API calls

#### Implementation Details:
```typescript
// src/services/strollwallet.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { strollwalletConfig } from '../config/strollwallet';
import logger from '../utils/logger';

export class StrollWalletClient {
  private baseUrl: string;
  private publicKey: string;
  
  constructor() {
    this.baseUrl = strollwalletConfig.baseUrl;
    this.publicKey = strollwalletConfig.publicKey || '';
  }
  
  async createCustomer(customerData: any) {
    const endpoint = '/create-user/';
    
    const params = {
      public_key: this.publicKey,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
      customerEmail: customerData.customerEmail,
      phoneNumber: customerData.phoneNumber,
      dateOfBirth: customerData.dateOfBirth,
      idImage: customerData.idImage,
      userPhoto: customerData.userPhoto,
      line1: customerData.line1,
      state: customerData.state || strollwalletConfig.defaultValues.state,
      zipCode: customerData.zipCode,
      city: customerData.city || strollwalletConfig.defaultValues.city,
      country: customerData.country || strollwalletConfig.defaultValues.country,
      idType: customerData.idType || strollwalletConfig.defaultValues.idType,
      houseNumber: customerData.houseNumber,
      idNumber: customerData.idNumber
    };
    
    return this.makeRequest('POST', endpoint, params);
  }
  
  async createCard(cardData: any) {
    const endpoint = '/create-card/';
    
    const params = {
      public_key: this.publicKey,
      name_on_card: cardData.name_on_card,
      card_type: strollwalletConfig.defaultValues.cardType,
      amount: cardData.amount,
      customerEmail: cardData.customerEmail
    };
    
    return this.makeRequest('POST', endpoint, params);
  }
  
  async fundCard(fundData: any) {
    const endpoint = '/fund-card/';
    
    const params = {
      public_key: this.publicKey,
      card_id: fundData.card_id,
      amount: fundData.amount
    };
    
    return this.makeRequest('POST', endpoint, params);
  }
  
  async getCardDetails(cardId: string) {
    const endpoint = '/fetch-card-detail/';
    
    const params = {
      public_key: this.publicKey,
      card_id: cardId
    };
    
    return this.makeRequest('POST', endpoint, params);
  }
  
  async getCardTransactions(cardId: string) {
    const endpoint = '/card-transactions/';
    
    const params = {
      public_key: this.publicKey,
      card_id: cardId
    };
    
    return this.makeRequest('POST', endpoint, params);
  }
  
  async freezeUnfreezeCard(cardId: string, action: 'freeze' | 'unfreeze') {
    const endpoint = '/freeze-unfreeze-card/';
    
    const params = {
      public_key: this.publicKey,
      card_id: cardId,
      action
    };
    
    return this.makeRequest('POST', endpoint, params);
  }
  
  async getCardHistory(cardId: string) {
    const endpoint = '/card-history/';
    
    const params = {
      public_key: this.publicKey,
      card_id: cardId
    };
    
    return this.makeRequest('GET', endpoint, params);
  }
  
  async withdrawFromCard(cardId: string, amount: number) {
    const endpoint = '/withdraw-from-card/';
    
    const params = {
      public_key: this.publicKey,
      card_id: cardId,
      amount
    };
    
    return this.makeRequest('POST', endpoint, params);
  }
  
  private async makeRequest(method: string, endpoint: string, params: any) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const options: AxiosRequestConfig = {
      method,
      url,
      params,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    logger.info(`Making ${method} request to ${endpoint}`, { params });
    
    try {
      const response = await axios(options);
      logger.info(`Received response from ${endpoint}`, { status: response.status });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        logger.error(`Error response from ${endpoint}`, { 
          status: axiosError.response.status,
          data: axiosError.response.data
        });
        
        throw {
          status: axiosError.response.status,
          message: 'StrollWallet API Error',
          error: axiosError.response.data
        };
      } else if (axiosError.request) {
        logger.error(`No response received from ${endpoint}`);
        
        throw {
          status: 500,
          message: 'No response received from StrollWallet API',
          error: 'Request timeout'
        };
      } else {
        logger.error(`Error setting up request to ${endpoint}`, { message: axiosError.message });
        
        throw {
          status: 500,
          message: 'Error setting up request to StrollWallet API',
          error: axiosError.message
        };
      }
    }
  }
}

export default new StrollWalletClient();
```

### 4. Update Virtual Card Controllers

#### Tasks:
- Refactor controllers to use the StrollWallet API client
- Implement proper error handling
- Add validation for all required fields

#### Implementation Details:
```typescript
// src/controller/virtualCard.ts
import { RequestHandler } from "express";
import strollwalletClient from "../services/strollwallet";
import logger from "../utils/logger";

export const createCustomer: RequestHandler = async (req, res) => {
  const { 
    firstName, lastName, customerEmail, phoneNumber, dateOfBirth,
    idImage, userPhoto, line1, state, zipCode, city, country,
    idType, houseNumber, idNumber
  } = req.body;

  // Validate required fields
  if (!firstName) {
    return res.status(400).json({ message: "firstName is required" });
  }
  
  if (!lastName) {
    return res.status(400).json({ message: "lastName is required" });
  }
  
  if (!customerEmail) {
    return res.status(400).json({ message: "customerEmail is required" });
  }
  
  if (!phoneNumber) {
    return res.status(400).json({ message: "phoneNumber is required" });
  }

  try {
    // Log the request
    logger.info('Creating customer', { 
      userId: req.user.id,
      customerEmail
    });
    
    // Call StrollWallet API
    const response = await strollwalletClient.createCustomer({
      firstName,
      lastName,
      customerEmail,
      phoneNumber,
      dateOfBirth,
      idImage,
      userPhoto,
      line1,
      state,
      zipCode,
      city,
      country,
      idType,
      houseNumber,
      idNumber
    });
    
    // Log the success
    logger.info('Customer created successfully', {
      userId: req.user.id,
      customerEmail,
      customerId: response.response?.bitvcard_customer_id
    });
    
    res.json(response);
  } catch (error: any) {
    // Log the error
    logger.error('Error creating customer', {
      userId: req.user.id,
      customerEmail,
      error
    });
    
    // Return error response
    return res.status(error.status || 500).json({
      message: error.message || 'Error creating customer',
      error: error.error
    });
  }
};

// Implement other controller methods similarly
```

### 5. Add Rate Limiting

#### Tasks:
- Implement rate limiting for all Virtual Card API routes
- Configure different rate limits for different endpoints
- Add proper error responses for rate-limited requests

#### Implementation Details:
```typescript
// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests, please try again later' }
});

export const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  message: { message: 'Too many sensitive operations, please try again later' }
});
```

```typescript
// src/routes/virtualCard.ts
import { Router } from "express";
import { cardDetails, cardHistory, cardTransactions, createCard, createCustomer, freezeAndUnfreezeCard, fundCard, withdrawFromCard } from "src/controller/virtualCard";
import { isAuth } from "src/middleware/auth";
import { apiLimiter, sensitiveOperationLimiter } from "src/middleware/rateLimit";

const virtualCardRouter = Router()

// Apply authentication middleware to all routes
virtualCardRouter.use(isAuth);

// Apply rate limiting
virtualCardRouter.use(apiLimiter);

virtualCardRouter.post('/create-customer', createCustomer)
virtualCardRouter.post('/create-card', createCard) 
virtualCardRouter.post('/fund-card', sensitiveOperationLimiter, fundCard)
virtualCardRouter.post('/card-details', cardDetails)
virtualCardRouter.post('/card-transactions', cardTransactions)
virtualCardRouter.post('/freeze-unfreze-card', freezeAndUnfreezeCard)
virtualCardRouter.get('/card-history', cardHistory)
virtualCardRouter.post('/withdraw-from-card', sensitiveOperationLimiter, withdrawFromCard)

export default virtualCardRouter;
```

### 6. Add Comprehensive Logging

#### Tasks:
- Implement a logging system
- Log all API requests and responses
- Log errors with detailed information

#### Implementation Details:
```typescript
// src/utils/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'virtual-card-api' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

### 7. Add Security Headers

#### Tasks:
- Implement Content Security Policy (CSP)
- Add X-Content-Type-Options header
- Add X-Frame-Options header
- Add X-XSS-Protection header
- Add Strict-Transport-Security header

#### Implementation Details:
```typescript
// src/middleware/security.ts
import helmet from 'helmet';
import { Express } from 'express';

export const configureSecurityHeaders = (app: Express) => {
  // Apply helmet middleware
  app.use(helmet());

  // Custom CSP
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://strowallet.com"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    })
  );
};
```

```typescript
// src/index.ts
import { configureSecurityHeaders } from './middleware/security';

// Configure security headers
configureSecurityHeaders(app);
```

## Testing Plan

1. **Authentication Testing**:
   - Test all endpoints with and without valid JWT tokens
   - Test token expiration and refresh
   - Test user-specific access control

2. **Input Validation Testing**:
   - Test all endpoints with valid and invalid inputs
   - Test edge cases (e.g., very large amounts, special characters)
   - Test for common attack vectors (e.g., SQL injection, XSS)

3. **Rate Limiting Testing**:
   - Test rate limits for all endpoints
   - Test user-specific and IP-based rate limiting
   - Test rate limit error responses

4. **Error Handling Testing**:
   - Test all error scenarios
   - Ensure proper error responses
   - Verify that sensitive information is not exposed

## Implementation Timeline

1. **Week 1**: Fix authentication and configure StrollWallet API keys
2. **Week 2**: Create StrollWallet API client and update controllers
3. **Week 3**: Add rate limiting and comprehensive logging
4. **Week 4**: Add security headers and conduct testing

## Conclusion

By implementing this plan, we will create a secure, reliable, and well-structured Virtual Card API that integrates with the StrollWallet API. The API will be properly authenticated, validated, and rate-limited, with comprehensive logging and error handling.
