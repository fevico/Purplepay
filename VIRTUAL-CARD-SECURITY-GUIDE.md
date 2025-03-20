# Virtual Card API Security Guide

## Overview

This document outlines the security features and best practices implemented in the Virtual Card API. The API provides functionality for creating and managing virtual cards, including customer creation, card creation, fund management, and transaction history.

## Security Features

### Authentication and Authorization

- **JWT-based Authentication**: All Virtual Card API endpoints are protected by JWT-based authentication.
- **Token Validation**: Each request is validated to ensure the token is valid, not expired, and belongs to the user making the request.
- **Authorization Checks**: Access to virtual card operations is restricted to authenticated users who own the cards or have appropriate permissions.

### Input Validation and Sanitization

- **Required Field Validation**: All endpoints validate that required fields are present and properly formatted.
- **Type Checking**: Input values are checked for correct data types (e.g., numeric values for amounts).
- **Range Validation**: Numeric values are validated to ensure they are within acceptable ranges (e.g., positive amounts for funding).
- **SQL Injection Protection**: All user inputs are sanitized to prevent SQL injection attacks.
- **XSS Protection**: Text inputs are sanitized to prevent cross-site scripting attacks.

### Rate Limiting

- **Request Rate Limiting**: API endpoints are protected by rate limiting to prevent abuse and brute force attacks.
- **IP-based Limiting**: Rate limits are applied based on client IP addresses.
- **User-based Limiting**: Additional rate limits are applied based on user IDs for authenticated requests.

### Error Handling

- **Secure Error Messages**: Error responses provide enough information for debugging without exposing sensitive details.
- **Logging**: All security-related events are logged for audit purposes.
- **Graceful Failure**: The API fails gracefully when encountering errors, without exposing system details.

## Endpoint Security

### Customer Creation (`/card/create-customer`)

- **Authentication Required**: JWT token must be present and valid.
- **Input Validation**: All required customer fields are validated.
- **Duplicate Prevention**: Checks for existing customers to prevent duplicates.

### Card Creation (`/card/create-card`)

- **Authentication Required**: JWT token must be present and valid.
- **Customer Verification**: Verifies that the customer exists and belongs to the authenticated user.
- **Amount Validation**: Ensures the initial funding amount is positive and within allowed limits.

### Card Details (`/card/card-details`)

- **Authentication Required**: JWT token must be present and valid.
- **Card Ownership**: Verifies that the card belongs to the authenticated user.
- **Sensitive Data Handling**: Card numbers are masked in responses.

### Fund Card (`/card/fund-card`)

- **Authentication Required**: JWT token must be present and valid.
- **Card Ownership**: Verifies that the card belongs to the authenticated user.
- **Amount Validation**: Ensures the funding amount is positive and within allowed limits.
- **Balance Checks**: Verifies that the user has sufficient wallet balance for the funding.

### Freeze/Unfreeze Card (`/card/freeze-unfreze-card`)

- **Authentication Required**: JWT token must be present and valid.
- **Card Ownership**: Verifies that the card belongs to the authenticated user.
- **Action Validation**: Validates that the action is either "freeze" or "unfreeze".

### Card Transactions (`/card/card-transactions`)

- **Authentication Required**: JWT token must be present and valid.
- **Card Ownership**: Verifies that the card belongs to the authenticated user.
- **Data Privacy**: Only returns transactions for the authenticated user's card.

### Card History (`/card/card-history`)

- **Authentication Required**: JWT token must be present and valid.
- **Data Privacy**: Only returns card history for the authenticated user.

### Withdraw From Card (`/card/withdraw-from-card`)

- **Authentication Required**: JWT token must be present and valid.
- **Card Ownership**: Verifies that the card belongs to the authenticated user.
- **Amount Validation**: Ensures the withdrawal amount is positive and within allowed limits.
- **Balance Checks**: Verifies that the card has sufficient balance for the withdrawal.

## Security Testing Results

The Virtual Card API security features have been tested using a comprehensive test script (`test-virtual-card-security.js`). The tests verify:

1. **Authentication Requirements**: Ensures all endpoints require valid authentication.
2. **Input Validation**: Tests various input scenarios to ensure proper validation.
3. **Error Handling**: Verifies that the API handles errors gracefully and securely.
4. **Access Control**: Ensures users can only access their own data.

### Test Results

- **Authentication**: All endpoints correctly require authentication. Unauthenticated requests are rejected with 401 or 403 status codes.
- **Input Validation**: Partially tested. The API appears to validate input data, but full validation testing requires a working database connection.
- **Error Handling**: Errors are handled gracefully without exposing sensitive system information.
- **Database Connection**: Tests encountered database connection issues that need to be resolved.

### Next Steps

1. **Resolve Database Connection Issues**: Fix the MongoDB connection timeout issues to complete full security testing.
2. **Complete Input Validation Testing**: Once database connection is working, complete testing of all input validation scenarios.
3. **Test Card-Specific Operations**: Complete testing of card-specific operations like fund card, freeze/unfreeze, and transactions.
4. **Implement Monitoring**: Set up monitoring for security-related events and unusual activity patterns.

## Security Recommendations

1. **Regular Token Rotation**: Implement token expiration and refresh mechanisms.
2. **Monitoring**: Set up monitoring for unusual activity patterns.
3. **Security Audits**: Conduct regular security audits of the API.
4. **Dependency Updates**: Keep all dependencies updated to patch security vulnerabilities.
5. **HTTPS**: Ensure all API traffic is encrypted using HTTPS.
6. **Security Headers**: Implement security headers in API responses.

## Integration with StrollWallet API

The Virtual Card API integrates with the StrollWallet API for card operations. Security considerations for this integration include:

1. **Secure API Keys**: StrollWallet API keys are stored securely and not exposed in client-side code.
2. **Request Signing**: Requests to the StrollWallet API are signed for authenticity.
3. **Response Validation**: Responses from the StrollWallet API are validated before processing.
4. **Error Handling**: Errors from the StrollWallet API are handled gracefully without exposing sensitive details.

## Conclusion

The Virtual Card API implements comprehensive security measures to protect user data and prevent unauthorized access. Regular security testing and updates ensure the API remains secure against evolving threats.

## References

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
