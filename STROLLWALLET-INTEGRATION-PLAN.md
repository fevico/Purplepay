# StrollWallet Integration Plan for Virtual Card API

## Overview

The Virtual Card API in the Purplepay backend is integrated with the StrollWallet API to provide virtual card services. However, our testing has identified several issues with this integration that need to be addressed.

## Current Issues

1. **Missing Public Key**: The `PUBLIC_KEY` environment variable is not properly set, causing the "Invalid Public Key" error.
2. **Generic Error Handling**: All errors return "Error fetching data plans" regardless of the actual error.
3. **No Authentication**: The routes do not have authentication middleware.
4. **Inconsistent Parameter Handling**: Some endpoints use `req.body` while others use `req.query`.
5. **Hardcoded Values**: Some values are hardcoded (e.g., "Accra", "Ghana", "PASSPORT").

## Implementation Plan

### 1. Configure Environment Variables

Update the Dockerfile and docker-compose.yml to include the StrollWallet API key:

```dockerfile
# Dockerfile
FROM node:16

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production
ENV PORT=9876
ENV MONGODB_URI=mongodb://mongo:27017/purple-pay
ENV PUBLIC_KEY=your_strollwallet_public_key
ENV PRIVATE_KEY=your_strollwallet_private_key

EXPOSE 9876

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3'
services:
  app:
    build: .
    ports:
      - "9876:9876"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/purple-pay
      - PUBLIC_KEY=your_strollwallet_public_key
      - PRIVATE_KEY=your_strollwallet_private_key
    depends_on:
      - mongo
  mongo:
    image: mongo:latest
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db

volumes:
  mongo-data:
```

### 2. Improve Error Handling

Update the controller functions to provide more specific error messages:

```typescript
export const createCustomer: RequestHandler = async (req, res) => {
    const { houseNumber, firstName, lastName, idNumber, customerEmail, phoneNumber, dateOfBirth, idImage, userPhoto, line1, state, zipCode, city, country, idType } = req.body;

    if (!firstName) {
        return res.status(400).json({ message: "firstName is required" });
    }
    
    // Add validation for other required fields
    if (!customerEmail) {
        return res.status(400).json({ message: "customerEmail is required" });
    }
    
    // ... validate other fields
 
    const options = {
        method: 'POST',
        url: `https://strowallet.com/api/bitvcard/create-user/`,
        params: {
            public_key: process.env.PUBLIC_KEY,
            firstName,
            houseNumber,
            lastName,
            idNumber,
            customerEmail,
            phoneNumber,
            dateOfBirth,
            idImage,
            userPhoto,
            line1,
            state: state || "Accra",
            zipCode,
            city: city || "Accra",
            country: country || "Ghana",
            idType: idType || "PASSPORT",
        },
        headers: {
            'Content-Type': 'application/json'
        }
    };

    try {
        const response = await axios(options);
        res.json(response.data);
    } catch (error) {
        console.error('Error creating customer:', error);
        
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            return res.status(error.response.status).json({
                message: "StrollWallet API Error",
                error: error.response.data
            });
        } else if (error.request) {
            // The request was made but no response was received
            return res.status(500).json({
                message: "No response received from StrollWallet API",
                error: "Request timeout"
            });
        } else {
            // Something happened in setting up the request that triggered an Error
            return res.status(500).json({
                message: "Error setting up request to StrollWallet API",
                error: error.message
            });
        }
    }
}
```

### 3. Add Authentication Middleware

Create an authentication middleware and apply it to all virtual card routes:

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
        const user = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};
```

