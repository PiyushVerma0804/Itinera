import mongoose from 'mongoose';

/**
 * Reusable sub-schema for destination places (Hotels, Restaurants, Attractions, Activities)
 */
const placeSchema = new mongoose.Schema(
  {
    placeId: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    rating: {
      type: Number,
      min: 0,
      max: 5
    },
    userRatingsTotal: {
      type: Number,
      min: 0
    },
    priceLevel: {
      type: Number,
      min: 0,
      max: 4
    },
    address: {
      type: String,
      trim: true
    },
    location: {
      lat: {
        type: Number
      },
      lng: {
        type: Number
      }
    },
    openingHours: {
      type: [String],
      default: []
    },
    website: {
      type: String,
      trim: true
    },
    photoReferences: {
      type: [String],
      default: []
    }
  },
  {
    _id: false // Disable _id for the sub-schema to keep it lightweight and reusable
  }
);

/**
 * DestinationCache Schema
 */
const destinationCacheSchema = new mongoose.Schema(
  {
    destination: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    places: {
      hotels: {
        type: [placeSchema],
        default: []
      },
      restaurants: {
        type: [placeSchema],
        default: []
      },
      attractions: {
        type: [placeSchema],
        default: []
      },
      activities: {
        type: [placeSchema],
        default: []
      }
    },
    knowledge: {
      famousFoods: {
        type: [String],
        default: []
      },
      localExperiences: {
        type: [String],
        default: []
      },
      travelTips: {
        type: [String],
        default: []
      },
      seasonalAdvice: {
        type: [String],
        default: []
      }
    },
    metadata: {
      source: {
        type: String,
        default: 'geoapify_groq'
      },
      version: {
        type: Number,
        default: 1
      }
    },
    cacheInfo: {
      expiresAt: {
        type: Date
      },
      refreshCount: {
        type: Number,
        default: 0
      }
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

const DestinationCache = mongoose.model('DestinationCache', destinationCacheSchema);

export default DestinationCache;
