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
        'DOCUMENT VERIFICATION',
        'DOCUMENT VERIFIED',
        'ASSESSMENT COMPLETED',
        'RECOMMENDED',
        'NEEDS_INFORMATION',
        'APPROVED',
        'REJECTED',
        'DISBURSED',
        'ACTIVE',
        'REPAYMENT MONITORING',
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
    fundingSource: {
      type: String,
      enum: ['FPO_FUND', 'PARTNER_BANK', 'FINANCIAL_INSTITUTION', 'OTHER'],
      default: 'FPO_FUND',
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAt: {
      type: Date,
    },
    officerRecommendation: {
      type: String,
      enum: ['RECOMMEND APPROVAL', 'RECOMMEND REJECTION', 'NEEDS ADDITIONAL INFORMATION', 'NONE'],
      default: 'NONE',
    },
    officerRecommendationRemarks: {
      type: String,
      default: '',
    },
    recommendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    recommendedAt: {
      type: Date,
    },
    finalDecision: {
      type: String,
      enum: ['APPROVED', 'REJECTED', 'NEEDS_INFORMATION', 'PENDING'],
      default: 'PENDING',
    },
    finalDecisionRemarks: {
      type: String,
      default: '',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    disbursedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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
