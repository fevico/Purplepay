# Split Payment Feature Guide

## Overview

The Split Payment feature allows users to create groups with a centralized virtual account for bill payments. Members can contribute funds, manage payments, and track transactions collectively.

## Key Features

1. **Group Management**
   - Create split payment groups
   - Invite members via invite code
   - Join existing groups
   - View group details and statistics

2. **Financial Operations**
   - Contribute funds to the group
   - Make payments from the group account
   - Approve payments (for groups with approval requirements)
   - Track contributions and transactions

3. **Debt Management**
   - View who owes what to whom
   - Settle debts between group members
   - Track fair share calculations

## API Endpoints

### Group Management

#### Create a Split Payment Group
- **URL**: `/splitPayment/groups`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "name": "Group Name",
    "description": "Group Description",
    "paymentPurpose": "Purpose of the group",
    "targetAmount": 1000,
    "dueDate": "2025-04-01T00:00:00.000Z",
    "requiresApproval": true,
    "minApprovals": 2
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Split payment group created successfully",
    "data": {
      "group": {
        "_id": "group_id",
        "name": "Group Name",
        "description": "Group Description",
        "creator": "user_id",
        "members": ["user_id"],
        "inviteCode": "ABC12345",
        "paymentPurpose": "Purpose of the group",
        "targetAmount": 1000,
        "dueDate": "2025-04-01T00:00:00.000Z",
        "balance": 0,
        "requiresApproval": true,
        "minApprovals": 2,
        "createdAt": "2025-03-19T13:00:00.000Z",
        "updatedAt": "2025-03-19T13:00:00.000Z"
      }
    }
  }
  ```

#### Get User Groups
- **URL**: `/splitPayment/groups`
- **Method**: `GET`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "message": "User groups retrieved successfully",
    "data": {
      "groups": [
        {
          "_id": "group_id",
          "name": "Group Name",
          "description": "Group Description",
          "creator": {
            "_id": "user_id",
            "name": "User Name",
            "email": "user@example.com"
          },
          "members": [
            {
              "_id": "user_id",
              "name": "User Name",
              "email": "user@example.com"
            }
          ],
          "inviteCode": "ABC12345",
          "paymentPurpose": "Purpose of the group",
          "targetAmount": 1000,
          "dueDate": "2025-04-01T00:00:00.000Z",
          "balance": 0,
          "requiresApproval": true,
          "minApprovals": 2,
          "createdAt": "2025-03-19T13:00:00.000Z",
          "updatedAt": "2025-03-19T13:00:00.000Z"
        }
      ]
    }
  }
  ```

#### Get Group by ID
- **URL**: `/splitPayment/groups/:groupId`
- **Method**: `GET`
- **Authentication**: Required
- **Response**: Similar to the group object in "Get User Groups"

#### Join Group
- **URL**: `/splitPayment/groups/join`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "inviteCode": "ABC12345"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Successfully joined the group",
    "data": {
      "group": {
        "_id": "group_id",
        "name": "Group Name",
        "description": "Group Description",
        "creator": "user_id",
        "members": ["user_id", "current_user_id"],
        "inviteCode": "ABC12345",
        "paymentPurpose": "Purpose of the group",
        "targetAmount": 1000,
        "dueDate": "2025-04-01T00:00:00.000Z",
        "balance": 0,
        "requiresApproval": true,
        "minApprovals": 2,
        "createdAt": "2025-03-19T13:00:00.000Z",
        "updatedAt": "2025-03-19T13:00:00.000Z"
      }
    }
  }
  ```

### Financial Operations

#### Contribute to Group
- **URL**: `/splitPayment/groups/:groupId/contribute`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "amount": 100,
    "notes": "My contribution"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Contribution successful",
    "data": {
      "contribution": {
        "_id": "contribution_id",
        "group": "group_id",
        "contributor": "user_id",
        "amount": 100,
        "transactionId": "transaction_id",
        "status": "completed",
        "notes": "My contribution",
        "createdAt": "2025-03-19T13:00:00.000Z",
        "updatedAt": "2025-03-19T13:00:00.000Z"
      }
    }
  }
  ```

#### Make Group Payment
- **URL**: `/splitPayment/groups/:groupId/pay`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "amount": 200,
    "paymentMethod": "virtual_card",
    "recipient": "Merchant Name",
    "description": "Payment for dinner",
    "category": "food"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Payment initiated successfully",
    "data": {
      "transaction": {
        "_id": "transaction_id",
        "group": "group_id",
        "initiator": "user_id",
        "amount": 200,
        "paymentMethod": "virtual_card",
        "recipient": "Merchant Name",
        "description": "Payment for dinner",
        "category": "food",
        "status": "pending",
        "approvals": ["user_id"],
        "createdAt": "2025-03-19T13:00:00.000Z",
        "updatedAt": "2025-03-19T13:00:00.000Z"
      }
    }
  }
  ```

#### Approve Group Payment
- **URL**: `/splitPayment/groups/:groupId/transactions/:transactionId/approve`
- **Method**: `POST`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Transaction approved successfully",
    "data": {
      "transaction": {
        "_id": "transaction_id",
        "group": "group_id",
        "initiator": "user_id",
        "amount": 200,
        "paymentMethod": "virtual_card",
        "recipient": "Merchant Name",
        "description": "Payment for dinner",
        "category": "food",
        "status": "completed",
        "approvals": ["user_id", "current_user_id"],
        "createdAt": "2025-03-19T13:00:00.000Z",
        "updatedAt": "2025-03-19T13:00:00.000Z"
      }
    }
  }
  ```