```typescript
// src/routes/virtualCard.ts
import { Router } from "express";
import { cardDetails, cardHistory, cardTransactions, createCard, createCustomer, freezeAndUnfreezeCard, fundCard, withdrawFromCard } from "src/controller/virtualCard";
import { authenticateJWT } from "src/middleware/auth";

const virtualCardRouter = Router()

// Apply authentication middleware to all routes
virtualCardRouter.use(authenticateJWT);

virtualCardRouter.post('/create-customer', createCustomer)
virtualCardRouter.post('/create-card', createCard) 
virtualCardRouter.post('/fund-card', fundCard)
virtualCardRouter.post('/card-details', cardDetails)
virtualCardRouter.post('/card-transactions', cardTransactions)
virtualCardRouter.post('/freeze-unfreze-card', freezeAndUnfreezeCard)
virtualCardRouter.get('/card-history', cardHistory)
virtualCardRouter.post('/withdraw-from-card', withdrawFromCard)

export default virtualCardRouter;
```

### 4. Standardize Parameter Handling

Ensure all endpoints consistently use either `req.body` or `req.query`:

```typescript
export const createCard: RequestHandler = async (req, res) => {
    // Change from req.query to req.body for consistency
    const { name_on_card, amount, customerEmail } = req.body;
    const cardType = 'visa'

    if (!name_on_card) {
        return res.status(400).json({ message: "name_on_card is required" });
    }

    // ... rest of the function
}
```

### 5. Remove Hardcoded Values

Replace hardcoded values with configurable defaults:

```typescript
// src/config/defaults.ts
export const defaultCardConfig = {
    state: "Accra",
    city: "Accra",
    country: "Ghana",
    idType: "PASSPORT",
    cardType: "visa"
};
```

```typescript
// In controller
import { defaultCardConfig } from "src/config/defaults";

export const createCustomer: RequestHandler = async (req, res) => {
    // ... existing code
    
    const options = {
        method: 'POST',
        url: `https://strollwallet.com/api/bitvcard/create-user/`,
        params: {
            public_key: process.env.PUBLIC_KEY,
            firstName,
            houseNumber,
            lastName,
            idNumber,
            customerEmail,
            phoneNumber,
            dateOfBirth,
            idImage,
            userPhoto,
            line1,
            state: state || defaultCardConfig.state,
            zipCode,
            city: city || defaultCardConfig.city,
            country: country || defaultCardConfig.country,
            idType: idType || defaultCardConfig.idType,
        },
        // ... rest of the options
    };
    
    // ... rest of the function
}
```

### 6. Add Logging

Implement comprehensive logging for all API calls:

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

```typescript
// In controller
import logger from 'src/utils/logger';

export const createCustomer: RequestHandler = async (req, res) => {
    // ... existing code
    
    logger.info('Creating customer', { customerEmail });
    
    try {
        const response = await axios(options);
        logger.info('Customer created successfully', { customerEmail, response: response.data });
        res.json(response.data);
    } catch (error) {
        logger.error('Error creating customer', { customerEmail, error });
        // ... error handling
    }
}
```

### 7. Add Rate Limiting

Implement rate limiting for the API:

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
import { authenticateJWT } from "src/middleware/auth";
import { apiLimiter, sensitiveOperationLimiter } from "src/middleware/rateLimit";

const virtualCardRouter = Router()

// Apply authentication middleware to all routes
virtualCardRouter.use(authenticateJWT);

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

## Testing Plan

1. **Environment Variables**: Test that the StrollWallet API key is correctly set and used.
2. **Error Handling**: Test various error scenarios to ensure proper error messages.
3. **Authentication**: Test that all routes require authentication.
4. **Parameter Handling**: Test that all endpoints correctly handle parameters.
5. **Rate Limiting**: Test that rate limiting is working as expected.

## Implementation Timeline

1. **Day 1**: Configure environment variables and improve error handling
2. **Day 2**: Add authentication middleware and standardize parameter handling
3. **Day 3**: Remove hardcoded values and add logging
4. **Day 4**: Add rate limiting and conduct testing

## Conclusion

By implementing these changes, we will address the current issues with the StrollWallet integration and ensure that the Virtual Card API is secure, reliable, and ready for production use.
