import mongoose from 'mongoose';

const farmerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    governmentId: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    village: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    landArea: {
      type: Number, // In acres
      required: true,
    },
    ownershipType: {
      type: String,
      required: true,
      enum: ['Owned', 'Leased', 'Joint', 'Other'],
    },
    primaryCrop: {
      type: String,
      required: true,
    },
    secondaryCrop: {
      type: String,
      default: '',
    },
    annualIncome: {
      type: Number,
      required: true,
    },
    financialHealthScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);

const Farmer = mongoose.model('Farmer', farmerSchema);
export default Farmer;
