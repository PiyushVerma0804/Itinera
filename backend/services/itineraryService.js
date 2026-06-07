import mongoose from 'mongoose';
import Itinerary from '../models/Itinerary.js';

/**
 * PRIVATE HELPERS
 */

/**
 * Validates whether the given ID is a valid MongoDB ObjectId.
 * 
 * @param {string} id - The ID to validate
 * @param {string} name - Name of the ID field for descriptive errors
 * @throws {Error} If ID is invalid
 */
const validateObjectId = (id, name = 'ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${name}: ${id}`);
  }
};

/**
 * Validates the required fields for creating a new itinerary.
 * 
 * @param {Object} data - Input itinerary data
 * @throws {Error} If any required field is missing or invalid
 */
const validateCreateData = (data) => {
  if (!data) {
    throw new Error('Itinerary data is required');
  }
  if (!data.user) {
    throw new Error('User is required');
  }
  validateObjectId(data.user, 'User ID');
  
  if (!data.destination || typeof data.destination !== 'string' || data.destination.trim() === '') {
    throw new Error('Destination is required');
  }
  if (!data.startDate) {
    throw new Error('Start date is required');
  }
  if (isNaN(Date.parse(data.startDate))) {
    throw new Error('Invalid start date');
  }
  if (!data.endDate) {
    throw new Error('End date is required');
  }
  if (isNaN(Date.parse(data.endDate))) {
    throw new Error('Invalid end date');
  }

  const start = new Date(data.startDate);
  const end = new Date(data.endDate);

  if (start >= end) {
    throw new Error('End date must be after start date');
  }

  if (data.tripDuration === undefined || data.tripDuration === null) {
    throw new Error('Trip duration is required');
  }
  if (typeof data.tripDuration !== 'number' || data.tripDuration < 1) {
    throw new Error('Trip duration must be a positive number');
  }

  const timeDiff = end.getTime() - start.getTime();
  const calculatedDays = Math.round(timeDiff / (1000 * 3600 * 24)) + 1;
  if (data.tripDuration !== calculatedDays) {
    throw new Error('Trip duration does not match date range');
  }

  if (data.budget === undefined || data.budget === null) {
    throw new Error('Budget is required');
  }
  if (typeof data.budget !== 'number' || data.budget < 0) {
    throw new Error('Budget must be a non-negative number');
  }
};

/**
 * Calculates a consolidated budget summary based on the daily activities list.
 * 
 * @param {Array} days - List of day documents containing activities
 * @returns {Object} Budget summary object
 */
const calculateBudgetSummary = (days) => {
  let accommodation = 0;
  let food = 0;
  let transport = 0;
  let activities = 0;
  let miscellaneous = 0;

  if (days && Array.isArray(days)) {
    for (const day of days) {
      let activityCostSum = 0;
      if (day && Array.isArray(day.activities)) {
        for (const act of day.activities) {
          const cost = Number(act.estimatedCost) || 0;
          activityCostSum += cost;

          switch (act.category) {
            case 'accommodation':
              accommodation += cost;
              break;
            case 'food':
              food += cost;
              break;
            case 'travel':
              transport += cost;
              break;
            case 'sightseeing':
            case 'activity':
              activities += cost;
              break;
            case 'leisure':
            default:
              miscellaneous += cost;
              break;
          }
        }
      }
      
      const dayCost = Number(day.estimatedCost) || 0;
      const unallocatedDayCost = Math.max(0, dayCost - activityCostSum);
      miscellaneous += unallocatedDayCost;
    }
  }

  const total = accommodation + food + transport + activities + miscellaneous;

  return {
    accommodation,
    food,
    transport,
    activities,
    miscellaneous,
    total,
  };
};

/**
 * PUBLIC EXPORTS
 */

/**
 * Creates a new itinerary.
 * 
 * @param {Object} data - Itinerary details
 * @returns {Promise<Object>} Created Itinerary document
 */
export const createItinerary = async (data) => {
  try {
    validateCreateData(data);
    const itinerary = new Itinerary(data);
    return await itinerary.save();
  } catch (error) {
    throw new Error(`Failed to create itinerary: ${error.message}`);
  }
};

/**
 * Fetches an itinerary by ID, populated with User details.
 * 
 * @param {string} id - Itinerary ID
 * @returns {Promise<Object>} Populated Itinerary document
 */
