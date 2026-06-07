import mongoose from 'mongoose';

/**
 * Reusable Location Schema for activities
 */
const locationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: '',
      trim: true,
    },
    lat: {
      type: Number,
      default: null,
    },
    lng: {
      type: Number,
      default: null,
    },
  },
  {
    _id: false,
  }
);

/**
 * Reusable Activity Schema for daily timeline events
 */
const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    location: {
      type: locationSchema,
      default: () => ({ name: '', lat: null, lng: null }),
      set: function (val) {
        // Maintain backwards compatibility: convert plain string locations to the location object format
        if (typeof val === 'string') {
          return { name: val, lat: null, lng: null };
        }
        return val;
      },
    },
    category: {
      type: String,
      required: true,
      enum: ['travel', 'food', 'sightseeing', 'activity', 'accommodation', 'leisure'],
      trim: true,
    },
    startTime: {
      type: String,
      trim: true,
    },
    endTime: {
      type: String,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    _id: false, // Keep the sub-schema lightweight
  }
);

/**
 * Reusable Day Schema for grouping daily activities and costs
 */
const daySchema = new mongoose.Schema(
  {
    dayNumber: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    estimatedCost: {
      type: Number,
      default: 0,
    },
    activities: {
      type: [activitySchema],
      default: [],
    },
  },
  {
    _id: false, // Keep the sub-schema lightweight
  }
);

/**
 * Reusable Budget Summary Schema
 */
const budgetSummarySchema = new mongoose.Schema(
  {
    accommodation: {
      type: Number,
      default: 0,
    },
    food: {
      type: Number,
      default: 0,
    },
    transport: {
      type: Number,
      default: 0,
    },
    activities: {
      type: Number,
      default: 0,
    },
    miscellaneous: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false, // Keep the sub-schema lightweight
  }
);

/**
 * Reusable Preference Snapshot Schema
 * Captures a point-in-time state of the user's travel preferences.
 */
const preferenceSnapshotSchema = new mongoose.Schema(
  {
    budgetRange: {
      type: String,
      enum: ['Budget', 'Moderate', 'Premium'],
      default: 'Moderate',
    },
    travelStyle: {
      type: String,
      enum: ['Relaxed', 'Adventure', 'Mixed', 'Exploration', 'Luxury'],
      default: 'Mixed',
    },
    foodPreferences: {
      type: [String],
      default: [],
    },
    activityPreferences: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    _id: false,
  }
);

/**
 * Reusable AI Generation Metadata Schema
 */
const generationMetadataSchema = new mongoose.Schema(
  {
    model: {
      type: String,
      default: 'unknown',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

/**
 * Itinerary Database Schema
 */
const itinerarySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    tripDuration: {
      type: Number,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    travelers: {
      type: Number,
      required: true,
      default: 1,
    },
    /*
     * A snapshot is used instead of a direct reference to the Preference model.
     * Reasoning: Itineraries must preserve the exact preferences they were generated with
     * for future auditability and exact regeneration, regardless of whether the user
     * edits their global preferences profile later.
     */
    preferenceSnapshot: {
      type: preferenceSnapshotSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ['draft', 'generated', 'modified', 'finalized'],
      default: 'draft',
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    parentItinerary: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Itinerary',
      default: null,
    },
    generationMetadata: {
      type: generationMetadataSchema,
      default: () => ({}),
    },
    budgetSummary: {
      type: budgetSummarySchema,
      default: () => ({}),
    },
    days: {
      type: [daySchema],
      default: [],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

export default Itinerary;
