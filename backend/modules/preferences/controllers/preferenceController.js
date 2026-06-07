import Preference from '../models/Preference.js';
import Trip from '../../trip/models/Trip.js';

// Helper function to calculate Mode (most common element) in an array
const getMode = (arr) => {
  if (!arr || arr.length === 0) return '';
  const freq = {};
  let maxCount = 0;
  let mode = '';
  for (const val of arr) {
    if (!val) continue;
    freq[val] = (freq[val] || 0) + 1;
    if (freq[val] > maxCount) {
      maxCount = freq[val];
      mode = val;
    }
  }
  return mode;
};

// Helper function to get top N elements by frequency
const getTopNElements = (arrays, n = 3) => {
  const flattened = arrays.flat().filter(Boolean);
  if (flattened.length === 0) return [];
  
  const freq = {};
  for (const item of flattened) {
    freq[item] = (freq[item] || 0) + 1;
  }
  
  return Object.keys(freq)
    .map(key => ({ item: key, count: freq[key] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
    .map(entry => entry.item);
};

// @desc    Save or update user's preferences for a trip
// @route   POST /api/trips/:id/preferences
// @access  Private
export const savePreferences = async (req, res, next) => {
  const { budgetRange, travelStyle, foodPreferences, activityPreferences, notes } = req.body;

  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check workspace access: creator or member
    const creatorId = trip.creator.toString();
    const isMember = creatorId === req.user.id || trip.members.some(m => m.toString() === req.user.id);
    
    if (!isMember) {
      return res.status(403).json({ message: 'User not authorized to access this trip' });
    }

    const preference = await Preference.findOneAndUpdate(
      { trip: req.params.id, user: req.user.id },
      {
        budgetRange,
        travelStyle,
        foodPreferences: foodPreferences || [],
        activityPreferences: activityPreferences || [],
        notes: notes || '',
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json(preference);
  } catch (error) {
    next(error);
  }
};

// @desc    Get trip preferences and group insights
// @route   GET /api/trips/:id/preferences
// @access  Private
export const getTripPreferences = async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found' });
    }

    // Check workspace access: creator or member
    const creatorId = trip.creator.toString();
    const isMember = creatorId === req.user.id || trip.members.some(m => m.toString() === req.user.id);
    
    if (!isMember) {
      return res.status(403).json({ message: 'User not authorized to access this trip' });
    }

    const preferences = await Preference.find({ trip: req.params.id })
      .populate('user', 'name email');

    // Calculate unique total members safely
    const uniqueMembers = new Set();
    uniqueMembers.add(creatorId);
    trip.members.forEach(m => uniqueMembers.add(m.toString()));
    const totalMembers = uniqueMembers.size;

    const totalSubmitted = preferences.length;

    // Generate aggregated Group Insights only if at least one preference profile exists
    let insights = null;
    if (totalSubmitted > 0) {
      const budgets = preferences.map(p => p.budgetRange);
      const styles = preferences.map(p => p.travelStyle);
      const activitiesList = preferences.map(p => p.activityPreferences);
      const foodsList = preferences.map(p => p.foodPreferences);

      insights = {
        mostCommonBudget: getMode(budgets),
        mostCommonTravelStyle: getMode(styles),
        popularActivities: getTopNElements(activitiesList, 3),
        popularFoodInterests: getTopNElements(foodsList, 3),
      };
    }

    res.status(200).json({
      preferences,
      totalMembers,
      totalSubmitted,
      insights,
    });
  } catch (error) {
    next(error);
  }
};
