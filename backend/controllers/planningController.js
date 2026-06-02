import PlanningItem from '../models/PlanningItem.js';
import Trip from '../models/Trip.js';

// @desc    Create a new planning item for a trip
// @route   POST /api/trips/:tripId/planning
// @access  Private
export const createPlanningItem = async (req, res, next) => {
  const { tripId } = req.params;
  const { category, title, description } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const validCategories = ['Place', 'Food', 'Activity', 'General Idea'];
  if (!category || !validCategories.includes(category)) {
    return res.status(400).json({ message: 'Invalid category' });
  }

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Auth check: creator or member of trip
    const creatorId = trip.creator.toString();
    const isMember = creatorId === req.user.id || trip.members.some(m => m.toString() === req.user.id);

    if (!isMember) {
      return res.status(403).json({ message: 'User not authorized to access this trip' });
    }

    const newItem = new PlanningItem({
      trip: tripId,
      createdBy: req.user.id,
      category,
      title: title.trim(),
      description: description ? description.trim() : '',
      votes: [req.user.id],
    });

    await newItem.save();

    const populated = await PlanningItem.findById(newItem._id).populate('createdBy', 'name email');

    // Add virtual fields for response consistency
    const itemObj = populated.toObject();
    itemObj.voteCount = 1;
    itemObj.hasVoted = true;

    res.status(201).json(itemObj);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all planning items for a trip
// @route   GET /api/trips/:tripId/planning
// @access  Private
export const getPlanningItems = async (req, res, next) => {
  const { tripId } = req.params;

  try {
    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Auth check: creator or member of trip
    const creatorId = trip.creator.toString();
    const isMember = creatorId === req.user.id || trip.members.some(m => m.toString() === req.user.id);

    if (!isMember) {
      return res.status(403).json({ message: 'User not authorized to access this trip' });
    }

    const items = await PlanningItem.find({ trip: tripId })
      .populate('createdBy', 'name email');

    const currentUserId = req.user.id;
    const processedItems = items.map(item => {
      const itemObj = item.toObject();
      itemObj.voteCount = item.votes ? item.votes.length : 0;
      itemObj.hasVoted = item.votes ? item.votes.some(v => v.toString() === currentUserId) : false;
      return itemObj;
    });

    // Sort by: 1. voteCount descending, 2. createdAt descending
    processedItems.sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.status(200).json(processedItems);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a planning item
// @route   PUT /api/planning/:id
// @access  Private
export const updatePlanningItem = async (req, res, next) => {
  const { id } = req.params;
  const { title, description, category } = req.body;

  try {
    const item = await PlanningItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Planning item not found' });
    }

    const trip = await Trip.findById(item.trip);
    if (!trip) {
      return res.status(404).json({ message: 'Associated trip not found' });
    }

    // Auth check: ONLY item creator can edit
    const isItemCreator = item.createdBy.toString() === req.user.id;

    if (!isItemCreator) {
      return res.status(403).json({ message: 'User not authorized to update this planning item' });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: 'Title is required' });
      }
      item.title = title.trim();
    }

    if (description !== undefined) {
      item.description = description.trim();
    }

    if (category !== undefined) {
      const validCategories = ['Place', 'Food', 'Activity', 'General Idea'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      item.category = category;
    }

    await item.save();

    const populated = await PlanningItem.findById(item._id).populate('createdBy', 'name email');

    // Add virtual fields for response consistency
    const itemObj = populated.toObject();
    itemObj.voteCount = populated.votes ? populated.votes.length : 0;
    itemObj.hasVoted = populated.votes ? populated.votes.some(v => v.toString() === req.user.id) : false;

    res.status(200).json(itemObj);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a planning item
// @route   DELETE /api/planning/:id
// @access  Private
export const deletePlanningItem = async (req, res, next) => {
  const { id } = req.params;

  try {
    const item = await PlanningItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Planning item not found' });
    }

    const trip = await Trip.findById(item.trip);
    if (!trip) {
      return res.status(404).json({ message: 'Associated trip not found' });
    }

    // Auth check: ONLY item creator can delete
    const isItemCreator = item.createdBy.toString() === req.user.id;

    if (!isItemCreator) {
      return res.status(403).json({ message: 'User not authorized to delete this planning item' });
    }

    await PlanningItem.findByIdAndDelete(id);

    res.status(200).json({ message: 'Planning item deleted successfully', id });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user's interest / vote on planning item
// @route   POST /api/planning/:id/vote
// @access  Private
export const toggleVote = async (req, res, next) => {
  const { id } = req.params;
  const currentUserId = req.user.id;

  try {
    const item = await PlanningItem.findById(id);
    if (!item) {
      return res.status(404).json({ message: 'Planning item not found' });
    }

    const trip = await Trip.findById(item.trip);
    if (!trip) {
      return res.status(404).json({ message: 'Associated trip not found' });
    }

    // Auth check: creator or member of trip
    const creatorId = trip.creator.toString();
    const isMember = creatorId === currentUserId || trip.members.some(m => m.toString() === currentUserId);

    if (!isMember) {
      return res.status(403).json({ message: 'User not authorized to view this trip' });
    }

    const hasVoted = item.votes.some(v => v.toString() === currentUserId);

    if (hasVoted) {
      // Remove interest
      item.votes = item.votes.filter(v => v.toString() !== currentUserId);
    } else {
      // Add interest (prevent duplicates through array safety)
      if (!item.votes.includes(currentUserId)) {
        item.votes.push(currentUserId);
      }
    }

    await item.save();

    res.status(200).json({
      voteCount: item.votes.length,
      hasVoted: !hasVoted,
    });
  } catch (error) {
    next(error);
  }
};
