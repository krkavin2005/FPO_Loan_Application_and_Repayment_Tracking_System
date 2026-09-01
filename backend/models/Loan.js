import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema(
  {
    loanId: {
      type: String,
      required: true,
      unique: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
    },
    loanAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    purpose: {
      type: String,
      required: true,
      enum: ['Seeds', 'Fertilizer', 'Equipment', 'Irrigation', 'Livestock', 'Crop cultivation', 'Other'],
    },
    duration: {
      type: Number, // duration in months
      required: true,
      min: 1,
    },
    interestRate: {
      type: Number, // annual interest rate percentage
      required: true,
      default: 8.5,
    },
    status: {
      type: String,
      required: true,
      enum: [
        'PENDING',
        'UNDER REVIEW',
        'DOCUMENT VERIFIED',
        'APPROVED',
        'REJECTED',
        'DISBURSED',
        'ACTIVE',
        'CLOSED',
      ],
      default: 'PENDING',
    },
    riskScore: {
      type: Number, // default prediction probability (0-100)
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'LOW',
    },
    eligibilityScore: {
      type: Number, // assessment score (0-100)
      default: 0,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    disbursedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate or pre-save middleware to assign custom alphanumeric loan ID if needed
// Let's handle generation in the controller / seed script to keep it simple and bulletproof

const Loan = mongoose.model('Loan', loanSchema);
export default Loan;
