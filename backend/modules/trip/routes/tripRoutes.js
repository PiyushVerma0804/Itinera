import express from 'express';
import { 
  getTrips, 
  getTripById, 
  createTrip, 
  updateTrip,
  generateInviteLink,
  regenerateInviteLink,
  joinTripByInvite,
  getMembers,
  removeMember
} from '../controllers/tripController.js';
import auth from '../../auth/middleware/auth.js';

const router = express.Router();

router.get('/', auth, getTrips);
router.post('/join/:inviteCode', auth, joinTripByInvite);
router.get('/:id', auth, getTripById);
router.post('/', auth, createTrip);
router.put('/:id', auth, updateTrip);

// Invite and member routes
router.get('/:id/invite-link', auth, generateInviteLink);
router.post('/:id/invite-link/regenerate', auth, regenerateInviteLink);
router.get('/:id/members', auth, getMembers);
router.delete('/:id/members/:memberId', auth, removeMember);

export default router;
