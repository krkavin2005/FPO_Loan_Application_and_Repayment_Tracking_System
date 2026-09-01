import express from 'express';
import Repayment from '../models/Repayment.js';
import Loan from '../models/Loan.js';
import Farmer from '../models/Farmer.js';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { calculateFinancialHealthScore } from '../services/financialHealth.js';

const router = express.Router();

// @desc    Record a payment for an EMI installment
// @route   POST /api/repayments/:id/pay
// @access  Private (Admin, Loan Officer)
router.post('/:id/pay', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    const repayment = await Repayment.findById(req.params.id);
    if (!repayment) {
      return res.status(404).json({ message: 'Repayment installment not found' });
    }

    if (repayment.status === 'PAID') {
      return res.status(400).json({ message: 'This EMI installment has already been paid.' });
    }

    // Mark as paid
    repayment.status = 'PAID';
    repayment.paymentDate = Date.now();
    await repayment.save();

    // Query all repayments for this loan to see if it's fully closed
    const allRepayments = await Repayment.find({ loanId: repayment.loanId }).sort({ dueDate: 1 });
    const unpaidRepayments = allRepayments.filter(r => r.status !== 'PAID');

    const loan = await Loan.findById(repayment.loanId);
    
    // Create Audit Log for payment receipt
    await AuditLog.create({
      loanId: loan._id,
      userId: req.user._id,
      action: 'REPAYMENT',
      previousStatus: loan.status,
      newStatus: loan.status,
      remarks: `Recorded repayment EMI of ₹${repayment.amount}. Remaining unpaid EMIs: ${unpaidRepayments.length}`,
    });

    if (unpaidRepayments.length === 0) {
      // Loan is fully paid! Change status to CLOSED
      const prevStatus = loan.status;
      loan.status = 'CLOSED';
      await loan.save();

      // Log closure
      await AuditLog.create({
        loanId: loan._id,
        userId: req.user._id,
        action: 'STATUS_CHANGE',
        previousStatus: prevStatus,
        newStatus: 'CLOSED',
        remarks: 'Loan fully settled. Closed automatically.',
      });
    }

    // Now recalculate farmer's Financial Health Score!
    const farmer = await Farmer.findById(repayment.farmerId);
    if (farmer) {
      const farmerLoans = await Loan.find({ farmerId: farmer._id });
      const farmerRepayments = await Repayment.find({ farmerId: farmer._id });

      const health = calculateFinancialHealthScore(farmer, farmerLoans, farmerRepayments);
      farmer.financialHealthScore = health.score;
      await farmer.save();
    }

    res.json({
      message: 'Repayment recorded successfully',
      repayment,
      loanClosed: unpaidRepayments.length === 0,
    });
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
