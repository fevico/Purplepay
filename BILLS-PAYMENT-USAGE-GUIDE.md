# Bills Payment API Usage Guide

This guide provides practical examples of how to use the Bills Payment API endpoints for various bill types.

## Prerequisites

1. A valid JWT token for authentication
2. Sufficient balance in your wallet
3. Valid customer references for the services you want to pay for

## Common Bill Payment Flow

The typical flow for making a bill payment is:

1. **Initiate** a bill payment
2. **Process** the bill payment
3. **Check** the status of the bill payment
4. **View** your bill payment history

## Example API Calls

Below are examples of how to use the Bills Payment API for different bill types.

### Authentication Header

All requests require the following header:

```
Authorization: Bearer <your_jwt_token>
```

### 1. Electricity Bill Payment

#### Initiate Payment

```bash
curl -X POST http://localhost:9876/billsPayment/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{
    "billType": "electricity",
    "provider": "IKEDC",
    "customerReference": "12345678901",
    "amount": 5000,
    "currency": "NGN",
    "metadata": {
      "service_id": "ikedc_prepaid",
      "variation_code": "prepaid"
    }
  }'
```

#### Process Payment

```bash
curl -X POST http://localhost:9876/billsPayment/process/BP-1234567890 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>"
```

### 2. Cable TV Subscription

#### Initiate Payment

```bash
curl -X POST http://localhost:9876/billsPayment/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{
    "billType": "tv",
    "provider": "DSTV",
    "customerReference": "1234567890",
    "amount": 8000,
    "currency": "NGN",
    "metadata": {
      "service_id": "dstv",
      "variation_code": "dstv-compact"
    }
  }'
```

### 3. Internet Subscription

#### Initiate Payment

```bash
curl -X POST http://localhost:9876/billsPayment/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{
    "billType": "internet",
    "provider": "MTN",
    "customerReference": "08012345678",
    "amount": 10000,
    "currency": "NGN",
    "metadata": {
      "service_id": "mtn_data",
      "variation_code": "mtn-10gb"
    }
  }'
```

### 4. Water Bill Payment

#### Initiate Payment

```bash
curl -X POST http://localhost:9876/billsPayment/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_jwt_token>" \
  -d '{
    "billType": "water",
    "provider": "Lagos Water Corporation",
    "customerReference": "LWC12345678",
    "amount": 3500,
    "currency": "NGN",
    "metadata": {
      "service_id": "lwc",
      "customer_name": "John Doe"
    }
  }'
```

### 5. Check Payment Status

```bash
curl -X GET http://localhost:9876/billsPayment/status/BP-1234567890 \
  -H "Authorization: Bearer <your_jwt_token>"
```

### 6. View Payment History

```bash
# Get all bill payments
curl -X GET http://localhost:9876/billsPayment/history \
  -H "Authorization: Bearer <your_jwt_token>"

# Filter by bill type
curl -X GET "http://localhost:9876/billsPayment/history?billType=electricity" \
  -H "Authorization: Bearer <your_jwt_token>"

# Filter by date range
curl -X GET "http://localhost:9876/billsPayment/history?startDate=2025-01-01&endDate=2025-03-18" \
  -H "Authorization: Bearer <your_jwt_token>"

# Pagination
curl -X GET "http://localhost:9876/billsPayment/history?page=1&limit=20" \
  -H "Authorization: Bearer <your_jwt_token>"
```

## Required Metadata for Different Bill Types

Different bill types and providers may require specific metadata fields. Here are the common requirements:

### Electricity

```json
{
  "service_id": "provider_code",
  "variation_code": "prepaid|postpaid",
  "customer_name": "Optional customer name"
}
```

### Cable TV

```json
{
  "service_id": "provider_code",
  "variation_code": "package_code",
  "customer_name": "Optional customer name"
}
```

### Internet

```json
{
  "service_id": "provider_code",
  "variation_code": "data_plan_code",
  "phone_number": "Optional additional phone number"
}
```

### Water

```json
{
  "service_id": "provider_code",
  "customer_name": "Optional customer name",
  "customer_address": "Optional customer address"
}
```

## Error Handling

When an error occurs, the API will return an appropriate HTTP status code along with a JSON response containing an error message. Here's how to handle common errors:

### 1. Insufficient Balance

```json
{
  "success": false,
  "message": "Insufficient wallet balance"
}
```

**Solution**: Fund your wallet before attempting the payment again.

### 2. Invalid Customer Reference

```json
{
  "success": false,
  "message": "Invalid customer reference",
  "error": "Customer reference not found"
}
```

**Solution**: Verify the customer reference and try again.

### 3. Already Processed Payment

```json
{
  "success": false,
  "message": "Bill payment already completed"
}
```

**Solution**: Check the status of the payment to see if it was successful.

## Best Practices

1. **Always check wallet balance** before initiating a payment
2. **Store the reference** returned from the initiate endpoint
3. **Verify payment status** after processing to confirm success
4. **Include all required metadata** for the specific bill type
5. **Handle errors gracefully** in your application

## Support

If you encounter any issues or have questions about the Bills Payment API, please contact our support team at support@purplepay.com.
