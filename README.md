# 🌍 Itinera: Collaborative Travel Coordination Platform

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.19-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-brightgreen.svg)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Itinera** is an advanced, AI-powered collaborative travel coordination platform designed to transform how groups plan, organize, and experience their trips. By combining robust group mechanics with intelligent destination knowledge (powered by Groq AI and Geoapify), Itinera delivers seamless and stress-free trip orchestration.

---

## 🚀 Features

### Core Domain Capabilities
- **🔐 Secure Authentication**: JWT-based user authentication and robust profile management.
- **🗺️ Trip Orchestration**: Create, manage, and coordinate trips. Invite members dynamically with secure invite links (`/join/:inviteCode`) to build your travel group.
- **🎯 Intelligent Preferences**: Trip-specific preference aggregation (pace, categories, etc.) ensuring that everyone's voice shapes the travel plan.
- **📅 Collaborative Planning**: A shared workspace for brainstorming "Places", "Food", "Activities", and "General Ideas". Includes a voting mechanism to democratize decision-making.

### 🧠 Destination Intelligence Layer
Itinera features a state-of-the-art **Destination Intelligence Service** that acts as the brain behind location discovery:
- **Geoapify Integration**: Rapid fetching of local attractions, hotels, and restaurants based on geospatial bounding boxes.
- **Groq AI Knowledge Service**: Extracts cultural insights, local customs, best times to visit, and regional context using high-speed LLM processing.
- **High-Performance Caching**: A unified MongoDB-backed `DestinationCache` intelligently fuses structured location data with semantic AI insights. This prevents redundant API requests and guarantees sub-100ms response times for previously fetched destinations.

### 🗺️ Next-Generation Itinerary Management
- **Intelligent Structures**: A sophisticated schema design capable of mapping days, granular activities, estimated costs, and real-time mapping coordinates.
- **Version Control**: Built-in itinerary versioning allows users to spawn off new drafts without losing the original plan—perfect for A/B testing travel routes.
- **Automated Budgeting**: Real-time recalculation of trip budgets breaking down costs across accommodation, transport, food, activities, and miscellaneous expenses.

---

## 🏗️ Architecture

The backend recently underwent a full migration to a **Domain-Driven Design (DDD)** structure to ensure maximum scalability and maintainability as the platform's AI orchestration capabilities grow.

```text
backend/
├── infrastructure/     # External integrations (MongoDB, AI Providers, Map APIs)
├── shared/             # Cross-cutting concerns (Middleware, Utilities, Error handling)
└── modules/            # Isolated business domains
    ├── auth/           # Identity and JWT management
    ├── destination/    # Intelligence, caching, and Geoapify/Groq orchestration
    ├── itinerary/      # Core routing, versioning, and upcoming AI Generators
    ├── planning/       # Collaborative brainstorming and voting
    ├── preferences/    # Aggregation of group preferences
    └── trip/           # Core trip context and access control
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- MongoDB (Local or Atlas)
- API Keys for Geoapify & Groq (for the intelligence layer)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/itinera.git
   cd itinera
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   *Edit `.env` to include your `MONGODB_URI`, `JWT_SECRET`, `GEOAPIFY_API_KEY`, and `GROQ_API_KEY`.*

3. **Start the Backend:**
   ```bash
   # Development mode with hot-reloading
   npm run dev
   
   # Production mode
   npm start
   ```

*(Frontend setup instructions will be available in the `frontend/` directory).*

---

## 🛣️ Roadmap & Future Horizons

- **Week 5 Phase**: Introduction of **AI Itinerary Generation** utilizing the `Itinerary Generators` and `Prompt Builders` within the Itinerary domain. The system will soon generate full, multi-day itineraries algorithmically tailored to the group's aggregated preferences.
- **Advanced Route Optimization**: Utilizing Map APIs to solve TSP (Traveling Salesperson Problem) for daily activity sequencing.
- **Real-Time Collaboration**: Transitioning the Planning board to WebSockets for live cursor/voting updates.

---

## 🛡️ Security & Best Practices

- **Role-Based Access Control (RBAC)**: All routes enforce strict access based on trip creator vs. member permissions.
- **Error Encapsulation**: A centralized error handler (`errorHandler.js`) prevents stack-trace leakage in production.
- **Modular Autonomy**: Domain-driven boundaries ensure that complex modules (like `destination`) can be refactored or scaled independently from core CRUD modules (like `trip`).

---

## 📝 License
This project is licensed under the MIT License.
