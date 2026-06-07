import express from 'express';
import {
  createItineraryController,
  getItineraryController,
  getUserItinerariesController,
  updateItineraryController,
  deleteItineraryController,
  createItineraryVersionController,
  updateBudgetSummaryController
} from '../controllers/itineraryController.js';

const router = express.Router();

/**
 * Route-level validation middleware to ensure ID is provided and not empty.
 */
const validateIdParam = (req, res, next) => {
  if (!req.params.id || req.params.id.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Itinerary ID is required'
    });
  }
  next();
};

/**
 * Route-level validation middleware to ensure User ID is provided and not empty.
 */
const validateUserIdParam = (req, res, next) => {
  if (!req.params.userId || req.params.userId.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'User ID is required'
    });
  }
  next();
};

// Route definitions mapped to controllers
router.post('/', createItineraryController);
router.get('/:id', validateIdParam, getItineraryController);
router.get('/user/:userId', validateUserIdParam, getUserItinerariesController);
router.put('/:id', validateIdParam, updateItineraryController);
router.delete('/:id', validateIdParam, deleteItineraryController);
router.post('/:id/version', validateIdParam, createItineraryVersionController);
router.patch('/:id/budget', validateIdParam, updateBudgetSummaryController);

export default router;
