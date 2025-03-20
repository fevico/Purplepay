# Security Features Documentation

## Overview

This document provides an overview of the security features implemented in the Purplepay backend, including trusted device management, high-value transfer authentication, and notification preferences.

## Security Settings

Security settings allow users to customize their security preferences, including:

- High-value transfer threshold: The amount above which additional authentication is required
- Require additional authentication for high-value transfers: Toggle to enable/disable additional authentication
- Skip authentication for trusted devices: Toggle to allow trusted devices to bypass additional authentication
- Email and SMS notifications: Toggle to enable/disable notifications via these channels

### API Endpoints

#### Get Security Settings

```
GET /security/settings
```

**Response:**
```json
{
  "message": "Security settings retrieved successfully",
  "securitySettings": {
    "highValueTransferThreshold": 100000,
    "requireAdditionalAuthForHighValue": true,
    "skipAuthForTrustedDevices": false,
    "enableEmailNotifications": true,
    "enableSmsNotifications": false,
    "trustedDevices": [...],
    "lastUpdated": "2025-03-18T14:04:14.000Z"
  }
}
```

#### Update Security Settings

```
PUT /security/settings
```

**Request Body:**
```json
{
  "highValueTransferThreshold": 50000,
  "requireAdditionalAuthForHighValue": true,
  "skipAuthForTrustedDevices": true,
  "enableEmailNotifications": true,
  "enableSmsNotifications": false
}
```

**Response:**
```json
{
  "message": "Security settings updated successfully",
  "securitySettings": {
    "highValueTransferThreshold": 50000,
    "requireAdditionalAuthForHighValue": true,
    "skipAuthForTrustedDevices": true,
    "enableEmailNotifications": true,
    "enableSmsNotifications": false,
    "trustedDevices": [...],
    "lastUpdated": "2025-03-18T14:04:14.000Z"
  }
}
```

## Trusted Device Management

Trusted devices allow users to maintain a list of devices they trust, which can bypass additional authentication for high-value transfers if enabled in security settings.

### API Endpoints

#### Get Trusted Devices

```
GET /security/trusted-devices
```

**Response:**
```json
{
  "message": "Trusted devices retrieved successfully",
  "trustedDevices": [
    {
      "deviceId": "abc123",
      "deviceName": "iPhone 15",
      "lastUsed": "2025-03-18T14:04:14.000Z"
    }
  ]
}
```

#### Add Trusted Device

```
POST /security/trusted-devices
```

**Request Body:**
```json
{
  "deviceId": "def456",
  "deviceName": "MacBook Pro"
}
```

**Response:**
```json
{
  "message": "Trusted device added successfully",
  "trustedDevice": {
    "deviceId": "def456",
    "deviceName": "MacBook Pro",
    "lastUsed": "2025-03-18T14:04:14.000Z"
  }
}
```

#### Update Trusted Device

```
PUT /security/trusted-devices/:deviceId
```

**Request Body:**
```json
{
  "deviceName": "MacBook Pro 16"
}
```

**Response:**
```json
{
  "message": "Trusted device updated successfully",
  "trustedDevice": {
    "deviceId": "def456",
    "deviceName": "MacBook Pro 16",
    "lastUsed": "2025-03-18T14:04:14.000Z"
  }
}
```

#### Remove Trusted Device

```
DELETE /security/trusted-devices/:deviceId
```

**Response:**
```json
{
  "message": "Trusted device removed successfully"
}
```

#### Verify Trusted Device

```
POST /security/verify-device
```

**Request Body:**
```json
{
  "deviceId": "abc123"
}
```

**Response:**
```json
{
  "message": "Device verification successful",
  "isTrusted": true,
  "lastUsed": "2025-03-18T14:04:14.000Z"
}
```

## High-Value Transfer Authentication

High-value transfers require additional authentication to ensure security. This can be bypassed for trusted devices if enabled in security settings.

### API Endpoints

#### Verify High-Value Transfer

```
POST /security/verify-high-value-transfer
```

