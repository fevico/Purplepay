# PurplePay Onboarding Flow Documentation

This document outlines the complete onboarding flow for the PurplePay application, including all API endpoints, request/response formats, and implementation details.

## Onboarding Flow Overview

The PurplePay onboarding process consists of the following steps:

1. **User Registration**: User creates an account with email, password, name, and phone number
2. **Email Verification**: User verifies their email address via a verification link
3. **Transaction PIN Setup**: User creates a 4-digit PIN for securing transactions
4. **BVN Verification** (Optional): User verifies their Bank Verification Number (BVN) via SMS OTP
5. **Username Tag Setup**: User creates a unique username prefixed with '@' (similar to Cash App's $cashtag)
6. **Interest Tags Selection**: User selects up to 5 interest tags to personalize their experience

## Onboarding Status Tracking

The system tracks the user's progress through the onboarding flow using an `onboardingStatus` object:

```json
{
  "pinSetup": boolean,
  "bvnVerified": boolean,
  "usernameTagSet": boolean,
  "tagsSelected": boolean,
  "onboardingComplete": boolean
}
```

The `onboardingComplete` flag is set to `true` when the user has completed the required steps (PIN setup, username tag setup, and tag selection). BVN verification is optional but recommended.

## API Endpoints

### 1. User Registration and Authentication

#### Register a new user
- **Endpoint**: `POST /auth/register`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123",
    "name": "User Name",
    "phoneNumber": "+2348012345678"
  }
  ```
- **Response**:
  ```json
  {
    "message": "User registered successfully",
    "id": "user-uuid",
    "token": "verification-token"
  }
  ```

#### Verify Email
- **Endpoint**: `GET /auth/verify?userId={userId}&token={token}`
- **Response**:
  ```json
  {
    "message": "Email verified successfully",
    "onboardingStatus": { ... }
  }
  ```

#### Login
- **Endpoint**: `POST /auth/login`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "Password123"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Login successful",
    "id": "user-uuid",
    "token": "auth-token",
    "onboardingStatus": { ... }
  }
  ```

#### Check Onboarding Status
- **Endpoint**: `GET /auth/onboarding-status`
- **Headers**: `user-id: user-uuid`
- **Response**:
  ```json
  {
    "onboardingStatus": {
      "pinSetup": true,
      "bvnVerified": true,
      "usernameTagSet": true,
      "tagsSelected": true,
      "onboardingComplete": true
    }
  }
  ```

### 2. Security Setup

#### Set Transaction PIN
- **Endpoint**: `POST /security/set-transaction-pin`
- **Headers**: `user-id: user-uuid`
- **Request Body**:
  ```json
  {
    "pin": "1234"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Transaction PIN set successfully",
    "onboardingStatus": { ... }
  }
  ```

#### Verify Transaction PIN
- **Endpoint**: `POST /security/verify-transaction-pin`
- **Headers**: `user-id: user-uuid`
- **Request Body**:
  ```json
  {
    "pin": "1234"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Transaction PIN verified successfully",
    "verified": true
  }
  ```

### 3. BVN Verification

#### Verify BVN
- **Endpoint**: `POST /bvn/verify`
- **Headers**: `user-id: user-uuid`
- **Request Body**:
  ```json
  {
    "bvn": "12345678901",
    "firstName": "User",
    "lastName": "Name",
    "dateOfBirth": "1990-01-01",
    "phoneNumber": "+2348012345678"
  }
  ```
- **Response**:
  ```json
  {
    "message": "BVN verification initiated. Please check your phone for the verification code.",
    "verificationId": "verification-uuid",
    "verificationCode": "123456" // Only included in test environment
  }
  ```

#### Confirm BVN OTP
- **Endpoint**: `POST /bvn/confirm-otp`
- **Headers**: `user-id: user-uuid`
- **Request Body**:
  ```json
  {
    "verificationId": "verification-uuid",
    "otp": "123456"
  }
  ```
- **Response**:
  ```json
  {
    "message": "BVN verified successfully",
    "onboardingStatus": { ... }
  }
  ```

#### Check BVN Status
- **Endpoint**: `GET /bvn/status`
- **Headers**: `user-id: user-uuid`
- **Response**:
  ```json
  {
    "verified": true,
    "bvn": "123****901" // Masked BVN
  }
  ```

### 4. Username Tag Setup

#### Check Username Availability
- **Endpoint**: `GET /tag/check-availability/{username}`
- **Headers**: `user-id: user-uuid`
- **Response**:
  ```json
  {
    "username": "username",
    "displayUsername": "@username",
    "available": true,
    "message": "Username is available"
  }
  ```

#### Set Username
- **Endpoint**: `POST /tag/set-username`
- **Headers**: `user-id: user-uuid`
- **Request Body**:
  ```json
  {
    "username": "@username"
  }
  ```
- **Response**:
  ```json
  {
    "message": "Username set successfully",
    "username": "username",
    "displayUsername": "@username",
    "onboardingStatus": { ... }
  }
  ```

### 5. Interest Tags Selection

#### Get Available Tags
- **Endpoint**: `GET /tag/available-tags`
- **Headers**: `user-id: user-uuid`
- **Response**:
  ```json
  {
    "tags": [
      {
        "id": "tag-uuid",
        "name": "Finance",
        "category": "Business"
      },
      // More tags...
    ]
  }
  ```

#### Select Tags
- **Endpoint**: `POST /tag/select-tags`
- **Headers**: `user-id: user-uuid`
- **Request Body**:
  ```json
  {
    "tagIds": ["tag-uuid-1", "tag-uuid-2", "tag-uuid-3"]
  }
  ```
- **Response**:
  ```json
  {
    "message": "Tags selected successfully",
    "selectedTags": ["tag-uuid-1", "tag-uuid-2", "tag-uuid-3"],
    "onboardingStatus": { ... }
  }
  ```

## Implementation Notes

1. **Email Verification**:
   - Uses Resend API for sending verification emails
   - Supports both GET (for link clicks) and POST (for API calls) methods

2. **BVN Verification**:
   - Uses Prelude API for sending SMS verification codes
   - Includes a mock implementation for testing

3. **Username Tags**:
   - Usernames are stored without the '@' prefix in the database
   - The '@' prefix is added for display purposes
   - Username validation ensures only lowercase letters, numbers, and underscores are used

4. **Interest Tags**:
   - Users can select a maximum of 5 tags
   - Tag selection is validated against available tags

## Testing

The onboarding flow can be tested using the following scripts:

1. `test-onboarding-simple.js`: Basic test of the complete flow
2. `test-onboarding-comprehensive.js`: Comprehensive test including edge cases

To run the tests:

```bash
node test-onboarding-simple.js
node test-onboarding-comprehensive.js
```

## Security Considerations

1. All endpoints requiring authentication use a `user-id` header
2. Transaction PINs are stored securely and never returned in responses
3. BVN data is masked when returned to clients
4. Email verification tokens are single-use only
