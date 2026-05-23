# Travel Coordination Platform - Frontend Scaffold

This folder contains the React + Vite single page application frontend for the Collaborative Travel Coordination Platform.

## Directory Structure

```text
frontend/
├── src/
│   ├── components/
│   │   └── Navbar.jsx     # Navigation bar component with active routing links
│   ├── pages/
│   │   ├── Dashboard.jsx  # Travel dashboards list & mock cards page
│   │   ├── Home.jsx       # Landing page hero CTA
│   │   └── Trip.jsx       # Interactive travel itineraries detail view
│   ├── App.jsx            # Main app file wiring up routers and layouts
│   ├── index.css          # Premium layout styling system
│   └── main.jsx           # React client mounting entrypoint
├── index.html             # Single entrypoint HTML with custom metadata
├── package.json           # React dependencies & build scripts config
└── README.md              # Frontend configuration guidelines
```

## Setup & Running Instructions

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run Vite local development server:
   ```bash
   npm run dev
   ```
3. Build responsive web bundle for production:
   ```bash
   npm run build
   ```
4. Preview production build locally:
   ```bash
   npm run preview
   ```
