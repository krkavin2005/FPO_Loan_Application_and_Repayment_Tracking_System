import express from 'express';
import Loan from '../models/Loan.js';
import Farmer from '../models/Farmer.js';
import Repayment from '../models/Repayment.js';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { calculateRiskAndEligibility } from '../services/riskEngine.js';

const router = express.Router();

// Helper to generate monthly repayment schedule using reducing balance formula
const generateRepaymentSchedule = (loanId, farmerId, principal, annualRate, durationMonths, startDate) => {
  const schedule = [];
  const monthlyRate = (annualRate / 12) / 100;
  
  // Calculate EMI: [P * r * (1 + r)^n] / [(1 + r)^n - 1]
  let emi = 0;
  if (monthlyRate === 0) {
    emi = principal / durationMonths;
  } else {
    emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) / 
          (Math.pow(1 + monthlyRate, durationMonths) - 1);
  }

  let remainingPrincipal = principal;
  let currentDate = new Date(startDate || Date.now());

  for (let i = 1; i <= durationMonths; i++) {
    const interestComponent = remainingPrincipal * monthlyRate;
    let principalComponent = emi - interestComponent;
    
    // For the last month, adjust to round off exactly to 0
    if (i === durationMonths) {
      principalComponent = remainingPrincipal;
    }

    remainingPrincipal -= principalComponent;
    
    // Advance due date by 1 month
    const dueDate = new Date(currentDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      loanId,
      farmerId,
      amount: Math.round((principalComponent + interestComponent) * 100) / 100,
      principal: Math.round(principalComponent * 100) / 100,
      interest: Math.round(interestComponent * 100) / 100,
      dueDate,
      status: 'UPCOMING',
      remainingBalance: Math.max(0, Math.round(remainingPrincipal * 100) / 100),
    });
  }

  return schedule;
};

