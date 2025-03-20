# Purplepay Wallet Features Documentation

## Overview

This document provides detailed information about the enhanced wallet features implemented in the Purplepay backend, including:

1. Favorite Recipients
2. Scheduled Transfers
3. Transfer Notifications
4. Enhanced Security Measures

## 1. Favorite Recipients

### Models

The `favoriteRecipient` model stores user favorite recipients with the following fields:
- `userId`: ID of the user who owns the favorite recipient
- `recipientId`: ID of the recipient user
- `recipientEmail`: Email of the recipient
- `nickname`: Custom name for the recipient
- `transferCount`: Number of transfers made to this recipient

### Endpoints

#### Add Favorite Recipient
- **URL**: `POST /wallet/favorite-recipients`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "recipientEmail": "recipient@example.com",
    "nickname": "Friend"
  }
  ```
- **Response**: Returns the created favorite recipient object

#### Get Favorite Recipients
- **URL**: `GET /wallet/favorite-recipients`
- **Auth**: Required
- **Response**: Returns a list of favorite recipients for the authenticated user

#### Update Favorite Recipient
- **URL**: `PUT /wallet/favorite-recipients/:id`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "nickname": "Best Friend"
  }
  ```
- **Response**: Returns the updated favorite recipient object

#### Delete Favorite Recipient
- **URL**: `DELETE /wallet/favorite-recipients/:id`
- **Auth**: Required
- **Response**: Returns a success message

## 2. Scheduled Transfers

### Models

The `scheduledTransfer` model stores scheduled transfers with the following fields:
- `userId`: ID of the user who scheduled the transfer
- `recipientId`: ID of the recipient user (optional)
- `recipientEmail`: Email of the recipient
- `amount`: Amount to transfer
- `frequency`: One of "one-time", "daily", "weekly", "monthly"
- `nextExecutionDate`: Date of the next execution
- `status`: One of "active", "paused", "completed", "failed"

### Endpoints

#### Create Scheduled Transfer
- **URL**: `POST /wallet/scheduled-transfers`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "recipientEmail": "recipient@example.com",
    "amount": 5000,
    "frequency": "monthly",
    "startDate": "2025-04-01T00:00:00Z",
    "endDate": "2025-10-01T00:00:00Z"
  }
  ```
- **Response**: Returns the created scheduled transfer object

#### Get Scheduled Transfers
- **URL**: `GET /wallet/scheduled-transfers`
- **Auth**: Required
- **Response**: Returns a list of scheduled transfers for the authenticated user

#### Update Scheduled Transfer
- **URL**: `PUT /wallet/scheduled-transfers/:id`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "amount": 6000,
    "status": "paused"
  }
  ```
- **Response**: Returns the updated scheduled transfer object

#### Delete Scheduled Transfer
- **URL**: `DELETE /wallet/scheduled-transfers/:id`
- **Auth**: Required
- **Response**: Returns a success message

### Scheduled Job

A cron job runs every hour to check for and execute scheduled transfers. When a transfer is executed:
1. The sender's wallet balance is updated
2. The recipient's wallet balance is updated
3. Transaction records are created for both sender and recipient
4. Notifications are sent to both sender and recipient
5. The next execution date is calculated based on the frequency

## 3. Notifications

### Models

The `notification` model stores user notifications with the following fields:
- `userId`: ID of the user who owns the notification
- `type`: Type of notification (e.g., "transfer", "funding", "security")
- `title`: Title of the notification
- `message`: Detailed message
- `reference`: Reference ID related to the notification (optional)
- `isRead`: Whether the notification has been read

### Endpoints

#### Get Notifications
- **URL**: `GET /notifications`
- **Auth**: Required
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Number of notifications per page (default: 20)
  - `isRead`: Filter by read status (optional)
- **Response**: Returns a list of notifications with pagination info

#### Mark Notification as Read
- **URL**: `PUT /notifications/:id/read`
- **Auth**: Required
- **Response**: Returns the updated notification read status

#### Mark All Notifications as Read
- **URL**: `PUT /notifications/read-all`
- **Auth**: Required
- **Response**: Returns the number of notifications marked as read

#### Delete Notification
- **URL**: `DELETE /notifications/:id`
- **Auth**: Required
- **Response**: Returns a success message

## 4. Enhanced Security

### Models

The `securitySettings` model stores user security preferences with the following fields:
- `userId`: ID of the user who owns the settings
- `highValueTransferThreshold`: Amount threshold for high-value transfers
- `requireAdditionalAuthForHighValue`: Whether to require additional authentication for high-value transfers
- `enableEmailNotifications`: Whether to send email notifications
- `enableSmsNotifications`: Whether to send SMS notifications
- `trustedDevices`: List of trusted devices
- `lastUpdated`: Date when settings were last updated

### Endpoints

#### Get Security Settings
- **URL**: `GET /security/settings`
- **Auth**: Required
- **Response**: Returns the user's security settings

#### Update Security Settings
- **URL**: `PUT /security/settings`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "highValueTransferThreshold": 200000,
    "requireAdditionalAuthForHighValue": true,
    "enableEmailNotifications": true,
    "enableSmsNotifications": true
  }
  ```
- **Response**: Returns the updated security settings

#### Add Trusted Device
- **URL**: `POST /security/trusted-devices`
- **Auth**: Required
- **Request Body**:
  ```json
  {
    "deviceName": "My iPhone"
  }
  ```
- **Response**: Returns the added trusted device

#### Remove Trusted Device
- **URL**: `DELETE /security/trusted-devices/:deviceId`
- **Auth**: Required
- **Response**: Returns a success message

## Integration with Existing Wallet Transfer

The enhanced security features integrate with the existing wallet transfer functionality:

1. When initiating a transfer, the system checks if the amount exceeds the user's high-value threshold
2. If it does, and the user has enabled additional authentication for high-value transfers, an additional verification step is required
3. Notifications are sent to the user for all transfer activities
4. Transfers to favorite recipients are tracked and the transfer count is updated

## Error Handling

All endpoints include comprehensive error handling for various scenarios:
- Invalid input validation
- Insufficient funds
- Recipient not found
- Authentication failures
- Server errors

## Testing

To test these features:
1. Create favorite recipients
2. Schedule transfers with different frequencies
3. Check notifications after transfers
4. Update security settings and test high-value transfers
