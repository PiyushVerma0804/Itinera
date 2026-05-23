# Travel Coordination Platform - Backend Scaffold

This folder contains the Express API backend for the Collaborative Travel Coordination Platform.

## Directory Structure

```text
backend/
├── config/
│   └── db.js            # MongoDB Mongoose database connection
├── controllers/
│   ├── tripController.js # Travel trip placeholder controllers
│   └── userController.js # User profile placeholder controllers
├── models/
│   ├── Trip.js          # Trip Mongoose schema definition
│   └── User.js          # User Mongoose schema definition
├── routes/
│   ├── tripRoutes.js    # Express trip router endpoints
│   └── userRoutes.js    # Express user router endpoints
├── .env.example         # Local environment variables blueprint
├── package.json         # Package configuration, scripts, and dependencies
└── server.js            # Node/Express main server entrypoint
```

## Setup & Running Instructions

1. Copy environment template to file:
   ```bash
   cp .env.example .env
   ```
2. Configure `.env` variables with your specific database connection string and configuration.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run in development mode (with Hot Reloading):
   ```bash
   npm run dev
   ```
5. Start standard production server:
   ```bash
   npm start
   ```
