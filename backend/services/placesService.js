import {
  getHotels as getGeoapifyHotels,
  getRestaurants as getGeoapifyRestaurants,
  getAttractions as getGeoapifyAttractions,
  getActivities as getGeoapifyActivities,
  fetchAllDestinationPlaces as fetchAllGeoapifyDestinationPlaces
} from '../providers/geoapifyProvider.js';

/**
 * Fetches hotels for a given destination
 *
 * @param {string} destination - The destination name
 * @returns {Promise<Array>} Normalized places array
 */
export const getHotels = async (destination) => {
  return getGeoapifyHotels(destination);
};

/**
 * Fetches restaurants for a given destination
 *
 * @param {string} destination - The destination name
 * @returns {Promise<Array>} Normalized places array
 */
export const getRestaurants = async (destination) => {
  return getGeoapifyRestaurants(destination);
};

/**
 * Fetches tourist attractions for a given destination
 *
 * @param {string} destination - The destination name
 * @returns {Promise<Array>} Normalized places array
 */
export const getAttractions = async (destination) => {
  return getGeoapifyAttractions(destination);
};

/**
 * Fetches activities for a given destination
 *
 * @param {string} destination - The destination name
 * @returns {Promise<Array>} Normalized places array
 */
export const getActivities = async (destination) => {
  return getGeoapifyActivities(destination);
};

/**
 * Fetches all destination places in parallel using a single geocoding lookup.
 *
 * @param {string} destination - The target destination name
 * @returns {Promise<Object>} Object containing all category arrays
 */
export const fetchAllDestinationPlaces = async (destination) => {
  return fetchAllGeoapifyDestinationPlaces(destination);
};
