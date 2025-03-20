# PurplePay Tag and Rewards System Guide

## Overview

The PurplePay Tag and Rewards System enhances the user experience by providing:

1. **Anonymous User Tags**: A unique identifier system that allows users to send and receive money without exposing personal information.
2. **Cashback Rewards**: A comprehensive rewards system that gives users cashback for various transactions.

This document provides technical details on how to use these features in your application.

## Tag System

### Endpoints

#### 1. Get Tag Suggestions

```
GET /tag/suggestions?name={name}
```

Generates tag suggestions based on the user's name.

**Request Parameters:**
- `name` (query): The user's name to base suggestions on

**Response:**
```json
{
  "success": true,
  "data": ["testuser", "testuser123", "testuser45", "testuser_22"]
}
```

#### 2. Check Tag Availability

```
GET /tag/check?tag={tag}
```

Checks if a tag is available for use.

**Request Parameters:**
- `tag` (query): The tag to check

**Response:**
```json
{
  "success": true,
  "data": {
    "isAvailable": true
  }
}
```

#### 3. Update User's Tag

```
POST /tag/update
```

Sets or updates a user's tag.

**Request Body:**
```json
{
  "tag": "mytag123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tag updated successfully"
}
```

#### 4. Update Tag Privacy Settings

```
POST /tag/privacy
```

Updates the privacy settings for a user's tag.

**Request Body:**
```json
{
  "privacy": "public" // Options: "public", "friends", "private"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Privacy settings updated successfully"
}
```

#### 5. Find User by Tag

```
GET /tag/find/{tag}
```

Finds a user by their tag, respecting privacy settings.

**Request Parameters:**
- `tag` (path): The tag to search for

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Test User",
    "tag": "mytag123",
    "profilePicture": "https://example.com/profile.jpg"
  }
}
```

#### 6. Generate QR Code for Tag

```
GET /tag/qr/{tag}
```

Generates a QR code for a tag that can be scanned for payments.

**Request Parameters:**
- `tag` (path): The tag to generate QR code for

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

## Rewards System

### Endpoints

#### 1. Get Rewards Information

```
GET /rewards
```

Gets the user's rewards balance and history.

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": {
      "_id": "60d21b4667d0d8992e610c85",
      "userId": "60d21b4667d0d8992e610c85",
      "availableBalance": 250.5,
      "lifetimeEarned": 500.75,
      "lifetimeRedeemed": 250.25,
      "tier": "silver",
      "nextTierProgress": 45
    },
    "recentRewards": [
      {
        "_id": "60d21b4667d0d8992e610c85",
        "userId": "60d21b4667d0d8992e610c85",
        "transactionId": "60d21b4667d0d8992e610c85",
        "type": "transfer",
        "amount": 5.25,
        "status": "credited",
        "createdAt": "2023-01-15T10:30:00.000Z"
      }
    ],
    "recentRedemptions": [
      {
        "_id": "60d21b4667d0d8992e610c85",
        "userId": "60d21b4667d0d8992e610c85",
        "amount": 100,
        "method": "wallet_credit",
        "status": "completed",
        "reference": "RDM-1673791800000",
        "createdAt": "2023-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

#### 2. Redeem Rewards

```
POST /rewards/redeem
```

Redeems rewards for various benefits.

**Request Body:**
```json
{
  "amount": 100,
  "method": "wallet_credit" // Options: "wallet_credit", "bank_transfer", "airtime", "bill_payment", "card_funding"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rewards redeemed successfully",
  "data": {
    "_id": "60d21b4667d0d8992e610c85",
    "userId": "60d21b4667d0d8992e610c85",
    "amount": 100,
    "method": "wallet_credit",
    "status": "pending",
    "reference": "RDM-1673791800000",
    "createdAt": "2023-01-15T10:30:00.000Z"
  }
}
```

### Reward Rates

The system automatically calculates rewards based on transaction types:

| Transaction Type | Reward Rate |
|------------------|-------------|
| Transfers        | 0.5%        |
| Bill Payments    | 1%          |
| Card Usage       | 1%          |
| Savings          | 0.25%       |
| Referrals        | ₦500 fixed  |

### Reward Tiers

Users progress through tiers based on lifetime earnings:

| Tier     | Threshold     | Benefits                       |
|----------|---------------|--------------------------------|
| Bronze   | 0             | Base reward rates              |
| Silver   | ₦5,000        | 10% bonus on all rewards       |
| Gold     | ₦20,000       | 25% bonus on all rewards       |
| Platinum | ₦50,000       | 50% bonus on all rewards       |

## Integration with Transactions

The rewards system automatically hooks into transaction processing. When a transaction is completed, the system:

1. Determines if the transaction type qualifies for rewards
2. Calculates the appropriate reward amount
3. Credits the user's rewards balance
4. Updates the user's tier if necessary

Developers don't need to manually trigger rewards - the system handles this automatically when transaction statuses are updated to "completed".

## Testing

A comprehensive test script is provided in `test-tag-rewards.js` that validates all tag and rewards functionality.

To run the tests:

```bash
node test-tag-rewards.js
```

## Security Considerations

1. **Tag Privacy**: The tag system respects user privacy settings and only reveals information according to those settings.
2. **Rewards Validation**: All reward calculations are performed server-side to prevent manipulation.
3. **Transaction Verification**: Rewards are only granted for verified, completed transactions.
4. **Rate Limiting**: All endpoints are rate-limited to prevent abuse.

## Implementation Notes

1. The tag system uses MongoDB's unique index to ensure tag uniqueness.
2. QR codes contain a special URI format: `purplepay:tag:{tagname}` that the mobile app can recognize.
3. Rewards are calculated in a transaction-safe manner to prevent double-crediting.
4. The system maintains separate records for rewards earned and redemptions for audit purposes.
