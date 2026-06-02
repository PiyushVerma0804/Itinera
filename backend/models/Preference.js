import mongoose from 'mongoose';

const preferenceSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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
    timestamps: true,
  }
);

// Create compound unique index to guarantee one preference profile per user per trip
preferenceSchema.index({ trip: 1, user: 1 }, { unique: true });

const Preference = mongoose.model('Preference', preferenceSchema);

export default Preference;
