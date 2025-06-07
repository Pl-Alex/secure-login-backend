# Secure Login Backend

A Node.js Express server with PostgreSQL database using Prisma ORM for secure user authentication with optional Two-Factor Authentication (2FA) support.

## Features

- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Two-Factor Authentication**: Optional 2FA using TOTP (Time-based One-Time Password)
- **Rate Limiting**: Protection against brute force attacks with configurable limits
- **Input Validation**: Comprehensive validation using express-validator
- **Database Integration**: PostgreSQL with Prisma ORM for type-safe database operations
- **CORS Support**: Configurable cross-origin resource sharing
- **Security Headers**: Built-in security middleware

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database (v12 or higher)
- npm or yarn

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Pl-Alex/secure-login-backend
cd secure-login-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory based on `.env.example`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
JWT_SECRET="your-super-secure-jwt-secret-key"
FRONTEND_URL=http://localhost:3001
PORT=3000
```

Replace the placeholder values with your actual configuration:

- Update PostgreSQL credentials and database name
- Generate a strong JWT secret (recommended: 32+ characters)
- Set your frontend URL for CORS configuration

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Optional: View your database in Prisma Studio
npx prisma studio
```

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:3000`

See the [API Documentation](API_DOCS.md) for detailed endpoint specifications and examples.
