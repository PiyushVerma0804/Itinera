import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import tripRoutes from './routes/tripRoutes.js';
import preferenceRoutes from './routes/preferenceRoutes.js';
import planningRoutes from './routes/planningRoutes.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

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
