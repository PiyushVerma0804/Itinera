import {
  createItinerary,
  getItineraryById,
  getUserItineraries,
  updateItinerary,
  deleteItinerary,
  createItineraryVersion,
  updateBudgetSummary
} from '../services/itineraryService.js';

/**
 * Helper function to map service errors to standardized API JSON responses.
 * 
 * @param {Error} error - The caught service error
 * @param {Object} res - Express response object
 * @param {string} actionName - Name of the controller function for internal logs
 * @returns {Object} Express JSON response
 */
const handleControllerError = (error, res, actionName) => {
  const message = error.message || 'An unexpected error occurred';
  const msgLower = message.toLowerCase();

  // Map 404 Not Found
  if (msgLower.includes('not found')) {
    return res.status(404).json({
      success: false,
      message
    });
  }

  // Map 400 Bad Request for validation & syntax issues
  const isValidationError = 
    msgLower.includes('required') ||
    msgLower.includes('invalid') ||
    msgLower.includes('must be') ||
    msgLower.includes('does not match') ||
    msgLower.includes('after start date') ||
    msgLower.includes('positive number') ||
    msgLower.includes('non-negative number') ||
    msgLower.includes('validation');

  if (isValidationError) {
    return res.status(400).json({
      success: false,
      message
    });
  }

  // Map 500 Internal Server Error (hide stack traces for security)
  console.error(`Unexpected error in ${actionName}:`, error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
};

/**
 * Route: POST /api/itineraries
 * Creates a new itinerary.
 */
export const createItineraryController = async (req, res) => {
  try {
    const data = await createItinerary(req.body);
    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    return handleControllerError(error, res, 'createItineraryController');
  }
};

/**
 * Route: GET /api/itineraries/:id
 * Retrieves an itinerary by ID.
 */
export const getItineraryController = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await getItineraryById(id);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return handleControllerError(error, res, 'getItineraryController');
  }
};

/**
 * Route: GET /api/itineraries/user/:userId
 * Retrieves all itineraries for a user.
 */
export const getUserItinerariesController = async (req, res) => {
  const { userId } = req.params;
  try {
    const data = await getUserItineraries(userId);
    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });
  } catch (error) {
    return handleControllerError(error, res, 'getUserItinerariesController');
  }
};

/**
 * Route: PUT /api/itineraries/:id
 * Updates specific fields of an itinerary.
 */
export const updateItineraryController = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await updateItinerary(id, req.body);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return handleControllerError(error, res, 'updateItineraryController');
  }
};

/**
 * Route: DELETE /api/itineraries/:id
 * Deletes an itinerary by ID.
 */
export const deleteItineraryController = async (req, res) => {
  const { id } = req.params;
  try {
    await deleteItinerary(id);
    return res.status(200).json({
      success: true,
      message: 'Itinerary deleted successfully'
    });
  } catch (error) {
    return handleControllerError(error, res, 'deleteItineraryController');
  }
};

/**
 * Route: POST /api/itineraries/:id/version
 * Spawns a new version of the specified itinerary.
 */
export const createItineraryVersionController = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await createItineraryVersion(id);
    return res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    return handleControllerError(error, res, 'createItineraryVersionController');
  }
};

/**
 * Route: PATCH /api/itineraries/:id/budget
 * Recalculates the budget summary using actual day/activity costs.
 */
export const updateBudgetSummaryController = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await updateBudgetSummary(id);
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    return handleControllerError(error, res, 'updateBudgetSummaryController');
  }
};