#### Get Group Contributions
- **URL**: `/splitPayment/groups/:groupId/contributions`
- **Method**: `GET`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Group contributions retrieved successfully",
    "data": {
      "contributions": [
        {
          "_id": "contribution_id",
          "group": "group_id",
          "contributor": {
            "_id": "user_id",
            "name": "User Name",
            "email": "user@example.com"
          },
          "amount": 100,
          "transactionId": "transaction_id",
          "status": "completed",
          "notes": "My contribution",
          "createdAt": "2025-03-19T13:00:00.000Z",
          "updatedAt": "2025-03-19T13:00:00.000Z"
        }
      ]
    }
  }
  ```

#### Get Group Transactions
- **URL**: `/splitPayment/groups/:groupId/transactions`
- **Method**: `GET`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Group transactions retrieved successfully",
    "data": {
      "transactions": [
        {
          "_id": "transaction_id",
          "group": "group_id",
          "initiator": {
            "_id": "user_id",
            "name": "User Name",
            "email": "user@example.com"
          },
          "amount": 200,
          "paymentMethod": "virtual_card",
          "recipient": "Merchant Name",
          "description": "Payment for dinner",
          "category": "food",
          "status": "completed",
          "approvals": ["user_id", "another_user_id"],
          "createdAt": "2025-03-19T13:00:00.000Z",
          "updatedAt": "2025-03-19T13:00:00.000Z"
        }
      ]
    }
  }
  ```

### Debt Management

#### Get Group Statistics
- **URL**: `/splitPayment/groups/:groupId/statistics`
- **Method**: `GET`
- **Authentication**: Required
- **Response**:
  ```json
  {
    "success": true,
    "message": "Group statistics retrieved successfully",
    "data": {
      "totalContributed": 300,
      "totalSpent": 200,
      "currentBalance": 100,
      "contributionByMember": {
        "user_id1": 200,
        "user_id2": 100
      },
      "percentageOfTarget": 30,
      "targetAmount": 1000,
      "dueDate": "2025-04-01T00:00:00.000Z",
      "memberStats": [
        {
          "memberId": "user_id1",
          "name": "User 1",
          "email": "user1@example.com",
          "contributionAmount": 200,
          "contributionPercentage": 66.67
        },
        {
          "memberId": "user_id2",
          "name": "User 2",
          "email": "user2@example.com",
          "contributionAmount": 100,
          "contributionPercentage": 33.33
        }
      ],
      "fairShares": {
        "user_id1": 150,
        "user_id2": 150
      },
      "debts": [
        {
          "debtor": "user_id2",
          "creditor": "user_id1",
          "amount": 50
        }
      ]
    }
  }
  ```

#### Settle Debt
- **URL**: `/splitPayment/settle-debt`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "groupId": "group_id",
    "debtorId": "user_id2",
    "creditorId": "user_id1",
    "amount": 50
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Debt settled successfully",
    "data": {
      "contribution": {
        "_id": "contribution_id",
        "group": "group_id",
        "contributor": "user_id2",
        "amount": 50,
        "transactionId": "transaction_id",
        "status": "completed",
        "notes": "Debt settlement to user_id1",
        "createdAt": "2025-03-19T13:00:00.000Z",
        "updatedAt": "2025-03-19T13:00:00.000Z"
      },
      "statistics": {
        "totalContributed": 350,
        "totalSpent": 200,
        "currentBalance": 150,
        "contributionByMember": {
          "user_id1": 200,
          "user_id2": 150
        },
        "percentageOfTarget": 35,
        "targetAmount": 1000,
        "dueDate": "2025-04-01T00:00:00.000Z",
        "memberStats": [
          {
            "memberId": "user_id1",
            "name": "User 1",
            "email": "user1@example.com",
            "contributionAmount": 200,
            "contributionPercentage": 57.14
          },
          {
            "memberId": "user_id2",
            "name": "User 2",
            "email": "user2@example.com",
            "contributionAmount": 150,
            "contributionPercentage": 42.86
          }
        ],
        "fairShares": {
          "user_id1": 175,
          "user_id2": 175
        },
        "debts": []
      }
    }
  }
  ```

## Security Considerations

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Users can only access groups they are members of
3. **Input Validation**: All inputs are validated to prevent injection attacks
4. **Error Handling**: Secure error messages that don't expose sensitive information

## Testing

Use the `test-split-payment.js` script to test all split payment functionality:

```bash
node test-split-payment.js
```

The script provides an interactive menu to test all split payment features, including:
- Creating and joining groups
- Contributing to groups
- Making and approving payments
- Viewing group statistics
- Settling debts between members

## Implementation Details

The split payment feature is implemented with the following components:

1. **Models**:
   - `splitPaymentGroup.ts`: Defines the schema for split payment groups
   - `splitPaymentContribution.ts`: Tracks contributions made by users
   - `splitPaymentTransaction.ts`: Manages transactions made from the group account

2. **Services**:
   - `splitPayment.ts`: Handles business logic for all split payment operations

3. **Controllers**:
   - `splitPayment.ts`: Processes API requests and returns responses

4. **Routes**:
   - `splitPayment.ts`: Defines API endpoints and validation rules

5. **Utilities**:
   - `splitPaymentUtils.ts`: Provides helper functions for debt calculation and member statistics
   - `errorHandler.ts`: Standardizes error handling across the application

## Future Enhancements

1. **Recurring Payments**: Support for scheduled recurring payments
2. **Payment Reminders**: Automated reminders for pending contributions
3. **Expense Categories**: Enhanced categorization and reporting of expenses
4. **Mobile Notifications**: Push notifications for payment approvals and contributions
5. **Export Functionality**: Export group transaction history to CSV/PDF
