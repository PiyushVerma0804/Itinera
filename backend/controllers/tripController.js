import Trip from '../models/Trip.js';

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
    // Find trips where user is the creator OR a member
    const trips = await Trip.find({
      $or: [
        { creator: req.user.id },
        { members: req.user.id }
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
    const isMember = trip.members.some(
      (m) => m._id.toString() === req.user.id || trip.creator._id.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(401).json({ message: 'User not authorized to view this trip' });
    }

    res.status(200).json(trip);
  } catch (error) {
    next(error);
  }
};
