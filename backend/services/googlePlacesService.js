/**
 * Service for interacting with Google Places API (New)
 */

const MAX_RESULTS = 20;
const REQUEST_TIMEOUT_MS = 10000;

/*
Future Enhancement:

For itinerary generation and richer destination intelligence,
selected places may later be enriched using the Google Places
Details API to retrieve more complete opening hours,
website information, photos, and additional metadata.
*/

/**
 * Normalizes a raw place object from Google Places API (New)
 * into the application's standard place format.
 *
 * @param {Object} place - Raw place object from Google Places API
 * @returns {Object|null} Normalized place object
 */
const normalizePlace = (place) => {
  if (!place) return null;

  // Map Google Places API (New) PriceLevel enum strings to our numeric values (0 to 4)
  const priceLevelMap = {
    'FREE': 0,
    'PRICE_LEVEL_FREE': 0,
    'INEXPENSIVE': 1,
    'PRICE_LEVEL_INEXPENSIVE': 1,
    'MODERATE': 2,
    'PRICE_LEVEL_MODERATE': 2,
    'EXPENSIVE': 3,
    'PRICE_LEVEL_EXPENSIVE': 3,
    'VERY_EXPENSIVE': 4,
    'PRICE_LEVEL_VERY_EXPENSIVE': 4
  };

  const rawPriceLevel = place.priceLevel;
  const priceLevel = (rawPriceLevel && priceLevelMap[rawPriceLevel] !== undefined)
    ? priceLevelMap[rawPriceLevel]
    : null;

  return {
    placeId: place.id || null,
    name: place.displayName?.text || null,
    rating: typeof place.rating === 'number' ? place.rating : null,
    userRatingsTotal: typeof place.userRatingCount === 'number' ? place.userRatingCount : null,
    priceLevel,
    address: place.formattedAddress || null,
    location: {
      lat: place.location?.latitude ?? null,
      lng: place.location?.longitude ?? null
    },
    openingHours: place.regularOpeningHours?.weekdayDescriptions || place.openingHours?.weekdayDescriptions || [],
    website: place.websiteUri || null,
    photoReferences: place.photos?.map(photo => photo.name).filter(Boolean) || []
  };
};

/**
 * Validates the destination input parameters.
 *
 * @param {string} destination - Destination name to validate
 * @throws {Error} If destination is invalid
 */
const validateDestination = (destination) => {
  if (!destination || typeof destination !== 'string' || destination.trim() === '') {
    throw new Error('Destination is required');
  }
};

/**
 * Helper to make requests to the Google Places API (New) Text Search endpoint
 *
 * @param {string} textQuery - The query to search for
 * @returns {Promise<Array>} List of raw place objects
 */
const makePlacesRequest = async (textQuery) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY is not defined in the environment variables.');
  }

  const endpoint = 'https://places.googleapis.com/v1/places:searchText';
  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': apiKey,
    'X-Goog-FieldMask': 'places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.formattedAddress,places.location,places.regularOpeningHours,places.websiteUri,places.photos'
  };

  const body = JSON.stringify({
    textQuery,
    maxResultCount: MAX_RESULTS
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Places API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.places || [];
  } catch (error) {
    if (error.name === 'AbortError' || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new Error('Google Places API request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Reusable helper to search and retrieve normalized places.
 *
 * @param {string} query - The search query string
 * @returns {Promise<Array>} Normalized places list
 */
const searchPlaces = async (query) => {
  if (!query || typeof query !== 'string' || query.trim() === '') {
    throw new Error('Query is required');
  }
  const places = await makePlacesRequest(query);
  return places.map(normalizePlace).filter(Boolean).slice(0, MAX_RESULTS);
};

/**
 * Fetches hotels for a given destination
 *
 * @param {string} destination - The name of the destination
 * @returns {Promise<Array>} Normalized list of hotels
 */
export const getHotels = async (destination) => {
  validateDestination(destination);
  try {
    return await searchPlaces(`hotels in ${destination}`);
  } catch (error) {
    throw new Error(`Failed to fetch hotels for destination: ${destination}. ${error.message}`);
  }
};

/**
 * Fetches restaurants for a given destination
 *
 * @param {string} destination - The name of the destination
 * @returns {Promise<Array>} Normalized list of restaurants
 */
export const getRestaurants = async (destination) => {
  validateDestination(destination);
  try {
    return await searchPlaces(`restaurants in ${destination}`);
  } catch (error) {
    throw new Error(`Failed to fetch restaurants for destination: ${destination}. ${error.message}`);
  }
};

/**
 * Fetches tourist attractions for a given destination
 *
 * @param {string} destination - The name of the destination
 * @returns {Promise<Array>} Normalized list of attractions
 */
export const getAttractions = async (destination) => {
  validateDestination(destination);
  try {
    return await searchPlaces(`tourist attractions in ${destination}`);
  } catch (error) {
    throw new Error(`Failed to fetch attractions for destination: ${destination}. ${error.message}`);
  }
};

/**
 * Fetches activities for a given destination
 *
 * @param {string} destination - The name of the destination
 * @returns {Promise<Array>} Normalized list of activities
 */
export const getActivities = async (destination) => {
  validateDestination(destination);
  try {
    return await searchPlaces(`things to do in ${destination}`);
  } catch (error) {
    throw new Error(`Failed to fetch activities for destination: ${destination}. ${error.message}`);
  }
};
