# Bills Payment API Security Guide

This document outlines the security features implemented in the Bills Payment API and provides guidance on security best practices for developers working with the API.

## Security Features

### Authentication and Authorization

The Bills Payment API uses JWT (JSON Web Token) based authentication for all endpoints. This ensures that only authenticated users can access the API.

1. **JWT Authentication**
   - All API endpoints require a valid JWT token in the Authorization header
   - Tokens are issued during login and have a limited validity period
   - Example: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

2. **Token Expiration and Refresh**
   - JWT tokens expire after a configurable period (default: 1 hour)
   - Refresh tokens are provided for obtaining new access tokens
   - Refresh endpoint: `POST /auth/refresh`

3. **User-Specific Access Control**
   - Users can only access their own bill payments
   - Wallet validation ensures users can only use their own wallets

### Input Validation and Sanitization

All user inputs are thoroughly validated and sanitized to prevent common attacks:

1. **Field Validation**
   - Required fields: billType, provider, customerReference, amount, currency
   - Bill type must be one of: electricity, water, internet, tv, education, tax, other
   - Currency must be one of: NGN, USD, EUR, GBP
   - Amount must be a positive number less than 1,000,000

2. **SQL Injection Prevention**
   - All inputs are checked for SQL injection patterns
   - Inputs containing SQL keywords or syntax are rejected
   - Example pattern: `/(union\s+select|insert\s+into|update\s+.*\s+set|delete\s+from|drop\s+table|exec\s+.*sp_|declare\s+.*@|select\s+.*from)/i`

3. **XSS Attack Prevention**
   - Inputs are sanitized to prevent Cross-Site Scripting attacks
   - HTML tags and JavaScript code are escaped
   - Example pattern: `/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|javascript:|on\w+\s*=|<img[^>]+src\s*=\s*["']?[^"'>]+["']?[^>]*>/i`

### Rate Limiting

To prevent abuse and brute force attacks, rate limiting is implemented:

1. **API Rate Limits**
   - Authentication endpoints: 10 requests per minute
   - Bill payment endpoints: 30 requests per minute
   - Rate limits are applied per IP address

2. **Rate Limit Headers**
   - Response headers include rate limit information
   - `X-RateLimit-Limit`: Maximum requests allowed in the time window
   - `X-RateLimit-Remaining`: Number of requests remaining in the current window
   - `X-RateLimit-Reset`: Time when the rate limit window resets

### Secure Headers

The API uses Helmet middleware to set secure HTTP headers:

1. **Content Security Policy (CSP)**
   - Restricts sources of executable scripts
   - Prevents loading of malicious resources

2. **X-Content-Type-Options**
   - Set to `nosniff` to prevent MIME type sniffing

3. **X-XSS-Protection**
   - Enables browser's XSS filtering

4. **X-Frame-Options**
   - Set to `DENY` to prevent clickjacking attacks

## Security Best Practices for Developers

When working with the Bills Payment API, follow these security best practices:

1. **Token Management**
   - Store tokens securely, preferably in HTTP-only cookies
   - Implement token refresh before expiration
   - Never store tokens in localStorage or sessionStorage

2. **Error Handling**
   - Do not expose sensitive information in error messages
   - Implement proper logging for security events
   - Handle errors gracefully without revealing system details

3. **Input Validation**
   - Validate all inputs on the client side before sending to the API
   - Implement additional validation for specific bill types
   - Sanitize user inputs to prevent XSS attacks

4. **Sensitive Data**
   - Never log sensitive information like tokens or payment details
   - Mask sensitive data in logs and UI
   - Use HTTPS for all API communications

5. **Testing**
   - Regularly run security tests against the API
   - Test for common vulnerabilities (OWASP Top 10)
   - Perform penetration testing periodically

## Security Testing

A comprehensive security testing script is provided to verify the security features of the API:

```bash
# Run all security tests
node test-bills-payment-security.js

# Skip specific test categories
node test-bills-payment-security.js --skip-auth-tests
node test-bills-payment-security.js --skip-input-tests
node test-bills-payment-security.js --skip-rate-tests
node test-bills-payment-security.js --skip-token-tests
```

The security tests verify:
- Authentication requirements for all endpoints
- Input validation and sanitization
- Rate limiting functionality
- Token expiration and refresh mechanisms

## Reporting Security Issues

If you discover a security vulnerability in the Bills Payment API, please report it by sending an email to security@purplepay.com. Do not disclose security vulnerabilities publicly until they have been addressed by our team.

When reporting, please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if available)

Our security team will acknowledge receipt of your report within 24 hours and provide regular updates on our progress.
