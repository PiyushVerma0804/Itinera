import express from 'express';
import {
  createPlanningItem,
  getPlanningItems,
  updatePlanningItem,
  deletePlanningItem,
  toggleVote
} from '../controllers/planningController.js';
import auth from '../../auth/middleware/auth.js';

const router = express.Router();

// Protected Planning Board endpoints
router.post('/trips/:tripId/planning', auth, createPlanningItem);
router.get('/trips/:tripId/planning', auth, getPlanningItems);
router.put('/planning/:id', auth, updatePlanningItem);
router.delete('/planning/:id', auth, deletePlanningItem);
router.post('/planning/:id/vote', auth, toggleVote);

export default router;
