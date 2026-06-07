# Itinera Backend Architecture

This directory houses the Node.js / Express API backend for the Itinera collaborative travel platform. 

## Domain-Driven Design (DDD) Overview

To support advanced AI integration and ensure maintainability, the backend is structured around **Business Domains** rather than technical layers. 

### Directory Structure

```text
backend/
├── infrastructure/     # Database, AI providers, and 3rd-party integrations
│   └── database/
│       └── mongodb.js  # Mongoose connection logic
├── modules/            # Isolated Business Domains
│   ├── auth/           # User registration, login, JWT issuance, and authentication middleware
│   ├── destination/    # Location caching, Geoapify/Groq provider integration, and intelligence services
│   ├── itinerary/      # Core itinerary generation, version control, and budget calculation
│   ├── planning/       # Group brainstorming, idea tracking, and voting mechanics
│   ├── preferences/    # Aggregation of travel pace, budget, and category preferences
│   └── trip/           # Trip scaffolding, member management, and invite link generation
├── shared/             # Cross-cutting system logic
│   ├── middleware/     # Global middleware (e.g., errorHandler.js)
│   ├── utils/          # Formatting and utility functions
│   ├── errors/         # Custom Error classes
│   └── validators/     # Reusable Joi/Zod validation schemas
├── server.js           # Core Express initialization and route mounting
└── package.json        # Dependencies and scripts
```

### Key Architectural Principles
1. **Encapsulation**: Each module inside `modules/` contains its own `controllers`, `models`, `routes`, and `services`. A module should rarely query another module's database model directly.
2. **Infrastructure Abstraction**: External providers (like Google, Geoapify, or Groq) are encapsulated behind service layers so the core domain logic is decoupled from third-party API changes.
3. **Thin Controllers**: Controllers exclusively handle HTTP transport logic (req/res formatting). All business logic resides in `services/`.

## Development Setup

1. **Environment Setup**:
   Copy `.env.example` to `.env` and fill in the required keys:
   ```bash
   cp .env.example .env
   ```
   **Required Keys:**
   - `MONGODB_URI`: Local or Atlas connection string
   - `JWT_SECRET`: Secret key for token signing
   - `GEOAPIFY_API_KEY`: For Destination Intelligence
   - `GROQ_API_KEY`: For Destination Knowledge LLM

2. **Run Server**:
   ```bash
   npm install
   npm run dev    # Starts with nodemon for hot-reloading
   ```

3. **Validation**:
   You can run `node validateSystem.js` (if present) to execute a local E2E systems check against the domain modules and verify that database models and routes are correctly configured.
