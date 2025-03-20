# Virtual Card API Security Enhancement Plan

## Overview

Based on our testing of the Virtual Card API endpoints, we have identified several security issues that need to be addressed. This document outlines a comprehensive plan to enhance the security of the Virtual Card API.

## Current Security Issues

1. **Lack of Authentication**: The endpoints do not currently enforce JWT-based authentication.
2. **Basic Input Validation**: While basic validation exists, it could be enhanced to prevent various attacks.
3. **Server Errors**: Multiple endpoints return 500 Internal Server Error, which could expose sensitive information.
4. **Invalid Public Key**: The card-transactions endpoint returns "Invalid Public Key", indicating a configuration issue.
5. **No Rate Limiting**: There is no rate limiting to prevent abuse of the API.

## Security Enhancement Plan

### 1. Implement JWT-based Authentication

#### Tasks:
- Add JWT authentication middleware to all Virtual Card API routes
- Ensure proper token validation and expiration handling
- Implement user-specific access control for card operations
- Add refresh token mechanism for long-lived sessions

#### Implementation Details:
```javascript
// Example middleware implementation
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    
    req.user = user;
    next();
  });
};

// Apply to all card routes
router.use('/card', authenticateJWT);
```

### 2. Enhance Input Validation

#### Tasks:
- Implement comprehensive validation for all input fields
- Add data type validation (e.g., ensure amounts are numbers)
- Add range validation (e.g., ensure amounts are positive)
- Add format validation (e.g., ensure email addresses are valid)
- Implement input sanitization to prevent XSS attacks

#### Implementation Details:
```javascript
// Example validation middleware
const validateCardRequest = (req, res, next) => {
  const { card_id, amount } = req.body;
  
  if (!card_id) {
    return res.status(400).json({ message: 'card_id is required' });
  }
  
  if (amount !== undefined) {
    if (typeof amount !== 'number') {
      return res.status(400).json({ message: 'amount must be a number' });
    }
    
    if (amount <= 0) {
      return res.status(400).json({ message: 'amount must be positive' });
    }
  }
  
  next();
};

// Apply to specific routes
router.post('/card/fund-card', validateCardRequest, fundCard);
```

### 3. Implement Rate Limiting

#### Tasks:
- Add rate limiting middleware to all Virtual Card API routes
- Configure different rate limits based on endpoint sensitivity
- Implement IP-based and user-based rate limiting
- Add proper error responses for rate-limited requests

#### Implementation Details:
```javascript
// Example rate limiting middleware
const rateLimit = require('express-rate-limit');

const cardApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { message: 'Too many requests, please try again later' }
});

// Apply to all card routes
app.use('/card', cardApiLimiter);

// More restrictive limit for sensitive operations
const sensitiveOperationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  message: { message: 'Too many sensitive operations, please try again later' }
});

// Apply to specific sensitive routes
app.use('/card/fund-card', sensitiveOperationLimiter);
app.use('/card/withdraw-from-card', sensitiveOperationLimiter);
```

### 4. Fix Server Errors

#### Tasks:
- Investigate and fix the "Error fetching data plans" issue
- Implement proper error handling to avoid exposing sensitive information
- Add detailed logging for debugging purposes
- Implement graceful error recovery

#### Implementation Details:
```javascript
// Example error handling
try {
  const dataPlans = await fetchDataPlans();
  // Process data plans
} catch (error) {
  logger.error('Error fetching data plans', error);
  return res.status(500).json({ 
    message: 'An error occurred while processing your request',
    error_code: 'DATA_FETCH_ERROR'
  });
}
```

### 5. Resolve Public Key Issue

#### Tasks:
- Configure the correct public key in the environment
- Implement proper key rotation and management
- Add validation for API keys
- Implement secure key storage

#### Implementation Details:
```javascript
// Example public key configuration
const publicKey = process.env.CARD_API_PUBLIC_KEY;

if (!publicKey) {
  logger.error('Card API public key not configured');
  process.exit(1);
}

// Use the public key in API calls
const makeApiCall = (endpoint, data) => {
  return axios.post(endpoint, {
    ...data,
    publicKey
  });
};
```

### 6. Implement Comprehensive Logging

#### Tasks:
- Add detailed logging for all API requests and responses
- Implement audit logging for sensitive operations
- Configure log rotation and storage
- Ensure logs do not contain sensitive information

#### Implementation Details:
```javascript
// Example logging middleware
const logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      userId: req.user ? req.user.id : 'anonymous'
    });
  });
  
  next();
};

// Apply to all routes
app.use(logRequest);
```

### 7. Add Security Headers

#### Tasks:
- Implement Content Security Policy (CSP)
- Add X-Content-Type-Options header
- Add X-Frame-Options header
- Add X-XSS-Protection header
- Add Strict-Transport-Security header

#### Implementation Details:
```javascript
// Example security headers middleware
const helmet = require('helmet');

// Apply to all routes
app.use(helmet());

// Custom CSP
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  })
);
```

## Implementation Timeline

1. **Week 1**: Implement JWT-based authentication and fix server errors
2. **Week 2**: Enhance input validation and resolve public key issue
3. **Week 3**: Implement rate limiting and comprehensive logging
4. **Week 4**: Add security headers and conduct security testing

## Security Testing Plan

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

## Conclusion

By implementing this security enhancement plan, we will address the current security issues in the Virtual Card API and ensure that it is secure and ready for production use. The plan includes comprehensive authentication, input validation, rate limiting, error handling, and logging to protect against common security vulnerabilities.
