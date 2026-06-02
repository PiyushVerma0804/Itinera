import express from 'express';
import { savePreferences, getTripPreferences } from '../controllers/preferenceController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Mount on /api/trips
router.post('/:id/preferences', auth, savePreferences);
router.get('/:id/preferences', auth, getTripPreferences);

export default router;
