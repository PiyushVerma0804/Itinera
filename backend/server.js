import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './infrastructure/database/mongodb.js';
import destinationRoutes from './modules/destination/routes/destinationRoutes.js';
import userRoutes from './modules/auth/routes/userRoutes.js';
import tripRoutes from './modules/trip/routes/tripRoutes.js';
import preferenceRoutes from './modules/preferences/routes/preferenceRoutes.js';
import planningRoutes from './modules/planning/routes/planningRoutes.js';
import itineraryRoutes from './modules/itinerary/routes/itineraryRoutes.js';
import errorHandler from './shared/middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });


// Connect to MongoDB Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/trips', preferenceRoutes);
app.use('/api', planningRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/itineraries', itineraryRoutes);

// Base route status check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Collaborative Travel Coordination Platform API is running.',
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// Port and server listener
const PORT = parseInt(process.env.PORT, 10) || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
