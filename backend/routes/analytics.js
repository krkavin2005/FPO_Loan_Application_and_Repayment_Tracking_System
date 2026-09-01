import express from 'express';
import Farmer from '../models/Farmer.js';
import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get dashboard KPI summaries & charts data
// @route   GET /api/analytics/dashboard
// @access  Private (Admin, Loan Officer)
router.get('/dashboard', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    // 1. KPI Summaries
    const totalFarmers = await Farmer.countDocuments({});
    
    const activeLoansQuery = await Loan.find({ status: { $in: ['ACTIVE', 'DISBURSED'] } });
    const totalActiveLoans = activeLoansQuery.length;
    
    const disbursedLoansQuery = await Loan.find({ status: { $in: ['ACTIVE', 'DISBURSED', 'CLOSED'] } });
    const totalDisbursedAmount = disbursedLoansQuery.reduce((sum, l) => sum + l.loanAmount, 0);

    const paidRepaymentsQuery = await Repayment.find({ status: 'PAID' });
    const totalRepaymentsAmount = paidRepaymentsQuery.reduce((sum, r) => sum + r.amount, 0);
    const totalPrincipalRepaid = paidRepaymentsQuery.reduce((sum, r) => sum + r.principal, 0);

    // Outstanding = Disbursed Principal - Principal Repaid
    let outstandingAmount = totalDisbursedAmount - totalPrincipalRepaid;
    if (outstandingAmount < 0) outstandingAmount = 0;

    // High risk active loans count (HIGH or CRITICAL)
    const highRiskFarmers = activeLoansQuery.filter(l => ['HIGH', 'CRITICAL'].includes(l.riskLevel)).length;

    // 2. Charts Data
    // A. Loan status distribution
    const statusDistribution = await Loan.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // B. Crop-wise loan distribution
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

    // C. Risk level distribution for ACTIVE loans
    const riskDistribution = await Loan.aggregate([
      { $match: { status: { $in: ['ACTIVE', 'DISBURSED'] } } },
      { $group: { _id: '$riskLevel', count: { $sum: 1 } } }
    ]);

    // D. District-wise farmer count
    const regionDistribution = await Farmer.aggregate([
      { $group: { _id: '$district', count: { $sum: 1 } } }
    ]);

    // E. Monthly disbursement over time (Past 12 months)
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

    // F. Monthly repayments received over time
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
        totalActiveLoans,
        totalDisbursedAmount,
        totalRepaymentsAmount,
        outstandingAmount,
        highRiskFarmers,
      },
      charts: {
        statusDistribution,
        cropDistribution,
        riskDistribution,
        regionDistribution,
        monthlyDisbursements,
        monthlyRepayments,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
