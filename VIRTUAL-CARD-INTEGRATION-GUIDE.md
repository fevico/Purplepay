# PurplePay Virtual Card Integration Guide

## Overview

This guide provides comprehensive documentation on the integration between the PurplePay Virtual Card API, Tag System, and Rewards System. These three components work together to provide a seamless and rewarding experience for users.

## System Architecture

The integration architecture consists of three main components:

1. **Virtual Card API**: Handles all virtual card operations including customer creation, card creation, funding, transactions, and withdrawals.
2. **Tag System**: Provides user anonymity through unique identifiers that can be used for transactions instead of personal information.
3. **Rewards System**: Tracks and rewards user activities, particularly focusing on card-related transactions.

## Integration Points

### Virtual Card API and Tag System

The Virtual Card API integrates with the Tag System in the following ways:

1. **Customer Creation**: When a new virtual card customer is created, the system automatically generates tag suggestions based on the customer's name.
2. **Transaction Identification**: Users can use their tags instead of email addresses for certain card operations, providing an additional layer of privacy.
3. **QR Code Integration**: Card details can be shared via the tag's QR code, allowing for easy peer-to-peer transactions.

### Virtual Card API and Rewards System

The Virtual Card API integrates with the Rewards System through the following mechanisms:

1. **Transaction Rewards**: Card transactions automatically generate rewards based on the transaction type and amount.
2. **Middleware Processing**: The `virtualCardRewards.js` middleware intercepts card transactions and processes rewards accordingly.
3. **Reward Types**:
   - Card funding operations generate "card_usage" type rewards
   - Card withdrawals generate "transfer" type rewards
   - Card purchases generate "card_usage" type rewards

### Tag System and Rewards System

The Tag System and Rewards System integration includes:

1. **Referral Rewards**: Users can earn rewards by sharing their tags with new users who sign up.
2. **Tag-based Transactions**: Transactions made using tags are tracked for rewards purposes.

## Implementation Details

### Middleware

The integration relies heavily on middleware components:

```javascript
// Example middleware for handling virtual card rewards
const handleVirtualCardRewards = async (req, res, next) => {
  try {
    // Process the request
    await next();
    
    // After successful transaction, create a reward
    if (res.locals.cardTransaction) {
      const transaction = new transactionModel({
        userId: req.user.id,
        type: "card_transaction",
        amount: res.locals.cardTransaction.amount,
        // other fields...
      });
      
      await transaction.save();
      await createRewardForTransaction(transaction);
    }
  } catch (error) {
    next(error);
  }
};
```

### Transaction Flow

A typical transaction flow with full integration:

1. User initiates a card operation (e.g., funding)
2. The request is authenticated and authorized
3. The Virtual Card API processes the operation with the StrollWallet service
4. The middleware captures the transaction details
5. A transaction record is created in the database
6. The rewards service calculates and awards appropriate rewards
7. The user's rewards balance and tier are updated
8. The response is sent back to the user

## Testing

Comprehensive testing is essential to ensure all components work together correctly. The following test scripts are available:

1. `test-virtual-card-api.js`: Tests the core Virtual Card API functionality
2. `test-tag-rewards.js`: Tests the Tag and Rewards systems
3. `test-virtual-card-integration.js`: Tests the complete integration of all three systems

To run the integration test:

```bash
node test-virtual-card-integration.js
```

## Security Considerations

The integrated system implements several security measures:

1. **Authentication**: All endpoints require JWT-based authentication
2. **Authorization**: Card ownership verification for all card operations
3. **Input Validation**: Comprehensive validation for all input fields
4. **Rate Limiting**: Request rate limiting to prevent abuse
5. **Tag Privacy**: Respects user privacy settings for tag visibility
6. **Secure Rewards Processing**: Server-side rewards calculation to prevent manipulation

## Troubleshooting

Common integration issues and their solutions:

1. **Missing Rewards**: Ensure the middleware is correctly attached to the routes
2. **Tag System Errors**: Verify MongoDB connection and unique index on tags
3. **Card Operation Failures**: Check the StrollWallet API connection and credentials

## API Reference

### Virtual Card Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/card/create-customer` | POST | Create a new virtual card customer |
| `/card/create-card` | POST | Create a new virtual card |
| `/card/fund-card` | POST | Fund an existing card |
| `/card/card-details` | POST | Get card details |
| `/card/card-transactions` | POST | Get card transactions |
| `/card/freeze-unfreze-card` | POST | Freeze or unfreeze a card |
| `/card/card-history` | GET | Get card history |
| `/card/withdraw-from-card` | POST | Withdraw funds from a card |

### Tag System Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tag/suggestions` | GET | Get tag suggestions based on name |
| `/tag/check` | GET | Check tag availability |
| `/tag/update` | POST | Update user's tag |
| `/tag/privacy` | POST | Update tag privacy settings |
| `/tag/find/:tag` | GET | Find user by tag |
| `/tag/qr/:tag` | GET | Generate QR code for tag |

### Rewards System Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/rewards` | GET | Get user's rewards balance and history |
| `/rewards/redeem` | POST | Redeem rewards |

## Future Enhancements

Planned enhancements for the integrated system:

1. **Enhanced Tag Analytics**: Track tag usage and performance
2. **Advanced Reward Tiers**: Implement more sophisticated reward tiers and benefits
3. **Card-Tag Linking**: Allow users to create dedicated tags for specific cards
4. **Social Features**: Enable social sharing of tag-based transactions
5. **Merchant Rewards Program**: Extend rewards system to include merchant-specific rewards

## Conclusion

The integration of the Virtual Card API, Tag System, and Rewards System creates a powerful platform that provides users with privacy, convenience, and incentives. By following this guide, developers can understand how these systems work together and how to properly implement, test, and troubleshoot the integrated solution.
