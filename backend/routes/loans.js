import express from 'express';
import Loan from '../models/Loan.js';
import Farmer from '../models/Farmer.js';
import Repayment from '../models/Repayment.js';
import Document from '../models/Document.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { protect,  authorize } from '../middleware/authMiddleware.js';
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

// @desc    Get all Loan Officers (for assignment dropdown)
// @route   GET /api/loans/officers
// @access  Private (Admin)
router.get('/officers', protect, authorize('Admin'), async (req, res) => {
  try {
    const officers = await User.find({ role: 'Loan Officer' }).select('name email _id');
    res.json(officers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

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
    
    // Check if farmer already has a pending or active loan application under process
    const hasPending = existingLoans.some(l => 
      ['PENDING', 'UNDER REVIEW', 'DOCUMENT VERIFICATION', 'DOCUMENT VERIFIED', 'RECOMMENDED', 'NEEDS_INFORMATION'].includes(l.status)
    );
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
      fundingSource: 'FPO_FUND',
      officerRecommendation: 'NONE',
      finalDecision: 'PENDING',
    });

    // Create Audit Log for Application Submission
    await AuditLog.create({
      loanId: loan._id,
      userId: req.user._id,
      action: 'APPLICATION_SUBMITTED',
      previousStatus: '',
      newStatus: 'PENDING',
      remarks: 'Farmer submitted digital loan application through the FPO platform.',
    });

    // Create Audit Log for Assessment Generation
    await AuditLog.create({
      loanId: loan._id,
      userId: req.user._id,
      action: 'ASSESSMENT_GENERATED',
      previousStatus: 'PENDING',
      newStatus: 'PENDING',
      remarks: `Decision-support assessment generated. Eligibility: ${assessment.eligibilityScore}/100, Default Risk: ${assessment.riskScore}% (${assessment.riskLevel}).`,
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
    const { status, riskLevel, assignedOnly, fundingSource } = req.query;
    let query = {};

    if (req.user.role === 'Farmer') {
      const farmer = await Farmer.findOne({ userId: req.user._id });
      if (!farmer) {
        return res.json([]);
      }
      query.farmerId = farmer._id;
    } else if (req.user.role === 'Loan Officer' && assignedOnly === 'true') {
      query.assignedOfficer = req.user._id;
    }

    if (status) {
      query.status = status;
    }

    if (fundingSource) {
      query.fundingSource = fundingSource;
    }

    if (riskLevel && req.user.role !== 'Farmer') {
      query.riskLevel = riskLevel;
    }

    const loans = await Loan.find(query)
      .populate('farmerId')
      .populate('assignedOfficer', 'name email')
      .populate('recommendedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('disbursedBy', 'name email')
      .sort({ createdAt: -1 });

    const loanIds = loans.map(l => l._id);
    const [documents, repayments] = await Promise.all([
      Document.find({ loanId: { $in: loanIds } }),
      Repayment.find({ loanId: { $in: loanIds } })
    ]);

    const docMap = {};
    documents.forEach(doc => {
      const lid = doc.loanId.toString();
      if (!docMap[lid]) docMap[lid] = [];
      docMap[lid].push(doc);
    });

    const repaymentMap = {};
    repayments.forEach(rep => {
      const lid = rep.loanId.toString();
      if (!repaymentMap[lid]) repaymentMap[lid] = [];
      repaymentMap[lid].push(rep);
    });

    const loansWithDetails = loans.map(l => {
      const obj = l.toObject();
      const docs = docMap[l._id.toString()] || [];
      const reps = repaymentMap[l._id.toString()] || [];
      obj.documents = docs;
      obj.repayments = reps;
      obj.hasOverdue = reps.some(r => r.status === 'OVERDUE');
      obj.overdueCount = reps.filter(r => r.status === 'OVERDUE').length;
      return obj;
    });

    res.json(loansWithDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get loan by ID details (repayments & audits)
// @route   GET /api/loans/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('farmerId')
      .populate('assignedOfficer', 'name email')
      .populate('recommendedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('disbursedBy', 'name email');

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
    let auditLogs = await AuditLog.find({ loanId: loan._id })
      .populate('userId', 'name role')
      .sort({ timestamp: -1 });

    // Fetch the risk factors dynamically for detail panel display
    const existingLoans = await Loan.find({ farmerId: loan.farmerId._id, _id: { $ne: loan._id } });
    const loanIds = existingLoans.map(l => l._id);
    const farmerRepayments = await Repayment.find({ loanId: { $in: loanIds } });
    const assessment = calculateRiskAndEligibility(loan.farmerId, loan.loanAmount, existingLoans, farmerRepayments);

    // If requester is Farmer, sanitize confidential internal officer remarks
    let sanitizedLoan = loan.toObject();
    if (req.user.role === 'Farmer') {
      // Farmers should see recommendation status but not internal officer notes
      sanitizedLoan.officerRecommendationRemarks = '';
      // Filter out internal officer notes from audit logs
      auditLogs = auditLogs.map(log => {
        const logObj = log.toObject();
        if (logObj.action === 'OFFICER_RECOMMENDATION' && logObj.remarks) {
          logObj.remarks = `Loan Officer completed verification and submitted recommendation: ${sanitizedLoan.officerRecommendation}`;
        }
        return logObj;
      });
    }

    res.json({
      loan: sanitizedLoan,
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

// @desc    Get repayments for a specific loan
// @route   GET /api/loans/:id/repayments
// @access  Private
router.get('/:id/repayments', protect, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    if (req.user.role === 'Farmer') {
      const farmer = await Farmer.findOne({ userId: req.user._id });
      if (!farmer || loan.farmerId.toString() !== farmer._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const repayments = await Repayment.find({ loanId: loan._id }).sort({ dueDate: 1 });
    res.json(repayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Assign Loan Application to a Loan Officer
// @route   POST /api/loans/:id/assign
// @access  Private (Admin only)
router.post('/:id/assign', protect, authorize('Admin'), async (req, res) => {
  const { assignedOfficer } = req.body;

  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan record not found' });
    }

    const officer = await User.findById(assignedOfficer);
    if (!officer || officer.role !== 'Loan Officer') {
      return res.status(400).json({ message: 'Selected user is not an authorized Loan Officer' });
    }

    loan.assignedOfficer = officer._id;
    loan.assignedAt = Date.now();
    if (loan.status === 'PENDING') {
      loan.status = 'UNDER REVIEW';
    }
    await loan.save();

    await AuditLog.create({
      loanId: loan._id,
      userId: req.user._id,
      action: 'OFFICER_ASSIGNED',
      previousStatus: 'PENDING',
      newStatus: loan.status,
      remarks: `Admin assigned application to Loan Officer ${officer.name} for verification.`,
    });

    const populatedLoan = await Loan.findById(loan._id)
      .populate('farmerId')
      .populate('assignedOfficer', 'name email');

    res.json({ message: `Loan successfully assigned to ${officer.name}`, loan: populatedLoan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Loan Officer begins document verification
// @route   POST /api/loans/:id/start-verification
// @access  Private (Loan Officer, Admin)
router.post('/:id/start-verification', protect, authorize('Loan Officer', 'Admin'), async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan record not found' });
    }

    if (req.user.role === 'Loan Officer' && loan.assignedOfficer && loan.assignedOfficer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only verify documents for loan applications assigned to you' });
    }

    if (loan.status === 'UNDER REVIEW') {
      loan.status = 'DOCUMENT VERIFICATION';
      await loan.save();

      await AuditLog.create({
        loanId: loan._id,
        userId: req.user._id,
        action: 'DOCUMENT_VERIFICATION_STARTED',
        previousStatus: 'UNDER REVIEW',
        newStatus: 'DOCUMENT VERIFICATION',
        remarks: `Document verification initiated by ${req.user.name} (${req.user.role}).`,
      });
    }

    res.json({ message: 'Document verification initiated', loan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Generate / Complete Decision-Support Assessment
// @route   POST /api/loans/:id/assess
// @access  Private (Loan Officer, Admin)
router.post('/:id/assess', protect, authorize('Loan Officer', 'Admin'), async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan record not found' });
    }

    const farmer = await Farmer.findById(loan.farmerId);
    const existingLoans = await Loan.find({ farmerId: loan.farmerId, _id: { $ne: loan._id } });
    const farmerRepayments = await Repayment.find({ farmerId: loan.farmerId });

    const assessment = calculateRiskAndEligibility(farmer, loan.loanAmount, existingLoans, farmerRepayments);
    loan.riskScore = assessment.riskScore;
    loan.riskLevel = assessment.riskLevel;
    loan.eligibilityScore = assessment.eligibilityScore;

    const previousStatus = loan.status;
    if (loan.status === 'DOCUMENT VERIFIED') {
      loan.status = 'ASSESSMENT COMPLETED';
    }
    await loan.save();

    await AuditLog.create({
      loanId: loan._id,
      userId: req.user._id,
      action: 'ASSESSMENT_GENERATED',
      previousStatus,
      newStatus: loan.status,
      remarks: `Decision-support assessment generated. Eligibility Score: ${assessment.eligibilityScore}/100, Default Risk: ${assessment.riskScore}% (${assessment.riskLevel}).`,
    });

    res.json({
      message: 'Decision-support assessment completed',
      loan,
      assessment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Submit Loan Officer Recommendation
// @route   POST /api/loans/:id/recommend
// @access  Private (Loan Officer only)
router.post('/:id/recommend', protect, authorize('Loan Officer'), async (req, res) => {
  const { recommendation, remarks } = req.body;

  const validRecommendations = ['RECOMMEND APPROVAL', 'RECOMMEND REJECTION', 'NEEDS ADDITIONAL INFORMATION'];
  if (!validRecommendations.includes(recommendation)) {
    return res.status(400).json({ message: 'Invalid recommendation type' });
  }

  if (!remarks || remarks.trim() === '') {
    return res.status(400).json({ message: 'Officer remarks are required when submitting a recommendation' });
  }

  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // Strictly verify current user is the assigned Loan Officer
    if (!loan.assignedOfficer || loan.assignedOfficer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only recommend loan applications assigned to you' });
    }

    // Check if loan is eligible for recommendation
    const nonEligible = ['APPROVED', 'DISBURSED', 'ACTIVE', 'CLOSED'];
    if (nonEligible.includes(loan.status)) {
      return res.status(400).json({ message: `Loan cannot be recommended in status: ${loan.status}` });
    }

    const previousStatus = loan.status;

    loan.officerRecommendation = recommendation;
    loan.officerRecommendationRemarks = remarks;
    loan.recommendedBy = req.user._id;
    loan.recommendedAt = Date.now();

    // Update workflow status
    if (recommendation === 'NEEDS ADDITIONAL INFORMATION') {
      loan.status = 'NEEDS_INFORMATION';
    } else {
      loan.status = 'RECOMMENDED';
    }

    await loan.save();

    await AuditLog.create({
      loanId: loan._id,
      userId: req.user._id,
      action: 'OFFICER_RECOMMENDATION',
      previousStatus,
      newStatus: loan.status,
      remarks: `Loan Officer recommendation submitted: "${recommendation}". Remarks: ${remarks}`,
    });

    const updatedLoan = await Loan.findById(loan._id)
      .populate('farmerId')
      .populate('assignedOfficer', 'name email')
      .populate('recommendedBy', 'name email');

    res.json({ message: 'Loan Officer recommendation successfully submitted', loan: updatedLoan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Submit Admin Final Decision
// @route   POST /api/loans/:id/decision
// @access  Private (Admin / Authorized FPO Approving Authority only)
router.post('/:id/decision', protect, authorize('Admin'), async (req, res) => {
  const { decision, remarks, fundingSource } = req.body;

  const validDecisions = ['APPROVED', 'REJECTED', 'NEEDS_INFORMATION'];
  if (!validDecisions.includes(decision)) {
    return res.status(400).json({ message: 'Invalid final decision' });
  }

  const validFundingSources = ['FPO_FUND', 'PARTNER_BANK', 'FINANCIAL_INSTITUTION', 'OTHER'];
  if (fundingSource && !validFundingSources.includes(fundingSource)) {
    return res.status(400).json({ message: 'Invalid funding source' });
  }

  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const previousStatus = loan.status;

    loan.finalDecision = decision;
    loan.finalDecisionRemarks = remarks || '';
    loan.approvedBy = req.user._id;
    loan.approvedAt = Date.now();
    
    if (fundingSource) {
      loan.fundingSource = fundingSource;
    }

    if (decision === 'APPROVED') {
      loan.status = 'APPROVED';
    } else if (decision === 'REJECTED') {
      loan.status = 'REJECTED';
    } else if (decision === 'NEEDS_INFORMATION') {
      loan.status = 'NEEDS_INFORMATION';
    }

    await loan.save();

    await AuditLog.create({
      loanId: loan._id,
      userId: req.user._id,
      action: 'ADMIN_DECISION',
      previousStatus,
      newStatus: loan.status,
      remarks: `Authorized FPO Approving Authority decision: ${decision}. Funding Source: ${loan.fundingSource}. Remarks: ${remarks || 'None provided.'}`,
    });

    const updatedLoan = await Loan.findById(loan._id)
      .populate('farmerId')
      .populate('assignedOfficer', 'name email')
      .populate('recommendedBy', 'name email')
      .populate('approvedBy', 'name email');

    res.json({ message: `Final FPO decision recorded as ${decision}`, loan: updatedLoan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Record Loan Disbursement (Admin only - digital recording of release of funds)
// @route   POST /api/loans/:id/disburse
// @access  Private (Admin only)
router.post('/:id/disburse', protect, authorize('Admin'), async (req, res) => {
  const { remarks, fundingSource } = req.body;

  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    // 1. Verify the loan is APPROVED
    if (loan.status !== 'APPROVED') {
      return res.status(400).json({ message: 'Only loans in APPROVED status can have disbursement recorded.' });
    }

    // 2. Verify fundingSource exists
    if (fundingSource) {
      loan.fundingSource = fundingSource;
    }
    if (!loan.fundingSource) {
      return res.status(400).json({ message: 'A designated funding source is required to record disbursement' });
    }

    // 3. Save disbursedBy and disbursedAt
    loan.disbursedBy = req.user._id;
    loan.disbursedAt = Date.now();

    // 4. Change status: APPROVED -> DISBURSED
    loan.status = 'DISBURSED';
    await loan.save();

    // 5. Create audit event: DISBURSEMENT_RECORDED (APPROVED -> DISBURSED)
    await AuditLog.create({
      loanId: loan._id,
      userId: req.user._id,
      action: 'DISBURSEMENT_RECORDED',
      previousStatus: 'APPROVED',
      newStatus: 'DISBURSED',
      remarks: remarks || `Disbursement recorded by FPO Approving Authority under funding source: ${loan.fundingSource}.`,
    });

    // Auto-generate Amortization Repayment Schedule if not present
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

    // 6. Explicitly transition the loan: DISBURSED -> ACTIVE
    loan.status = 'ACTIVE';
    await loan.save();

    // 7. Create separate audit event: LOAN_ACTIVATED (DISBURSED -> ACTIVE)
    await AuditLog.create({
      loanId: loan._id,
      userId: req.user._id,
      action: 'LOAN_ACTIVATED',
      previousStatus: 'DISBURSED',
      newStatus: 'ACTIVE',
      remarks: 'Loan activated for repayment monitoring. Amortization schedule active.',
    });

    const updatedLoan = await Loan.findById(loan._id)
      .populate('farmerId')
      .populate('assignedOfficer', 'name email')
      .populate('approvedBy', 'name email')
      .populate('disbursedBy', 'name email');

    res.json({ message: 'Loan disbursement recorded successfully and repayment tracking activated.', loan: updatedLoan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Transition Active loan into Repayment Monitoring
// @route   POST /api/loans/:id/start-monitoring
// @access  Private (Admin, Loan Officer)
router.post('/:id/start-monitoring', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({ message: 'Loan record not found' });
    }

    if (loan.status === 'ACTIVE') {
      loan.status = 'REPAYMENT MONITORING';
      await loan.save();

      await AuditLog.create({
        loanId: loan._id,
        userId: req.user._id,
        action: 'REPAYMENT_MONITORING_STARTED',
        previousStatus: 'ACTIVE',
        newStatus: 'REPAYMENT MONITORING',
        remarks: 'Active loan entered Repayment Monitoring stage. EMI installment tracking initiated.',
      });
    }

    res.json({ message: 'Loan transitioned to Repayment Monitoring', loan });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update loan status workflow directly (backward compatibility for general status tweaks)
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
      const allowedForOfficer = ['UNDER REVIEW', 'DOCUMENT VERIFICATION', 'DOCUMENT VERIFIED'];
      if (!allowedForOfficer.includes(status)) {
        return res.status(403).json({ message: 'Loan Officers must submit formal recommendations via /recommend. Final decisions and disbursements are reserved for Admin.' });
      }
    }

    loan.status = status;

    if (status === 'APPROVED' && req.user.role === 'Admin') {
      loan.approvedBy = req.user._id;
      loan.approvedAt = Date.now();
      loan.finalDecision = 'APPROVED';
    }

    if (status === 'DISBURSED' && req.user.role === 'Admin') {
      loan.disbursedBy = req.user._id;
      loan.disbursedAt = Date.now();
      loan.status = 'ACTIVE';
      
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
