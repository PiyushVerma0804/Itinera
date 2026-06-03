/*
Geoapify currently serves as the active destination data provider.

The provider abstraction layer allows future migration
to Google Places, Mapbox, or other providers without
changing application business logic.
*/

const MAX_RESULTS = 20;
const REQUEST_TIMEOUT_MS = 10000;
const SEARCH_RADIUS_METERS = 50000;

/**
 * Normalizes a raw place object from the Geoapify Places API (GeoJSON feature)
 * into the application's standard place format.
 *
 * @param {Object} place - Raw place feature from Geoapify
 * @returns {Object|null} Normalized place object
 */
const normalizePlace = (place) => {
  if (!place || !place.properties) return null;

  const props = place.properties;

  // Extract location coordinates (fallback to geometry)
  const lat = typeof props.lat === 'number' ? props.lat : (place.geometry?.coordinates?.[1] ?? null);
  const lng = typeof props.lon === 'number' ? props.lon : (place.geometry?.coordinates?.[0] ?? null);

  // Extract website (check properties, then raw OSM datasource)
  const website = props.website || props.datasource?.raw?.website || null;

  // Extract opening hours
  let openingHours = [];
  if (props.opening_hours) {
    openingHours = [props.opening_hours];
  } else if (props.datasource?.raw?.opening_hours) {
    openingHours = [props.datasource?.raw?.opening_hours];
  }

  // Fallback name if missing
  const name = props.name || props.formatted?.split(',')[0] || 'Unknown Place';

  return {
    placeId: props.place_id || null,
    name,
    rating: null,
    userRatingsTotal: null,
    priceLevel: null,
    address: props.formatted || null,
    location: {
      lat,
      lng
    },
    openingHours,
    website,
    photoReferences: []
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
 * Resolves a destination name to coordinates using the Geoapify Geocoding API.
 *
 * @param {string} destination - Destination name
 * @returns {Promise<Object>} { lat, lon } coordinates
 */
const geocodeDestination = async (destination) => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    throw new Error('GEOAPIFY_API_KEY is not defined in the environment variables.');
  }

  const endpoint = 'https://api.geoapify.com/v1/geocode/search';
  const params = new URLSearchParams({
    text: destination,
    format: 'json',
    apiKey
  });
  const url = `${endpoint}?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Geocoding request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const result = data.results?.[0];
    if (!result || typeof result.lat !== 'number' || typeof result.lon !== 'number') {
      throw new Error(`Coordinates not found for destination: ${destination}`);
    }

    return { lat: result.lat, lon: result.lon };
  } catch (error) {
    if (error.name === 'AbortError' || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new Error('Geoapify Geocoding API request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Resolves a destination name to coordinates. Validates input and output.
 *
 * @param {string} destination - Destination name
 * @returns {Promise<Object>} { lat, lon } coordinates
 */
export const getDestinationCoordinates = async (destination) => {
  validateDestination(destination);
  try {
    return await geocodeDestination(destination);
  } catch (error) {
    throw new Error(`Failed to geocode destination "${destination}": ${error.message}`);
  }
};

/**
 * Makes requests to the Geoapify Places API to find places by category within a circle.
 *
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {string} categories - Comma-separated Geoapify categories
 * @returns {Promise<Array>} List of raw place features
 */
const makePlacesRequest = async (lat, lon, categories) => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    throw new Error('GEOAPIFY_API_KEY is not defined in the environment variables.');
  }

  const endpoint = 'https://api.geoapify.com/v2/places';
  const params = new URLSearchParams({
    categories,
    filter: `circle:${lon},${lat},${SEARCH_RADIUS_METERS}`,
    bias: `proximity:${lon},${lat}`,
    limit: MAX_RESULTS,
    apiKey
  });
  const url = `${endpoint}?${params.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Geoapify Places API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    return data.features || [];
  } catch (error) {
    if (error.name === 'AbortError' || (error instanceof DOMException && error.name === 'AbortError')) {
      throw new Error('Geoapify Places API request timed out');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Reusable helper to geocode destination and search places, supporting cached/pre-fetched coordinates.
 *
 * @param {string} destination - The target destination name
 * @param {string} categories - Category filter string
 * @param {Object} [coordinates] - Optional coordinates to skip geocoding
 * @returns {Promise<Array>} Normalized list of places
 */
const getPlacesByCategory = async (destination, categories, coordinates = null) => {
  let coords = coordinates;
  if (!coords) {
    coords = await getDestinationCoordinates(destination);
  }
  const features = await makePlacesRequest(coords.lat, coords.lon, categories);
  return features.map(normalizePlace).filter(Boolean).slice(0, MAX_RESULTS);
};

/**
 * Fetches hotels for a given destination
 *
 * @param {string} destination - The name of the destination
 * @param {Object} [coordinates] - Optional coordinates
 * @returns {Promise<Array>} Normalized list of hotels
 */
export const getHotels = async (destination, coordinates = null) => {
  validateDestination(destination);
  try {
    return await getPlacesByCategory(
      destination,
      'accommodation.hotel,accommodation.hostel,accommodation.motel,accommodation.guest_house',
      coordinates
    );
  } catch (error) {
    throw new Error(`Failed to fetch hotels for destination: ${destination}. ${error.message}`);
  }
};

/**
 * Fetches restaurants for a given destination
 *
 * @param {string} destination - The name of the destination
 * @param {Object} [coordinates] - Optional coordinates
 * @returns {Promise<Array>} Normalized list of restaurants
 */
export const getRestaurants = async (destination, coordinates = null) => {
  validateDestination(destination);
  try {
    return await getPlacesByCategory(destination, 'catering.restaurant', coordinates);
  } catch (error) {
    throw new Error(`Failed to fetch restaurants for destination: ${destination}. ${error.message}`);
  }
};

/**
 * Lightweight filter for tourist attractions to ensure data quality.
 */
const filterAttraction = (place) => {
  if (!place || !place.name) return false;
  
  const nameLower = place.name.toLowerCase();
  const addressLower = (place.address || '').toLowerCase();

  const foodStallWords = [
    'street food', 'food stall', 'street stall', 'tea stall', 'tea shop', 'coffee shop',
    'temporary vendor', 'vendor', 'stall', 'dhaba', 'canteen', 'eatery',
    'juice center', 'juice stall', 'momo stall', 'fast food', 'snack bar'
  ];

  const commercialWords = [
    'diagnostics', 'clinic', 'hospital', 'pharmacy', 'chemist', 'medical store',
    'supermarket', 'grocery', 'bazaar', 'retail', 'wholesale', 'agency',
    'office', 'consultancy', 'laundry', 'dry cleaner', 'salon', 'spa',
    'car wash', 'garage', 'auto repair', 'hardware store', 'tailor', 'boutique',
    'bank', 'atm', 'jewellers', 'stationery', 'mobile shop', 'telecom', 'optical'
  ];

  const businessWords = [
    'pvt ltd', 'ltd.', 'enterprise', 'solutions', 'associates', 'properties', 'builders',
    'infotech', 'technologies', 'consultants', 'courier', 'logistics', 'xerox'
  ];

  const accommodationWords = [
    'hotel', 'hostel', 'lodge', 'guest house', 'guesthouse', 'homestay', 'retreat',
    'resort', 'inn', 'motel', 'accommodation', 'מלון'
  ];

  const allExcludeWords = [
    ...foodStallWords,
    ...commercialWords,
    ...businessWords,
    ...accommodationWords
  ];

  for (const word of allExcludeWords) {
    if (nameLower.includes(word)) {
      return false;
    }
  }

  if (addressLower.includes('atm') || addressLower.includes('bank') || addressLower.includes('clinic')) {
    return false;
  }

  return true;
};

/**
 * Lightweight filter for activities to ensure they represent tourism-oriented experiences.
 */
const filterActivity = (place) => {
  if (!place || !place.name) return false;

  const nameLower = place.name.toLowerCase();

  const sportsFieldWords = [
    'playground', 'play ground', 'school ground', 'sports ground', 'training ground',
    'field', 'stadium', 'local stadium', 'cricket ground', 'football ground',
    'high school', 'secondary school', 'primary school', 'college', 'university',
    'sports club', 'gymkhana', 'recreation ground'
  ];

  for (const word of sportsFieldWords) {
    if (nameLower.includes(word)) {
      const exceptions = ['national', 'museum', 'historical', 'zoo', 'park', 'nature', 'reserve', 'garden'];
      const hasException = exceptions.some(exc => nameLower.includes(exc));
      if (!hasException) {
        return false;
      }
    }
  }

  return true;
};

/**
 * Fetches tourist attractions for a given destination
 *
 * @param {Object} [coordinates] - Optional coordinates
 * @returns {Promise<Array>} Normalized list of attractions
 */
export const getAttractions = async (destination, coordinates = null) => {
  validateDestination(destination);
  try {
    const rawPlaces = await getPlacesByCategory(
      destination,
      'tourism.attraction,tourism.sights,tourism.attraction.viewpoint,entertainment.museum,entertainment.culture.gallery,tourism.sights.memorial',
      coordinates
    );
    return rawPlaces.filter(filterAttraction);
  } catch (error) {
    throw new Error(`Failed to fetch attractions for destination: ${destination}. ${error.message}`);
  }
};

/**
 * Fetches activities for a given destination
 *
 * @param {string} destination - The name of the destination
 * @param {Object} [coordinates] - Optional coordinates
 * @returns {Promise<Array>} Normalized list of activities
 */
export const getActivities = async (destination, coordinates = null) => {
  validateDestination(destination);
  try {
    const rawPlaces = await getPlacesByCategory(
      destination,
      'leisure.park,leisure.park.garden,leisure.park.nature_reserve,entertainment.theme_park,entertainment.zoo,entertainment.aquarium,entertainment.water_park,entertainment.flying_fox,entertainment.planetarium,entertainment.culture.theatre,entertainment.culture,sport.golf_course,entertainment.activity_park.climbing',
      coordinates
    );
    return rawPlaces.filter(filterActivity);
  } catch (error) {
    throw new Error(`Failed to fetch activities for destination: ${destination}. ${error.message}`);
  }
};

/**
 * Fetches all category places in parallel using a single geocoding lookup.
 *
 * @param {string} destination - The target destination name
 * @returns {Promise<Object>} Object containing all category arrays
 */
export const fetchAllDestinationPlaces = async (destination) => {
  validateDestination(destination);
  try {
    const coordinates = await getDestinationCoordinates(destination);

    const [hotels, restaurants, attractions, activities] = await Promise.all([
      getHotels(destination, coordinates),
      getRestaurants(destination, coordinates),
      getAttractions(destination, coordinates),
      getActivities(destination, coordinates)
    ]);

    return {
      hotels,
      restaurants,
      attractions,
      activities
    };
  } catch (error) {
    throw new Error(`Failed to fetch all places for destination: ${destination}. ${error.message}`);
  }
};
