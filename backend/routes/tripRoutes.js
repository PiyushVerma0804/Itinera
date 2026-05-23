import express from 'express';
import { getTrips, getTripById, createTrip, updateTrip } from '../controllers/tripController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getTrips);
router.get('/:id', auth, getTripById);
router.post('/', auth, createTrip);
router.put('/:id', auth, updateTrip);

export default router;
