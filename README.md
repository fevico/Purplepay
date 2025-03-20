# PurplePay Backend

A comprehensive backend for PurplePay - a Nigerian Cash App alternative with features tailored for the Nigerian market.

## Features

### Core Features
- **Authentication System**: User registration, login, JWT-based authentication
- **Wallet Management**: Balance tracking, transaction history
- **Money Transfer**: Bank transfers, peer-to-peer transfers using tags
- **Virtual Card System**: Card creation, management, and transaction tracking
- **Bills Payment**: Utility bills, airtime, data, TV subscriptions
- **Tag System**: Similar to Cash App's $Cashtag for easy transfers
- **Split Payment**: Group payment creation and management
- **Notification System**: Transaction notifications with custom preferences
- **Rewards System**: Transaction-based rewards and redemption
- **Security Features**: JWT authentication, transaction PIN verification
- **Comprehensive Onboarding Flow**: Step-by-step user onboarding with email verification, PIN setup, BVN verification, username tag creation, and interest selection

### Nigerian-Specific Features
- **USSD Backup**: Perform transactions without internet access
- **BVN Verification**: Enhanced security with Bank Verification Number integration
- **Digital Savings Groups**: Traditional "Ajo"/"Esusu" savings groups

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/purplepay-backend.git
cd purplepay-backend
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
PORT=9882
MONGODB_URI=mongodb://localhost:27017/purplepay
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=24h
```

4. Start the development server
```bash
npm run dev
```

## API Documentation

### Authentication Endpoints

#### Register User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phoneNumber": "08012345678",
  "country": "Nigeria"
}
```
- **Response**: JWT token and user details

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```
- **Response**: JWT token and user details

### Security Endpoints

#### Set Transaction PIN
- **URL**: `/api/security/set-transaction-pin`
- **Method**: `POST`
- **Authentication**: Required
- **Body**:
```json
{
  "pin": "1234"
}
```
- **Response**: Success message

### BVN Verification Endpoints

#### Verify BVN
- **URL**: `/api/bvn/verify`
- **Method**: `POST`
- **Authentication**: Required
- **Body**:
```json
{
  "bvn": "22212345678"
}
```
- **Response**: Verification status and details

#### Check BVN Status
- **URL**: `/api/bvn/status`
- **Method**: `GET`
- **Authentication**: Required
- **Response**: BVN verification status

### Savings Group Endpoints

#### Create Savings Group
- **URL**: `/api/savings-groups`
- **Method**: `POST`
- **Authentication**: Required
- **Body**:
```json
{
  "name": "Monthly Savings",
  "description": "Group for monthly savings",
  "contributionAmount": 5000,
  "frequency": "monthly",
  "startDate": "2023-04-01T00:00:00.000Z",
  "totalCycles": 12,
  "isPublic": true
}
```
- **Response**: Created savings group details

#### Get User's Savings Groups
- **URL**: `/api/savings-groups`
- **Method**: `GET`
- **Authentication**: Required
- **Response**: List of user's savings groups

#### Get Savings Group by ID
- **URL**: `/api/savings-groups/:id`
- **Method**: `GET`
- **Authentication**: Required
- **Response**: Savings group details

### USSD Endpoints

#### Process USSD Request
- **URL**: `/api/ussd`
- **Method**: `POST`
- **Body**:
```json
{
  "sessionId": "session-123456",
  "serviceCode": "*384*123#",
  "phoneNumber": "08012345678",
  "text": ""
}
```
- **Response**: USSD response text

## Testing

### API Testing
Use Postman or any API testing tool to test the endpoints. A Postman collection is included in the `postman` directory.

### Automated Testing
Run the automated tests with:
```bash
npm test
```

### Onboarding Flow Testing
Test the complete user onboarding flow with:
```bash
node test-onboarding-simple.js       # Basic onboarding flow test
node test-onboarding-comprehensive.js # Comprehensive test with edge cases
```

The onboarding flow includes:
- User registration and email verification
- Transaction PIN setup
- BVN verification with SMS OTP
- Username tag creation
- Interest tag selection

See `ONBOARDING_FLOW.md` for detailed documentation of the onboarding process and API endpoints.

## API Documentation

### Authentication Endpoints

#### Register User
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phoneNumber": "08012345678",
  "country": "Nigeria"
}
```
- **Response**: JWT token and user details

#### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```
- **Response**: JWT token and user details

### Security Endpoints

#### Set Transaction PIN
- **URL**: `/api/security/set-transaction-pin`
- **Method**: `POST`
- **Authentication**: Required
- **Body**:
```json
{
  "pin": "1234"
}
```
- **Response**: Success message

### BVN Verification Endpoints

#### Verify BVN
- **URL**: `/api/bvn/verify`
- **Method**: `POST`
- **Authentication**: Required
- **Body**:
```json
{
  "bvn": "22212345678"
}
```
- **Response**: Verification status and details

#### Check BVN Status
- **URL**: `/api/bvn/status`
- **Method**: `GET`
- **Authentication**: Required
- **Response**: BVN verification status

### Savings Group Endpoints

#### Create Savings Group
- **URL**: `/api/savings-groups`
- **Method**: `POST`
- **Authentication**: Required
- **Body**:
```json
{
  "name": "Monthly Savings",
  "description": "Group for monthly savings",
  "contributionAmount": 5000,
  "frequency": "monthly",
  "startDate": "2023-04-01T00:00:00.000Z",
  "totalCycles": 12,
  "isPublic": true
}
```
- **Response**: Created savings group details

#### Get User's Savings Groups
- **URL**: `/api/savings-groups`
- **Method**: `GET`
- **Authentication**: Required
- **Response**: List of user's savings groups

#### Get Savings Group by ID
- **URL**: `/api/savings-groups/:id`
- **Method**: `GET`
- **Authentication**: Required
- **Response**: Savings group details

### USSD Endpoints

#### Process USSD Request
- **URL**: `/api/ussd`
- **Method**: `POST`
- **Body**:
```json
{
  "sessionId": "session-123456",
  "serviceCode": "*384*123#",
  "phoneNumber": "08012345678",
  "text": ""
}
```
- **Response**: USSD response text

## USSD Menu Structure

PurplePay USSD service is accessible via the code `*384*123#` and provides the following menu structure:

1. **Main Menu**
   - 1: Check Balance
   - 2: Transfer Money
   - 3: Buy Airtime
   - 4: Pay Bills
   - 5: Savings Groups

2. **Transfer Money Flow**
   - Enter recipient's phone number or tag
   - Enter amount to transfer
   - Enter 4-digit PIN to confirm

3. **Buy Airtime Flow**
   - Enter phone number
   - Enter amount
   - Enter 4-digit PIN to confirm

4. **Savings Groups Flow**
   - 1: View my groups
   - 2: Make contribution
   - 3: Check next payout

## BVN Verification Process

1. User submits their BVN through the app
2. System validates the BVN format
3. System verifies the BVN against the central database
4. User receives verification status
5. If verified, BVN status is stored in the user's profile

## Digital Savings Groups ("Ajo"/"Esusu")

The digital savings groups feature allows users to:

1. Create a savings group with specified:
   - Contribution amount
   - Frequency (daily, weekly, monthly)
   - Total cycles
   - Start date

2. Invite members to join the group

3. Track contributions and payouts

4. Receive notifications for upcoming contributions and payouts

## Security Measures

- Password encryption using bcrypt
- JWT-based authentication
- Transaction PIN for financial operations
- BVN verification for enhanced security
- Activity logging for suspicious activity detection

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any inquiries, please contact support@purplepay.ng