// @desc    Apply for a new Loan
// @route   POST /api/loans
// @access  Private (Farmer)
router.post('/', protect, authorize('Farmer'), async (req, res) => {
  const { requestedAmount, purpose, duration } = req.body;

  try {
    const farmer = await Farmer.findOne({ userId: req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile must be created before applying for a loan' });
    }

    // Query active loans and repayments to evaluate risk
    const existingLoans = await Loan.find({ farmerId: farmer._id });
    
    // Check if farmer already has a pending or active loan to prevent multi-apply spam
    const hasPending = existingLoans.some(l => ['PENDING', 'UNDER REVIEW', 'DOCUMENT VERIFIED'].includes(l.status));
    if (hasPending) {
      return res.status(400).json({ message: 'You already have an active loan application under process.' });
    }

    const loanIds = existingLoans.map(l => l._id);
    const repayments = await Repayment.find({ loanId: { $in: loanIds } });

    // Calculate eligibility and default risk
    const assessment = calculateRiskAndEligibility(farmer, Number(requestedAmount), existingLoans, repayments);

    // Generate unique Loan ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const loanIdStr = `AL360-${Date.now().toString().slice(-4)}${randomSuffix}`;

    const loan = await Loan.create({
      loanId: loanIdStr,
      farmerId: farmer._id,
      loanAmount: Number(requestedAmount),
      purpose,
      duration: Number(duration),
      interestRate: 8.5, // Standard rate
      status: 'PENDING',
      riskScore: assessment.riskScore,
      riskLevel: assessment.riskLevel,
      eligibilityScore: assessment.eligibilityScore,
    });

    // Create Audit Log
    await AuditLog.create({
      loanId: loan._id,
      userId: req.user._id,
      action: 'SUBMITTED',
      previousStatus: '',
      newStatus: 'PENDING',
      remarks: 'Farmer submitted loan application online.',
    });

    res.status(201).json({ loan, factors: assessment.factors, recommendedMin: assessment.recommendedMin, recommendedMax: assessment.recommendedMax });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all loans
// @route   GET /api/loans
// @access  Private (Admin, Loan Officer, Farmer)
router.get('/', protect, async (req, res) => {
  try {
    const { status, riskLevel } = req.query;
    let query = {};

    if (req.user.role === 'Farmer') {
      const farmer = await Farmer.findOne({ userId: req.user._id });
      if (!farmer) {
        return res.json([]);
      }
      query.farmerId = farmer._id;
    }

    if (status) {
      query.status = status;
    }

    if (riskLevel && req.user.role !== 'Farmer') {
      query.riskLevel = riskLevel;
    }

    const loans = await Loan.find(query)
      .populate('farmerId')
      .sort({ createdAt: -1 });

    res.json(loans);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get loan by ID details (repayments & audits)
// @route   GET /api/loans/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).populate('farmerId');
    if (!loan) {
      return res.status(404).json({ message: 'Loan record not found' });
    }

    // Protection
    if (req.user.role === 'Farmer') {
      const farmer = await Farmer.findOne({ userId: req.user._id });
      if (!farmer || loan.farmerId._id.toString() !== farmer._id.toString()) {
        return res.status(403).json({ message: 'Access denied to this loan record' });
      }
    }

    const repayments = await Repayment.find({ loanId: loan._id }).sort({ dueDate: 1 });
    const auditLogs = await AuditLog.find({ loanId: loan._id }).populate('userId', 'name role').sort({ timestamp: -1 });

    // Fetch the risk factors dynamically for detail panel display
    const existingLoans = await Loan.find({ farmerId: loan.farmerId._id, _id: { $ne: loan._id } });
    const loanIds = existingLoans.map(l => l._id);
    const farmerRepayments = await Repayment.find({ loanId: { $in: loanIds } });
    const assessment = calculateRiskAndEligibility(loan.farmerId, loan.loanAmount, existingLoans, farmerRepayments);

    res.json({
      loan,
      repayments,
      auditLogs,
      assessmentFactors: assessment.factors,
      recommendedRange: {
        min: assessment.recommendedMin,
        max: assessment.recommendedMax
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update loan status workflow (e.g. Approve, reject, disburse)
// @route   PUT /api/loans/:id/status
// @access  Private (Admin, Loan Officer)
router.put('/:id/status', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  const { status, remarks } = req.body;

  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const previousStatus = loan.status;

    // Validate workflow transition limits
    if (req.user.role === 'Loan Officer') {
      // Loan Officers can move to UNDER REVIEW, DOCUMENT VERIFIED or recommend. Admin does final approve.
      const allowedForOfficer = ['UNDER REVIEW', 'DOCUMENT VERIFIED', 'REJECTED'];
      if (!allowedForOfficer.includes(status)) {
        return res.status(403).json({ message: 'Loan Officers can only review, verify docs, or recommend rejection. Admin approval required for actual disbursement.' });
      }
    }

    loan.status = status;

    if (status === 'APPROVED') {
      loan.approvedBy = req.user._id;
      loan.approvedAt = Date.now();
    }

    if (status === 'DISBURSED') {
      loan.disbursedAt = Date.now();
      loan.status = 'ACTIVE'; // Auto transition to active loan state once funds leave FPO
      
      // Auto-generate EMI Repayments
      const repaymentsExist = await Repayment.countDocuments({ loanId: loan._id });
      if (repaymentsExist === 0) {
        const schedule = generateRepaymentSchedule(
          loan._id,
          loan.farmerId,
          loan.loanAmount,
          loan.interestRate,
          loan.duration,
          Date.now()
        );
        await Repayment.insertMany(schedule);
      }
    }

    await loan.save();

    // Create Audit Log entry
    await AuditLog.create({
      loanId: loan._id,
      userId: req.user._id,
      action: 'STATUS_CHANGE',
      previousStatus,
      newStatus: loan.status,
      remarks: remarks || `Status updated from ${previousStatus} to ${loan.status}`,
    });

    res.json({ message: `Loan status successfully updated to ${loan.status}`, loan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
