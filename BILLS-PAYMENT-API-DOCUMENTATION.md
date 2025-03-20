# Bills Payment API Documentation

## Overview

The Bills Payment API allows users to pay various types of bills including electricity, water, internet, TV, education, tax, and other services. The API provides endpoints for initiating payments, processing transactions, checking payment statuses, and retrieving payment history.

## Base URL

All API endpoints are relative to: `http://localhost:9876`

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Initiate Bill Payment

Initiates a new bill payment transaction.

- **URL**: `/billsPayment/initiate`
- **Method**: `POST`
- **Auth Required**: Yes
- **Request Body**:

```json
{
  "billType": "electricity",
  "provider": "IKEDC",
  "customerReference": "12345678901",
  "amount": 5000,
  "currency": "NGN",
  "metadata": {
    "service_id": "ikedc_prepaid",
    "variation_code": "prepaid"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| billType | string | Type of bill (electricity, water, internet, tv, education, tax, other) |
| provider | string | Service provider name |
| customerReference | string | Customer reference number with the provider |
| amount | number | Amount to pay |
| currency | string | Currency code (e.g., NGN) |
| metadata | object | Additional information required by the provider |

- **Success Response**:

```json
{
  "message": "Bill payment initiated successfully",
  "reference": "BP-1234567890",
  "status": "pending",
  "amount": 5000,
  "currency": "NGN"
}
```

### 2. Process Bill Payment

Processes a pending bill payment.

- **URL**: `/billsPayment/process/:reference`
- **Method**: `POST`
- **Auth Required**: Yes
- **URL Parameters**:

| Parameter | Description |
|-----------|-------------|
| reference | Bill payment reference number |

- **Success Response**:

```json
{
  "message": "Bill payment processed successfully",
  "reference": "BP-1234567890",
  "status": "completed",
  "transactionId": "TRX-1234567890",
  "providerReference": "PROV-1234567890"
}
```

### 3. Get Bill Payment Status

Retrieves the status of a specific bill payment.

- **URL**: `/billsPayment/status/:reference`
- **Method**: `GET`
- **Auth Required**: Yes
- **URL Parameters**:

| Parameter | Description |
|-----------|-------------|
| reference | Bill payment reference number |

- **Success Response**:

```json
{
  "reference": "BP-1234567890",
  "billType": "electricity",
  "provider": "IKEDC",
  "customerReference": "12345678901",
  "amount": 5000,
  "currency": "NGN",
  "status": "completed",
  "createdAt": "2025-03-18T20:30:00.000Z",
  "updatedAt": "2025-03-18T20:35:00.000Z",
  "transactionId": "TRX-1234567890",
  "providerReference": "PROV-1234567890"
}
```

### 4. Get Bill Payment History

Retrieves the history of bill payments with filtering options.

- **URL**: `/billsPayment/history`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:

| Parameter | Description |
|-----------|-------------|
| billType | Filter by bill type |
| provider | Filter by provider |
| status | Filter by status (pending, completed, failed) |
| startDate | Filter by start date (YYYY-MM-DD) |
| endDate | Filter by end date (YYYY-MM-DD) |
| page | Page number (default: 1) |
| limit | Number of records per page (default: 10) |

- **Success Response**:

```json
{
  "totalCount": 25,
  "totalPages": 3,
  "currentPage": 1,
  "limit": 10,
  "data": [
    {
      "reference": "BP-1234567890",
      "billType": "electricity",
      "provider": "IKEDC",
      "customerReference": "12345678901",
      "amount": 5000,
      "currency": "NGN",
      "status": "completed",
      "createdAt": "2025-03-18T20:30:00.000Z",
      "updatedAt": "2025-03-18T20:35:00.000Z"
    },
    // More bill payment records...
  ]
}
```

## Error Responses

The API returns appropriate HTTP status codes and error messages:

- **400 Bad Request**: Invalid input parameters
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

Example error response:

```json
{
  "message": "Insufficient wallet balance",
  "status": "error"
}
```

## Bill Types

The API supports the following bill types:

- `electricity`: Electricity bills
- `water`: Water bills
- `internet`: Internet subscription
- `tv`: Cable TV subscription
- `education`: School fees and education payments
- `tax`: Tax payments
- `other`: Other types of bills

## Testing

Use the provided test scripts to test the API:

1. `login-test.js`: Get a JWT token
2. `setup-wallet-test.js`: Set up a wallet with sufficient balance
3. `test-bills-payment.js`: Test the Bills Payment API endpoints

## Integration with Other Systems

The Bills Payment API integrates with:

1. **Wallet System**: For checking balance and deducting funds
2. **Transaction System**: For creating transaction records
3. **Notification System**: For sending payment notifications

## Conclusion

The Bills Payment API provides a complete solution for managing various types of bill payments within the Purplepay platform, with robust error handling and integration with existing wallet and transaction systems.
