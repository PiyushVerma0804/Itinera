import Trip from '../models/Trip.js';
import User from '../models/User.js';

// @desc    Create a new trip
// @route   POST /api/trips
// @access  Private
export const createTrip = async (req, res, next) => {
  const { title, destination, startDate, endDate, members } = req.body;

  // Simple validation
  if (!title || !destination || !startDate || !endDate) {
    return res.status(400).json({ message: 'Please enter all required fields' });
  }

  try {
    // Compile members list, ensuring the creator is included
    const membersList = members ? [...members] : [];
    if (!membersList.includes(req.user.id)) {
      membersList.push(req.user.id);
    }

    const newTrip = new Trip({
      title,
      destination,
      startDate,
      endDate,
      creator: req.user.id,
      members: membersList,
    });

    const savedTrip = await newTrip.save();
    
    // Populate creator detail
    const populatedTrip = await Trip.findById(savedTrip._id)
      .populate('creator', 'name email')
      .populate('members', 'name email');

    res.status(201).json(populatedTrip);
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's trips
// @route   GET /api/trips
// @access  Private
export const getTrips = async (req, res, next) => {
  try {
    // Find trips where user is the creator, a member, or invited
    const trips = await Trip.find({
      $or: [
        { creator: req.user.id },
        { members: req.user.id },
        { 'invitations.userId': req.user.id }
      ]
    })
    .populate('creator', 'name email')
    .populate('members', 'name email')
    .sort({ createdAt: -1 });

    res.status(200).json(trips);
  } catch (error) {
    next(error);
  }
};

// @desc    Get trip by ID
// @route   GET /api/trips/:id
// @access  Private
export const getTripById = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('members', 'name email');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check authorization: must be creator or member
    const creatorId = trip.creator._id ? trip.creator._id.toString() : trip.creator.toString();
    const isMember = creatorId === req.user.id || trip.members.some(
      (m) => (m._id ? m._id.toString() : m.toString()) === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'User not authorized to view this trip' });
    }

    res.status(200).json(trip);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a trip
// @route   PUT /api/trips/:id
// @access  Private
export const updateTrip = async (req, res, next) => {
  const { title, destination, startDate, endDate, notes } = req.body;

  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check authorization: must be creator or member
    const creatorId = trip.creator._id ? trip.creator._id.toString() : trip.creator.toString();
    const isCreator = creatorId === req.user.id;
    const isMember = isCreator || trip.members.some(
      (m) => (m._id ? m._id.toString() : m.toString()) === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'User not authorized to update this trip' });
    }

    if (title !== undefined) trip.title = title;
    if (destination !== undefined) trip.destination = destination;
    if (startDate !== undefined) trip.startDate = startDate;
    if (endDate !== undefined) trip.endDate = endDate;
    if (notes !== undefined) trip.notes = notes;

    const updatedTrip = await trip.save();

    const populatedTrip = await Trip.findById(updatedTrip._id)
      .populate('creator', 'name email')
      .populate('members', 'name email');

    res.status(200).json(populatedTrip);
  } catch (error) {
    next(error);
  }
};

// @desc    Generate a trip invite link
// @route   GET /api/trips/:id/invite-link
// @access  Private
export const generateInviteLink = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check authorization: must be creator or member
    const creatorId = trip.creator._id ? trip.creator._id.toString() : trip.creator.toString();
    const isMember = creatorId === req.user.id || trip.members.some(
      (m) => (m._id ? m._id.toString() : m.toString()) === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'User not authorized to access the invite link' });
    }

    // Auto-heal/generate inviteCode for existing trips created before schema change
    if (!trip.inviteCode) {
      trip.inviteCode = crypto.randomBytes(6).toString('hex');
      await trip.save();
    }

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteUrl = `${clientUrl}/join/${trip.inviteCode}`;

    res.status(200).json({
      tripId: trip._id,
      inviteCode: trip.inviteCode,
      inviteUrl,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Regenerate a trip invite link (backend-only creator operation)
// @route   POST /api/trips/:id/invite-link/regenerate
// @access  Private
import crypto from 'crypto';
export const regenerateInviteLink = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Creator only
    if (trip.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can regenerate the invite code' });
    }

    // Generate new code
    trip.inviteCode = crypto.randomBytes(6).toString('hex');
    await trip.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const inviteUrl = `${clientUrl}/join/${trip.inviteCode}`;

    res.status(200).json({
      tripId: trip._id,
      inviteCode: trip.inviteCode,
      inviteUrl,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a trip by invite code
// @route   POST /api/trips/join/:inviteCode
// @access  Private
export const joinTripByInvite = async (req, res, next) => {
  const { inviteCode } = req.params;

  try {
    const trip = await Trip.findOne({ inviteCode });
    if (!trip) {
      return res.status(404).json({ message: 'Invalid invite code' });
    }

    // Creator cannot join again
    if (trip.creator.toString() === req.user.id) {
      const populatedTrip = await Trip.findById(trip._id)
        .populate('creator', 'name email')
        .populate('members', 'name email');
      return res.status(200).json(populatedTrip);
    }

    // Prevent duplicate joins
    const isAlreadyMember = trip.members.some(
      (mId) => mId.toString() === req.user.id
    );

    if (isAlreadyMember) {
      const populatedTrip = await Trip.findById(trip._id)
        .populate('creator', 'name email')
        .populate('members', 'name email');
      return res.status(200).json(populatedTrip);
    }

    // Add user to members
    trip.members.push(req.user.id);
    await trip.save();

    const populatedTrip = await Trip.findById(trip._id)
      .populate('creator', 'name email')
      .populate('members', 'name email');

    res.status(200).json(populatedTrip);
  } catch (error) {
    next(error);
  }
};

// @desc    Get members of a trip
// @route   GET /api/trips/:id/members
// @access  Private
export const getMembers = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('creator', 'name email')
      .populate('members', 'name email');

    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check authorization: must be creator or member
    const creatorId = trip.creator._id ? trip.creator._id.toString() : trip.creator.toString();
    const isMember = creatorId === req.user.id || trip.members.some(
      (m) => (m._id ? m._id.toString() : m.toString()) === req.user.id
    );

    if (!isMember) {
      return res.status(403).json({ message: 'User not authorized to view members' });
    }

    res.status(200).json({
      creator: trip.creator,
      members: trip.members,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a member from a trip
// @route   DELETE /api/trips/:id/members/:memberId
// @access  Private
export const removeMember = async (req, res, next) => {
  const { memberId } = req.params;

  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check if requester is creator
    if (trip.creator.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can remove members' });
    }

    // Creator cannot remove themselves
    if (memberId === trip.creator.toString()) {
      return res.status(400).json({ message: 'Cannot remove the trip creator' });
    }

    // Remove from members array
    trip.members = trip.members.filter((m) => m.toString() !== memberId);
    await trip.save();

    const populatedTrip = await Trip.findById(trip._id)
      .populate('creator', 'name email')
      .populate('members', 'name email');

    res.status(200).json(populatedTrip);
  } catch (error) {
    next(error);
  }
};