export const getItineraryById = async (id) => {
  validateObjectId(id, 'Itinerary ID');
  try {
    const itinerary = await Itinerary.findById(id).populate('user');
    if (!itinerary) {
      throw new Error('Itinerary not found');
    }
    return itinerary;
  } catch (error) {
    if (error.message === 'Itinerary not found') throw error;
    throw new Error(`Failed to fetch itinerary by ID ${id}: ${error.message}`);
  }
};

/**
 * Fetches all itineraries associated with a specific user, ordered newest first.
 * 
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of Itinerary documents
 */
export const getUserItineraries = async (userId) => {
  validateObjectId(userId, 'User ID');
  try {
    return await Itinerary.find({ user: userId }).sort({ createdAt: -1 });
  } catch (error) {
    throw new Error(`Failed to fetch itineraries for user ${userId}: ${error.message}`);
  }
};

/**
 * Updates an existing itinerary without overwriting unspecified fields.
 * 
 * @param {string} id - Itinerary ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated Itinerary document
 */
export const updateItinerary = async (id, updates) => {
  validateObjectId(id, 'Itinerary ID');
  try {
    const itinerary = await Itinerary.findById(id);
    if (!itinerary) {
      throw new Error('Itinerary not found');
    }

    const disallowedKeys = ['_id', 'user', 'createdAt', 'updatedAt'];
    const cleanUpdates = { ...updates };
    for (const key of disallowedKeys) {
      delete cleanUpdates[key];
    }

    Object.assign(itinerary, cleanUpdates);
    return await itinerary.save();
  } catch (error) {
    if (error.message === 'Itinerary not found') throw error;
    throw new Error(`Failed to update itinerary ${id}: ${error.message}`);
  }
};

/**
 * Deletes an itinerary by ID.
 * 
 * @param {string} id - Itinerary ID
 * @returns {Promise<Object>} Confirmation object { success: true }
 */
export const deleteItinerary = async (id) => {
  validateObjectId(id, 'Itinerary ID');
  try {
    const itinerary = await Itinerary.findById(id);
    if (!itinerary) {
      throw new Error('Itinerary not found');
    }
    await Itinerary.deleteOne({ _id: id });
    return { success: true };
  } catch (error) {
    if (error.message === 'Itinerary not found') throw error;
    throw new Error(`Failed to delete itinerary ${id}: ${error.message}`);
  }
};

/**
 * Deep clones an itinerary to spawn a new version with incremented version number,
 * linking back to the original parent itinerary and reset status.
 * 
 * @param {string} itineraryId - Original Itinerary ID
 * @returns {Promise<Object>} Cloned Itinerary document of the new version
 */
export const createItineraryVersion = async (itineraryId) => {
  validateObjectId(itineraryId, 'Itinerary ID');
  try {
    const original = await Itinerary.findById(itineraryId);
    if (!original) {
      throw new Error('Itinerary not found');
    }

    const originalObj = original.toObject();

    // Remove Mongo identifiers
    delete originalObj._id;
    delete originalObj.createdAt;
    delete originalObj.updatedAt;

    // Increment version, link to parent and set status to draft
    originalObj.version = (original.version || 1) + 1;
    originalObj.parentItinerary = original.parentItinerary || original._id;
    originalObj.status = 'draft';

    const newVersion = new Itinerary(originalObj);
    return await newVersion.save();
  } catch (error) {
    if (error.message === 'Itinerary not found') throw error;
    throw new Error(`Failed to create version for itinerary ${itineraryId}: ${error.message}`);
  }
};

/**
 * Recalculates the budget summary based on actual daily activities costs
 * and updates the database document.
 * 
 * @param {string} itineraryId - Itinerary ID
 * @returns {Promise<Object>} Updated Itinerary document
 */
export const updateBudgetSummary = async (itineraryId) => {
  validateObjectId(itineraryId, 'Itinerary ID');
  try {
    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) {
      throw new Error('Itinerary not found');
    }

    itinerary.budgetSummary = calculateBudgetSummary(itinerary.days);
    return await itinerary.save();
  } catch (error) {
    if (error.message === 'Itinerary not found') throw error;
    throw new Error(`Failed to update budget summary for itinerary ${itineraryId}: ${error.message}`);
  }
};