**Request Body:**
```json
{
  "transferId": "123456",
  "verificationCode": "123456",
  "deviceId": "abc123"
}
```

**Response:**
```json
{
  "message": "High-value transfer verified successfully",
  "verified": true
}
```

## Notification System

The notification system is designed to keep users informed about security-related events and other important activities in their account. The system supports multiple notification channels:

1. **In-App Notifications**: Displayed within the application interface.
2. **Email Notifications**: Sent to the user's registered email address.
3. **SMS Notifications**: Sent to the user's registered phone number.

### Implementation Details

- **Email Provider**: Resend (https://resend.com)
- **SMS Provider**: Prelude (https://prelude.so)
- **Notification Preferences**: Users can customize which notifications they receive and through which channels.

### Email Notifications

Email notifications are sent using the Resend API. The system sends HTML-formatted emails with a consistent design that matches the Purplepay branding.

```typescript
// Example of sending an email notification
const result = await sendEmail(
  user.email,
  "Security Alert",
  "Your account password was recently changed."
);
```

### SMS Notifications

SMS notifications are sent using the Prelude API. The system sends concise messages for critical security events, such as high-value transfer verifications.

```typescript
// Example of sending an SMS notification
const result = await sendSMS(
  user.phoneNumber,
  "Purplepay: Verification code for your high-value transfer is 123456"
);
```

### Verification Codes

For high-value transfers and other sensitive operations, the system can send verification codes via SMS. These codes are verified using the Prelude API.

```typescript
// Example of verifying an SMS code
const verificationResult = await verifySMSCode(
  user.phoneNumber,
  verificationCode
);
```

### Configuration

The notification system requires the following environment variables:

```
RESEND_API_KEY=your_resend_api_key
PRELUDE_API_KEY=your_prelude_api_key
EMAIL_DOMAIN=your_email_domain
```

## Notification Preferences

Notification preferences allow users to customize which notifications they receive and through which channels.

### API Endpoints

#### Get Notification Preferences

```
GET /notification-preferences
```

**Response:**
```json
{
  "message": "Notification preferences retrieved successfully",
  "notificationPreferences": {
    "channels": {
      "inApp": true,
      "email": true,
      "sms": false
    },
    "preferences": {
      "transfers": true,
      "funding": true,
      "withdrawal": true,
      "security": true,
      "system": true,
      "scheduledTransfers": true,
      "highValueTransfers": true
    }
  }
}
```

#### Update Notification Preferences

```
PUT /notification-preferences
```

**Request Body:**
```json
{
  "channels": {
    "inApp": true,
    "email": true,
    "sms": true
  },
  "preferences": {
    "transfers": true,
    "security": true,
    "highValueTransfers": false
  }
}
```

**Response:**
```json
{
  "message": "Notification preferences updated successfully",
  "notificationPreferences": {
    "channels": {
      "inApp": true,
      "email": true,
      "sms": true
    },
    "preferences": {
      "transfers": true,
      "funding": true,
      "withdrawal": true,
      "security": true,
      "system": true,
      "scheduledTransfers": true,
      "highValueTransfers": false
    }
  }
}
```

#### Reset Notification Preferences

```
POST /notification-preferences/reset
```

**Response:**
```json
{
  "message": "Notification preferences reset successfully",
  "notificationPreferences": {
    "channels": {
      "inApp": true,
      "email": true,
      "sms": false
    },
    "preferences": {
      "transfers": true,
      "funding": true,
      "withdrawal": true,
      "security": true,
      "system": true,
      "scheduledTransfers": true,
      "highValueTransfers": true
    }
  }
}
```

## Automated Cleanup

The system automatically cleans up trusted devices that haven't been used in 90 days. This job runs weekly (every Sunday at 2:00 AM) and sends notifications to users when devices are removed.

## Integration with Other Features

### Scheduled Transfers

Scheduled transfers that exceed the high-value threshold will require additional authentication when they are created, but not when they are executed automatically.

### Wallet Transfers

Wallet transfers that exceed the high-value threshold will require additional authentication, which can be bypassed for trusted devices if enabled in security settings.
