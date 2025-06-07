# API Documentation

This document provides detailed information about all available API endpoints in the Secure Login Backend.

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limits

- **General API**: 100 requests per 15 minutes
- **Authentication endpoints**: 5 requests per 15 minutes
- **2FA endpoints**: 10 requests per 5 minutes

## Response Format

All responses follow this structure:

```json
{
  "message": "Success/Error message",
  "error": "Error type (only on errors)",
  "data": "Response data (varies by endpoint)"
}
```

## Error Codes

| Status Code | Description           |
| ----------- | --------------------- |
| 200         | Success               |
| 201         | Created               |
| 400         | Bad Request           |
| 401         | Unauthorized          |
| 403         | Forbidden             |
| 404         | Not Found             |
| 409         | Conflict              |
| 429         | Too Many Requests     |
| 500         | Internal Server Error |

---

# Authentication Endpoints

## Register User

Register a new user account.

**Endpoint:** `POST /auth/register`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Validation Rules:**

- Email: Must be valid email format
- Password: Minimum 8 characters, must contain uppercase, lowercase, number, and special character

**Success Response (201):**

```json
{
  "message": "User registered successfully",
  "userId": "uuid-string",
  "next_step": "You can now login with your credentials"
}
```

**Error Responses:**

_User Already Exists (409):_

```json
{
  "error": "User already exists",
  "message": "An account with this email address already exists. Please use a different email or try logging in."
}
```

_Validation Error (400):_

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    }
  ]
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

---

## Login User

Authenticate user and receive JWT token.

**Endpoint:** `POST /auth/login`

**Rate Limit:** 5 requests per 15 minutes

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response - No 2FA (200):**

```json
{
  "message": "Login successful",
  "requires2FA": false,
  "token": "jwt-token-string",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "is2FAEnabled": false
  }
}
```

**Success Response - 2FA Required (200):**

```json
{
  "message": "2FA verification required",
  "requires2FA": true,
  "userId": "user-uuid"
}
```

**Error Responses:**

_User Not Found (404):_

```json
{
  "error": "User not found",
  "message": "No account found with this email address. Please check your email or register a new account."
}
```

_Invalid Password (401):_

```json
{
  "error": "Invalid password",
  "message": "The password you entered is incorrect. Please try again."
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

---

# Two-Factor Authentication Endpoints

## Setup 2FA

Generate QR code and secret for 2FA setup.

**Endpoint:** `GET /2fa/setup`

**Authentication:** Required (JWT token)

**Rate Limit:** 10 requests per 5 minutes

**Success Response (200):**

```json
{
  "message": "2FA setup initiated",
  "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "secret": "JBSWY3DPEHPK3PXP",
  "next_step": "Scan the QR code with your authenticator app and verify with a code to complete setup"
}
```

**Error Responses:**

_2FA Already Enabled (400):_

```json
{
  "error": "2FA already enabled",
  "message": "Two-factor authentication is already enabled for your account."
}
```

**cURL Example:**

```bash
curl -X GET http://localhost:3000/api/2fa/setup \
  -H "Authorization: Bearer your-jwt-token"
```

---

## Verify and Enable 2FA

Verify 2FA code and enable 2FA for the account.

**Endpoint:** `POST /2fa/verify`

**Authentication:** Required (JWT token)

**Rate Limit:** 10 requests per 5 minutes

**Request Body:**

```json
{
  "code": "123456"
}
```

**Validation Rules:**

- Code: Must be exactly 6 numeric digits

**Success Response (200):**

```json
{
  "message": "2FA activated successfully",
  "next_step": "Two-factor authentication is now required for all future logins"
}
```

**Error Responses:**

_Invalid 2FA Code (401):_

```json
{
  "error": "Invalid 2FA code",
  "message": "The 2FA code you entered is incorrect. Please check your authenticator app and try again."
}
```

_2FA Not Set Up (400):_

```json
{
  "error": "2FA not set up",
  "message": "Please set up 2FA first before verifying."
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/2fa/verify \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "123456"
  }'
```

---

## Complete 2FA Login

Complete login process with 2FA verification.

**Endpoint:** `POST /2fa/login`

**Rate Limit:** 10 requests per 5 minutes

**Request Body:**

```json
{
  "userId": "user-uuid-from-login-response",
  "code": "123456"
}
```

**Success Response (200):**

```json
{
  "message": "Login successful with 2FA",
  "token": "jwt-token-string",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "is2FAEnabled": true
  }
}
```

**Error Responses:**

_Missing User ID (400):_

```json
{
  "error": "Missing user ID",
  "message": "User ID is required for 2FA login."
}
```

_Invalid 2FA Code (401):_

```json
{
  "error": "Invalid 2FA code",
  "message": "The 2FA code you entered is incorrect. Please check your authenticator app and try again."
}
```

**cURL Example:**

```bash
curl -X POST http://localhost:3000/api/2fa/login \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-uuid-from-login",
    "code": "123456"
  }'
```

---

# Protected Endpoints

## Get Current User

Get information about the currently authenticated user.

**Endpoint:** `GET /protected/me`

**Authentication:** Required (JWT token)

**Rate Limit:** 100 requests per 15 minutes

**Success Response (200):**

```json
{
  "message": "Dostęp przyznany",
  "user": {
    "userId": "user-uuid",
    "email": "user@example.com",
    "iat": 1647890123,
    "exp": 1647893723
  }
}
```

**Error Response:**

_No Access (403):_

```json
{
  "message": "No Access"
}
```

**cURL Example:**

```bash
curl -X GET http://localhost:3000/api/protected/me \
  -H "Authorization: Bearer your-jwt-token"
```

---

# Complete Authentication Flows

## Standard Login Flow

1. **Register** (if new user):

   ```
   POST /auth/register
   ```

2. **Login**:

   ```
   POST /auth/login
   ```

   - If `requires2FA: false` → Use returned token
   - If `requires2FA: true` → Continue to step 3

3. **2FA Verification** (if required):
   ```
   POST /2fa/login
   ```

## 2FA Setup Flow

1. **Login** (get JWT token)
2. **Setup 2FA**:
   ```
   GET /2fa/setup
   ```
3. **Scan QR code** with authenticator app
4. **Verify and Enable**:
   ```
   POST /2fa/verify
   ```
