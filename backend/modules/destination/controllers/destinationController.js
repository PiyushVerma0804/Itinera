import { getDestinationIntelligence } from '../services/destinationIntelligenceService.js';

/**
 * Controller to handle fetching destination intelligence data
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDestinationData = async (req, res) => {
  const { destination } = req.params;

  try {
    const intelligence = await getDestinationIntelligence(destination);

    return res.status(200).json({
      success: true,
      data: intelligence
    });
  } catch (error) {
    // Check if error is a validation error (destination required)
    if (error.message.includes('Destination is required')) {
      return res.status(400).json({
        success: false,
        message: 'Destination is required'
      });
    }

    // Log unexpected errors before responding
    console.error(`Error fetching intelligence for destination "${destination}":`, error);

    // Return standardized 500 response without exposing stack traces
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch destination intelligence'
    });
  }
};
