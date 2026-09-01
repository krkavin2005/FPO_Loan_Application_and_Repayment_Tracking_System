import express from 'express';
import Farmer from '../models/Farmer.js';
import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get loan applications report dataset
// @route   GET /api/reports/loans
// @access  Private (Admin, Loan Officer)
router.get('/loans', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    const loans = await Loan.find({}).populate('farmerId', 'name village district primaryCrop');
    
    const reportData = loans.map(l => ({
      loanId: l.loanId,
      farmerName: l.farmerId ? l.farmerId.name : 'Unknown',
      village: l.farmerId ? l.farmerId.village : 'N/A',
      crop: l.farmerId ? l.farmerId.primaryCrop : 'N/A',
      amount: l.loanAmount,
      purpose: l.purpose,
      duration: `${l.duration} months`,
      status: l.status,
      riskScore: `${l.riskScore}%`,
      riskLevel: l.riskLevel,
      eligibilityScore: `${l.eligibilityScore}/100`,
      appliedAt: new Date(l.createdAt).toLocaleDateString(),
    }));

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get repayments history report dataset
// @route   GET /api/reports/repayments
// @access  Private (Admin, Loan Officer)
router.get('/repayments', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    const repayments = await Repayment.find({})
      .populate('farmerId', 'name village mobile')
      .populate('loanId', 'loanId');

    const reportData = repayments.map(r => ({
      loanId: r.loanId ? r.loanId.loanId : 'N/A',
      farmerName: r.farmerId ? r.farmerId.name : 'Unknown',
      mobile: r.farmerId ? r.farmerId.mobile : 'N/A',
      village: r.farmerId ? r.farmerId.village : 'N/A',
      emiAmount: r.amount,
      principal: r.principal,
      interest: r.interest,
      dueDate: new Date(r.dueDate).toLocaleDateString(),
      status: r.status,
      paymentDate: r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : '-',
    }));

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get farmer profiles report dataset
// @route   GET /api/reports/farmers
// @access  Private (Admin, Loan Officer)
router.get('/farmers', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    const farmers = await Farmer.find({});
    const loans = await Loan.find({});
    const repayments = await Repayment.find({});

    const reportData = farmers.map(f => {
      const fLoans = loans.filter(l => l.farmerId.toString() === f._id.toString());
      const fRepayments = repayments.filter(r => r.farmerId.toString() === f._id.toString());

      const activeCount = fLoans.filter(l => ['ACTIVE', 'DISBURSED'].includes(l.status)).length;
      const totalBorrowed = fLoans
        .filter(l => ['ACTIVE', 'DISBURSED', 'CLOSED'].includes(l.status))
        .reduce((sum, l) => sum + l.loanAmount, 0);
      const totalRepaid = fRepayments
        .filter(r => r.status === 'PAID')
        .reduce((sum, r) => sum + r.amount, 0);

      return {
        name: f.name,
        mobile: f.mobile,
        village: f.village,
        district: f.district,
        state: f.state,
        landArea: `${f.landArea} acres`,
        crop: f.primaryCrop,
        income: f.annualIncome,
        financialScore: f.financialHealthScore,
        activeLoansCount: activeCount,
        totalBorrowed,
        totalRepaid,
        outstanding: Math.max(0, totalBorrowed - totalRepaid),
      };
    });

    res.json(reportData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get overdue and risk warnings report dataset
// @route   GET /api/reports/risk-alerts
// @access  Private (Admin, Loan Officer)
router.get('/risk-alerts', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    const overdueRepayments = await Repayment.find({ status: 'OVERDUE' })
      .populate('farmerId', 'name mobile village')
      .populate('loanId', 'loanId riskLevel');

    const highRiskLoans = await Loan.find({ 
      status: { $in: ['ACTIVE', 'DISBURSED'] }, 
      riskLevel: { $in: ['HIGH', 'CRITICAL'] } 
    }).populate('farmerId', 'name mobile village');

    const alerts = [];

    // Overdue EMI alerts
    overdueRepayments.forEach(r => {
      alerts.push({
        farmerName: r.farmerId ? r.farmerId.name : 'Unknown',
        mobile: r.farmerId ? r.farmerId.mobile : 'N/A',
        village: r.farmerId ? r.farmerId.village : 'N/A',
        loanId: r.loanId ? r.loanId.loanId : 'N/A',
        alertType: 'Overdue Repayment',
        riskLevel: r.loanId ? r.loanId.riskLevel : 'MEDIUM',
        details: `EMI of ₹${r.amount} was due on ${new Date(r.dueDate).toLocaleDateString()}`,
      });
    });

    // High risk active loan alerts (if not already included by overdue)
    highRiskLoans.forEach(l => {
      const hasOverdue = overdueRepayments.some(r => r.loanId && r.loanId._id.toString() === l._id.toString());
      if (!hasOverdue) {
        alerts.push({
          farmerName: l.farmerId ? l.farmerId.name : 'Unknown',
          mobile: l.farmerId ? l.farmerId.mobile : 'N/A',
          village: l.farmerId ? l.farmerId.village : 'N/A',
          loanId: l.loanId,
          alertType: 'High Default Prediction',
          riskLevel: l.riskLevel,
          details: `System calculated default probability of ${l.riskScore}%`,
        });
      }
    });

    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
