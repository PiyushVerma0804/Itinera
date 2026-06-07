import express from 'express';
import { getDestinationData } from '../controllers/destinationController.js';

const router = express.Router();

/**
 * Route to fetch intelligence data for a specific destination
 * GET /api/destinations/:destination
 */
router.get('/:destination', (req, res, next) => {
  // Lightweight route-level validation
  if (!req.params.destination || req.params.destination.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Destination parameter is required'
    });
  }
  next();
}, getDestinationData);

export default router;
