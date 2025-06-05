# Secure Login Backend

A Node.js Express server with PostgreSQL database using Prisma ORM for secure user authentication.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
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

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
PORT=3000
```

Replace with your actual PostgreSQL credentials and database name.

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init
```

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start at `http://localhost:3000`
