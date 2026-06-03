import DestinationCache from '../models/DestinationCache.js';
import { fetchAllDestinationPlaces } from './placesService.js';
import { getDestinationKnowledge } from './destinationKnowledgeService.js';

const CACHE_DURATION_DAYS = 7;
const CACHE_DURATION_MS = CACHE_DURATION_DAYS * 24 * 60 * 60 * 1000;

/**
 * Validates the destination input parameter.
 *
 * @param {string} destination - The target destination name
 * @throws {Error} If destination is invalid
 */
const validateDestination = (destination) => {
  if (!destination || typeof destination !== 'string' || destination.trim() === '') {
    throw new Error('Destination is required');
  }
};

/**
 * Generates a clean URL slug from the destination name.
 *
 * @param {string} destination - The destination name
 * @returns {string} The formatted slug
 */
const generateSlug = (destination) => {
  return destination
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
};

/**
 * Checks if a cached destination document is still valid.
 *
 * @param {Object} cacheDocument - The cache document from database
 * @returns {boolean} True if cache is valid, false otherwise
 */
const isCacheValid = (cacheDocument) => {
  if (!cacheDocument) return false;
  if (!cacheDocument.cacheInfo || !cacheDocument.cacheInfo.expiresAt) return false;

  const now = new Date();
  const expiresAt = new Date(cacheDocument.cacheInfo.expiresAt);
  return now < expiresAt;
};

/**
 * Fetches fresh intelligence data in parallel from external APIs.
 *
 * @param {string} destination - The destination name
 * @returns {Promise<Object>} Object containing places and knowledge data
 */
const fetchFreshDestinationIntelligence = async (destination) => {
  const [placesData, knowledge] = await Promise.all([
    fetchAllDestinationPlaces(destination),
    getDestinationKnowledge(destination)
  ]);

  return {
    places: {
      hotels: placesData.hotels || [],
      restaurants: placesData.restaurants || [],
      attractions: placesData.attractions || [],
      activities: placesData.activities || []
    },
    knowledge
  };
};

/**
 * Creates or updates the cached destination document.
 *
 * @param {string} destination - The destination name
 * @param {string} slug - The generated slug
 * @param {Object} intelligence - The fresh intelligence data to store
 * @returns {Promise<Object>} The updated/created database document
 */
const upsertDestinationCache = async (destination, slug, intelligence) => {
  const expiresAt = new Date(Date.now() + CACHE_DURATION_MS);

  let cacheDoc = await DestinationCache.findOne({ slug });

  if (cacheDoc) {
    cacheDoc.destination = destination; // Keep capitalization/naming current
    cacheDoc.places = intelligence.places;
    cacheDoc.knowledge = intelligence.knowledge;
    cacheDoc.metadata = {
      source: 'geoapify_groq',
      version: 1
    };
    cacheDoc.cacheInfo = {
      expiresAt,
      refreshCount: (cacheDoc.cacheInfo?.refreshCount || 0) + 1
    };
    cacheDoc.lastUpdated = new Date();
    await cacheDoc.save();
  } else {
    cacheDoc = new DestinationCache({
      destination,
      slug,
      places: intelligence.places,
      knowledge: intelligence.knowledge,
      metadata: {
        source: 'geoapify_groq',
        version: 1
      },
      cacheInfo: {
        expiresAt,
        refreshCount: 0
      },
      lastUpdated: new Date()
    });
    await cacheDoc.save();
  }

  return cacheDoc;
};

/**
 * Formats a cache document into the clean public output structure.
 *
 * @param {Object} cacheDoc - The Mongoose cache document
 * @returns {Object} Clean normalized intelligence response object
 */
const formatIntelligenceResponse = (cacheDoc) => {
  return {
    destination: cacheDoc.destination,
    places: {
      hotels: cacheDoc.places?.hotels || [],
      restaurants: cacheDoc.places?.restaurants || [],
      attractions: cacheDoc.places?.attractions || [],
      activities: cacheDoc.places?.activities || []
    },
    knowledge: {
      famousFoods: cacheDoc.knowledge?.famousFoods || [],
      localExperiences: cacheDoc.knowledge?.localExperiences || [],
      travelTips: cacheDoc.knowledge?.travelTips || [],
      seasonalAdvice: cacheDoc.knowledge?.seasonalAdvice || []
    },
    lastUpdated: cacheDoc.lastUpdated
  };
};

/**
 * Retrieves destination intelligence, serving from cache if valid
 * or fetching fresh data and updating the cache if invalid or missing.
 *
 * @param {string} destination - The target destination
 * @returns {Promise<Object>} Normalized destination intelligence data
 */
export const getDestinationIntelligence = async (destination) => {
  validateDestination(destination);

  try {
    const slug = generateSlug(destination);
    const cacheDoc = await DestinationCache.findOne({ slug });

    if (isCacheValid(cacheDoc)) {
      return formatIntelligenceResponse(cacheDoc);
    }

    const intelligence = await fetchFreshDestinationIntelligence(destination);
    const updatedDoc = await upsertDestinationCache(destination, slug, intelligence);

    return formatIntelligenceResponse(updatedDoc);
  } catch (error) {
    throw new Error(`Failed to generate destination intelligence for ${destination}. ${error.message}`);
  }
};
