import mongoose from 'mongoose';
import crypto from 'crypto';

const tripSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    inviteCode: {
      type: String,
      unique: true,
      required: true,
      default: () => crypto.randomBytes(6).toString('hex'),
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

const Trip = mongoose.model('Trip', tripSchema);

export default Trip;
