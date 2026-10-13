import express from 'express';
import Repayment from '../models/Repayment.js';
import Loan from '../models/Loan.js';
import Farmer from '../models/Farmer.js';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { calculateFinancialHealthScore } from '../services/financialHealth.js';

const router = express.Router();

// Helper to process repayment
const processRepayment = async (repaymentId, user, res) => {
  const repayment = await Repayment.findById(repaymentId);
  if (!repayment) {
    return res.status(404).json({ message: 'Repayment installment not found' });
  }

  if (repayment.status === 'PAID') {
    return res.status(400).json({ message: 'This EMI installment has already been paid.' });
  }

  const loan = await Loan.findById(repayment.loanId);
  if (!loan) {
    return res.status(404).json({ message: 'Associated loan record not found' });
  }

  // When an ACTIVE loan enters repayment monitoring, transition: ACTIVE -> REPAYMENT MONITORING
  if (loan.status === 'ACTIVE') {
    loan.status = 'REPAYMENT MONITORING';
    await loan.save();

    await AuditLog.create({
      loanId: loan._id,
      userId: user._id,
      action: 'REPAYMENT_MONITORING_STARTED',
      previousStatus: 'ACTIVE',
      newStatus: 'REPAYMENT MONITORING',
      remarks: 'Active loan entered Repayment Monitoring stage as repayments commence.',
    });
  }

  // Mark as paid
  repayment.status = 'PAID';
  repayment.paymentDate = Date.now();
  await repayment.save();

  // Query all repayments for this loan
  const allRepayments = await Repayment.find({ loanId: repayment.loanId }).sort({ dueDate: 1 });
  const unpaidRepayments = allRepayments.filter(r => r.status !== 'PAID');
  const outstandingBalance = unpaidRepayments.reduce((sum, r) => sum + r.principal, 0);
  const overdueRepayments = allRepayments.filter(r => r.status === 'OVERDUE');
  const overdueAmount = overdueRepayments.reduce((sum, r) => sum + r.amount, 0);

  // Create Audit Log for payment receipt
  await AuditLog.create({
    loanId: loan._id,
    userId: user._id,
    action: 'REPAYMENT_RECORDED',
    previousStatus: loan.status,
    newStatus: loan.status,
    remarks: `Recorded repayment EMI of ₹${repayment.amount}. Remaining unpaid EMIs: ${unpaidRepayments.length}. Outstanding balance: ₹${outstandingBalance}.`,
  });

  // A loan must ONLY become CLOSED when:
  // - All EMI installments are PAID
  // - Outstanding balance = 0
  // - Overdue balance = 0
  // - No unpaid installment remains
  const canClose = unpaidRepayments.length === 0 && outstandingBalance === 0 && overdueAmount === 0;
  if (canClose && loan.status === 'REPAYMENT MONITORING') {
    loan.status = 'CLOSED';
    await loan.save();

    await AuditLog.create({
      loanId: loan._id,
      userId: user._id,
      action: 'LOAN_CLOSED',
      previousStatus: 'REPAYMENT MONITORING',
      newStatus: 'CLOSED',
      remarks: 'All scheduled EMIs settled. Outstanding balance = 0. Loan successfully closed.',
    });
  }

  // Recalculate farmer's Financial Health Score using real formula
  const farmer = await Farmer.findById(repayment.farmerId);
  if (farmer) {
    const farmerLoans = await Loan.find({ farmerId: farmer._id });
    const farmerRepayments = await Repayment.find({ farmerId: farmer._id });

    const health = calculateFinancialHealthScore(farmer, farmerLoans, farmerRepayments);
    farmer.financialHealthScore = health.score;
    await farmer.save();
  }

  return res.json({
    message: 'Repayment recorded successfully',
    repayment,
    outstandingBalance,
    unpaidCount: unpaidRepayments.length,
    loanClosed: loan.status === 'CLOSED',
    loanStatus: loan.status,
  });
};

// @desc    Record a payment for an EMI installment
// @route   POST /api/repayments/:id/pay
// @access  Private (Admin, Loan Officer)
router.post('/:id/pay', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    await processRepayment(req.params.id, req.user, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Record repayment (alternative POST /api/repayments)
// @route   POST /api/repayments
// @access  Private (Admin, Loan Officer)
router.post('/', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  const { repaymentId } = req.body;
  if (!repaymentId) {
    return res.status(400).json({ message: 'repaymentId is required' });
  }
  try {
    await processRepayment(repaymentId, req.user, res);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all repayments (with filter for overdue status)
// @route   GET /api/repayments
// @access  Private (Admin, Loan Officer)
router.get('/', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) {
      query.status = status;
    }

    const repayments = await Repayment.find(query)
      .populate('farmerId', 'name mobile village')
      .populate('loanId', 'loanId status')
      .sort({ dueDate: 1 });

    res.json(repayments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
