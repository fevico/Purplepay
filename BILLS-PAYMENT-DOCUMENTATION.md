# Bills Payment API Documentation

## Overview

The Bills Payment API provides endpoints for initiating, processing, and tracking bill payments for various service providers. This API is integrated with the wallet system to handle payment transactions and maintains a comprehensive record of all bill payment activities.

## Authentication

All endpoints require authentication using a JWT token. The token should be included in the Authorization header as follows:

```
Authorization: Bearer <your_jwt_token>
```

For detailed information on security features, authentication, and best practices, please refer to the [Bills Payment Security Guide](./BILLS-PAYMENT-SECURITY-GUIDE.md).

## Endpoints

### 1. Initiate Bill Payment

Initiates a new bill payment transaction.

**URL:** `/billsPayment/initiate`

**Method:** `POST`

**Authentication Required:** Yes

**Request Body:**

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

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| billType | string | Yes | Type of bill (electricity, water, internet, tv, education, tax, other) |
| provider | string | Yes | Service provider name |
| customerReference | string | Yes | Customer reference number (meter number, account number, etc.) |
| amount | number | Yes | Amount to pay |
| currency | string | No | Currency code (default: NGN) |
| metadata | object | No | Additional data required for the payment |

**Success Response:**

```json
{
  "success": true,
  "message": "Bill payment initiated successfully",
  "reference": "BP-1234567890",
  "billPayment": {
    "_id": "60c72b2f9b1d8a001c8e4567",
    "userId": "60c72b2f9b1d8a001c8e4566",
    "walletId": "60c72b2f9b1d8a001c8e4565",
    "billType": "electricity",
    "provider": "IKEDC",
    "customerReference": "12345678901",
    "amount": 5000,
    "currency": "NGN",
    "status": "pending",
    "reference": "BP-1234567890",
    "transactionId": "60c72b2f9b1d8a001c8e4568",
    "metadata": {
      "service_id": "ikedc_prepaid",
      "variation_code": "prepaid"
    },
    "createdAt": "2025-03-18T15:30:00.000Z",
    "updatedAt": "2025-03-18T15:30:00.000Z"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Missing required fields
- **403 Unauthorized** - Invalid or missing authentication token
- **404 Not Found** - Wallet not found
- **500 Internal Server Error** - Server error

### 2. Process Bill Payment

Processes a previously initiated bill payment.

**URL:** `/billsPayment/process/:reference`

**Method:** `POST`

**Authentication Required:** Yes

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| reference | string | Yes | Bill payment reference |

**Success Response:**

```json
{
  "success": true,
  "message": "Bill payment processed successfully",
  "billPayment": {
    "_id": "60c72b2f9b1d8a001c8e4567",
    "userId": "60c72b2f9b1d8a001c8e4566",
    "walletId": "60c72b2f9b1d8a001c8e4565",
    "billType": "electricity",
    "provider": "IKEDC",
    "customerReference": "12345678901",
    "amount": 5000,
    "currency": "NGN",
    "status": "completed",
    "reference": "BP-1234567890",
    "transactionId": "60c72b2f9b1d8a001c8e4568",
    "metadata": {
      "service_id": "ikedc_prepaid",
      "variation_code": "prepaid",
      "providerResponse": {
        "token": "1234-5678-9012-3456",
        "units": "50.2",
        "message": "Token generated successfully"
      }
    },
    "createdAt": "2025-03-18T15:30:00.000Z",
    "updatedAt": "2025-03-18T15:35:00.000Z"
  },
  "providerResponse": {
    "token": "1234-5678-9012-3456",
    "units": "50.2",
    "message": "Token generated successfully"
  }
}
```

**Error Responses:**

- **400 Bad Request** - Bill payment already processed or insufficient balance
- **403 Unauthorized** - Unauthorized access to this bill payment
- **404 Not Found** - Bill payment not found
- **500 Internal Server Error** - Server error

### 3. Get Bill Payment Status

Retrieves the status of a bill payment.

**URL:** `/billsPayment/status/:reference`

**Method:** `GET`

**Authentication Required:** Yes

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| reference | string | Yes | Bill payment reference |

**Success Response:**

```json
{
  "success": true,
  "billPayment": {
    "_id": "60c72b2f9b1d8a001c8e4567",
    "userId": "60c72b2f9b1d8a001c8e4566",
    "walletId": "60c72b2f9b1d8a001c8e4565",
    "billType": "electricity",
    "provider": "IKEDC",
    "customerReference": "12345678901",
    "amount": 5000,
    "currency": "NGN",
    "status": "completed",
    "reference": "BP-1234567890",
    "transactionId": "60c72b2f9b1d8a001c8e4568",
    "metadata": {
      "service_id": "ikedc_prepaid",
      "variation_code": "prepaid",
      "providerResponse": {
        "token": "1234-5678-9012-3456",
        "units": "50.2",
        "message": "Token generated successfully"
      }
    },
    "createdAt": "2025-03-18T15:30:00.000Z",
    "updatedAt": "2025-03-18T15:35:00.000Z"
  }
}
```

**Error Responses:**

- **403 Unauthorized** - Unauthorized access to this bill payment
- **404 Not Found** - Bill payment not found
- **500 Internal Server Error** - Server error

### 4. Get Bill Payment History

Retrieves the bill payment history for the authenticated user.

**URL:** `/billsPayment/history`

**Method:** `GET`

**Authentication Required:** Yes

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| billType | string | No | Filter by bill type |
| provider | string | No | Filter by provider |
| status | string | No | Filter by status (pending, completed, failed) |
| startDate | string | No | Filter by start date (YYYY-MM-DD) |
| endDate | string | No | Filter by end date (YYYY-MM-DD) |
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Number of items per page (default: 10) |

**Success Response:**

```json
{
  "success": true,
  "billPayments": [
    {
      "_id": "60c72b2f9b1d8a001c8e4567",
      "userId": "60c72b2f9b1d8a001c8e4566",
      "walletId": "60c72b2f9b1d8a001c8e4565",
      "billType": "electricity",
      "provider": "IKEDC",
      "customerReference": "12345678901",
      "amount": 5000,
      "currency": "NGN",
      "status": "completed",
      "reference": "BP-1234567890",
      "transactionId": "60c72b2f9b1d8a001c8e4568",
      "metadata": {
        "service_id": "ikedc_prepaid",
        "variation_code": "prepaid",
        "providerResponse": {
          "token": "1234-5678-9012-3456",
          "units": "50.2",
          "message": "Token generated successfully"
        }
      },
      "createdAt": "2025-03-18T15:30:00.000Z",
      "updatedAt": "2025-03-18T15:35:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

**Error Responses:**

- **403 Unauthorized** - Invalid or missing authentication token
- **500 Internal Server Error** - Server error

## Supported Bill Types

The API currently supports the following bill types:

1. **electricity** - Electricity bill payments
2. **water** - Water bill payments
3. **internet** - Internet subscription payments
4. **tv** - Cable TV subscription payments
5. **education** - Education-related payments
6. **tax** - Tax payments
7. **other** - Other bill types

## Integration with Other Systems

### Wallet Integration

The Bills Payment API is integrated with the wallet system to:

1. Check if the user has sufficient balance before initiating a payment
2. Deduct the payment amount from the user's wallet upon successful processing
3. Create transaction records for all bill payment activities

### Transaction System Integration

Each bill payment creates a corresponding transaction record with:

1. Transaction type: `bill_payment`
2. Reference: Same as the bill payment reference
3. Status: Updated in sync with the bill payment status

### Notification System Integration

The API sends notifications to users for:

1. Successful bill payments
2. Failed bill payments

## Error Handling

The API uses standard HTTP status codes to indicate the success or failure of requests:

- **200 OK** - Request successful
- **400 Bad Request** - Invalid request parameters
- **403 Unauthorized** - Authentication issues
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server-side errors

All error responses include a message field that provides more details about the error.

## Security Considerations

1. All endpoints require authentication
2. Users can only access their own bill payments
3. Wallet balance is verified twice (at initiation and processing) to prevent overdrafts
4. Sensitive data in the metadata is encrypted

## Rate Limiting

To prevent abuse, the API implements rate limiting:

- 100 requests per minute per user
- 5 bill payment initiations per minute per user

## Conclusion

The Bills Payment API provides a comprehensive solution for managing bill payments within the Purplepay platform. It ensures secure and reliable bill payment processing while maintaining a detailed record of all transactions.
