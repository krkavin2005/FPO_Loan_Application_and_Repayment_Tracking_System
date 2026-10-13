import express from 'express';
import Farmer from '../models/Farmer.js';
import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get dashboard KPI summaries & charts data for FPO Loan Portfolio
// @route   GET /api/analytics/dashboard
// @access  Private (Admin, Loan Officer)
router.get('/dashboard', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    // 1. KPI Summaries
    const totalFarmers = await Farmer.countDocuments({});
    const totalLoanApplications = await Loan.countDocuments({});
    const approvedLoans = await Loan.countDocuments({ status: { $in: ['APPROVED', 'DISBURSED', 'ACTIVE', 'REPAYMENT MONITORING', 'CLOSED'] } });
    
    const activeLoansQuery = await Loan.find({ status: { $in: ['ACTIVE', 'DISBURSED', 'REPAYMENT MONITORING'] } });
    const totalActiveLoans = activeLoansQuery.length;
    
    const disbursedLoansQuery = await Loan.find({ status: { $in: ['ACTIVE', 'DISBURSED', 'REPAYMENT MONITORING', 'CLOSED'] } });
    const totalDisbursedAmount = disbursedLoansQuery.reduce((sum, l) => sum + l.loanAmount, 0);

    const paidRepaymentsQuery = await Repayment.find({ status: 'PAID' });
    const totalRepaymentsAmount = paidRepaymentsQuery.reduce((sum, r) => sum + r.amount, 0);
    const totalPrincipalRepaid = paidRepaymentsQuery.reduce((sum, r) => sum + r.principal, 0);

    // Outstanding = Disbursed Principal - Principal Repaid
    let outstandingAmount = totalDisbursedAmount - totalPrincipalRepaid;
    if (outstandingAmount < 0) outstandingAmount = 0;

    // Overdue Repayments Amount
    const overdueRepayments = await Repayment.find({ status: 'OVERDUE' });
    const overdueAmount = overdueRepayments.reduce((sum, r) => sum + r.amount, 0);

    // High risk active loans count (HIGH or CRITICAL)
    const highRiskFarmers = activeLoansQuery.filter(l => ['HIGH', 'CRITICAL'].includes(l.riskLevel)).length;

    // Pending reviews and decisions
    const pendingOfficerReviews = await Loan.countDocuments({
      status: { $in: ['PENDING', 'UNDER REVIEW', 'DOCUMENT VERIFICATION', 'DOCUMENT VERIFIED', 'ASSESSMENT COMPLETED'] },
    });
    const pendingAdminDecisions = await Loan.countDocuments({ status: 'RECOMMENDED' });

    // 2. Charts Data
    // A. Loan status distribution
    const statusDistribution = await Loan.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // B. Funding source distribution
    const fundingSourceDistribution = await Loan.aggregate([
      {
        $group: {
          _id: '$fundingSource',
          totalAmount: { $sum: '$loanAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // C. Approval vs Rejection distribution
    const approvalRejectionDistribution = await Loan.aggregate([
      {
        $group: {
          _id: '$finalDecision',
          count: { $sum: 1 },
          totalAmount: { $sum: '$loanAmount' }
        }
      }
    ]);

    // D. Crop-wise loan distribution
    const cropDistribution = await Loan.aggregate([
      {
        $lookup: {
          from: 'farmers',
          localField: 'farmerId',
          foreignField: '_id',
          as: 'farmer'
        }
      },
      { $unwind: '$farmer' },
      {
        $group: {
          _id: '$farmer.primaryCrop',
          totalAmount: { $sum: '$loanAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // E. Risk level distribution for ACTIVE loans
    const riskDistribution = await Loan.aggregate([
      { $match: { status: { $in: ['ACTIVE', 'DISBURSED'] } } },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);

    // F. District-wise farmer count
    const regionDistribution = await Farmer.aggregate([
      { $group: { _id: '$district', count: { $sum: 1 } } }
    ]);

    // G. Monthly disbursement over time
    const monthlyDisbursements = await Loan.aggregate([
      { $match: { status: { $in: ['ACTIVE', 'DISBURSED', 'CLOSED'] }, disbursedAt: { $ne: null } } },
      {
        $group: {
          _id: {
            year: { $year: '$disbursedAt' },
            month: { $month: '$disbursedAt' }
          },
          amount: { $sum: '$loanAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // H. Monthly repayments received over time
    const monthlyRepayments = await Repayment.aggregate([
      { $match: { status: 'PAID', paymentDate: { $ne: null } } },
      {
        $group: {
          _id: {
            year: { $year: '$paymentDate' },
            month: { $month: '$paymentDate' }
          },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      kpis: {
        totalFarmers,
        totalLoanApplications,
        approvedLoans,
        totalActiveLoans,
        totalDisbursedAmount,
        totalRepaymentsAmount,
        outstandingAmount,
        overdueAmount,
        highRiskFarmers,
        pendingOfficerReviews,
        pendingAdminDecisions,
      },
      charts: {
        statusDistribution,
        fundingSourceDistribution,
        approvalRejectionDistribution,
        cropDistribution,
        riskDistribution,
        regionDistribution,
        monthlyDisbursements,
        monthlyRepayments,
        overdueCount: overdueRepayments.length,
        overdueAmount,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get risk-focused analytics
// @route   GET /api/analytics/risk
// @access  Private (Admin, Loan Officer)
router.get('/risk', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    const riskBreakdown = await Loan.aggregate([
      { $group: { _id: '$riskLevel', count: { $sum: 1 }, totalAmount: { $sum: '$loanAmount' } } }
    ]);
    const overdueRepayments = await Repayment.find({ status: 'OVERDUE' })
      .populate('farmerId', 'name mobile village')
      .populate('loanId', 'loanId riskLevel loanAmount');

    res.json({ riskBreakdown, overdueRepayments });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get crop distribution analytics
// @route   GET /api/analytics/crops
// @access  Private (Admin, Loan Officer)
router.get('/crops', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    const cropDistribution = await Loan.aggregate([
      {
        $lookup: {
          from: 'farmers',
          localField: 'farmerId',
          foreignField: '_id',
          as: 'farmer'
        }
      },
      { $unwind: '$farmer' },
      {
        $group: {
          _id: '$farmer.primaryCrop',
          totalAmount: { $sum: '$loanAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(cropDistribution);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
