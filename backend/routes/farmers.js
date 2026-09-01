import express from 'express';
import Farmer from '../models/Farmer.js';
import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all farmers (with filtering and pagination)
// @route   GET /api/farmers
// @access  Private (Admin, Loan Officer)
router.get('/', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    const { search, village, district, crop } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { governmentId: { $regex: search, $options: 'i' } },
      ];
    }

    if (village) {
      query.village = { $regex: village, $options: 'i' };
    }

    if (district) {
      query.district = { $regex: district, $options: 'i' };
    }

    if (crop) {
      query.primaryCrop = { $regex: crop, $options: 'i' };
    }

    const farmers = await Farmer.find(query).sort({ createdAt: -1 });
    res.json(farmers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all farmer coordinates for mapping
// @route   GET /api/farmers/map/coords
// @access  Private (Admin, Loan Officer)
router.get('/map/coords', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  try {
    const farmers = await Farmer.find({}, 'name village district primaryCrop latitude longitude financialHealthScore');
    
    // Find active loans for risk mapping
    const loans = await Loan.find({ status: { $in: ['ACTIVE', 'DISBURSED'] } });
    
    const mapped = farmers.map(f => {
      const activeLoan = loans.find(l => l.farmerId.toString() === f._id.toString());
      return {
        _id: f._id,
        name: f.name,
        village: f.village,
        district: f.district,
        primaryCrop: f.primaryCrop,
        latitude: f.latitude,
        longitude: f.longitude,
        financialHealthScore: f.financialHealthScore,
        activeLoanAmount: activeLoan ? activeLoan.loanAmount : 0,
        riskLevel: activeLoan ? activeLoan.riskLevel : 'LOW',
      };
    });
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get farmer profile details with financial aggregates
// @route   GET /api/farmers/:id
// @access  Private (Admin, Loan Officer, or the Farmer themselves)
router.get('/:id', protect, async (req, res) => {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }

    // Role-based protection: Farmer can only see their own profile
    if (req.user.role === 'Farmer' && req.user._id.toString() !== farmer.userId.toString()) {
      return res.status(403).json({ message: 'Access denied to this profile' });
    }

    // Query loans and repayments to compute aggregates
    const loans = await Loan.find({ farmerId: farmer._id });
    const repayments = await Repayment.find({ farmerId: farmer._id });

    const activeLoans = loans.filter(l => ['ACTIVE', 'DISBURSED', 'APPROVED'].includes(l.status)).length;
    const completedLoans = loans.filter(l => l.status === 'CLOSED').length;
    
    // Aggregates
    const totalBorrowed = loans
      .filter(l => ['ACTIVE', 'DISBURSED', 'CLOSED'].includes(l.status))
      .reduce((sum, l) => sum + l.loanAmount, 0);

    const totalRepaid = repayments
      .filter(r => r.status === 'PAID')
      .reduce((sum, r) => sum + r.amount, 0);

    // Outstanding is (Total Borrowed + calculated interest) - Total Repaid
    // For simplicity: sum of remainingBalance of all ACTIVE/DISBURSED repayments that are unpaid
    const activeLoanIds = loans
      .filter(l => ['ACTIVE', 'DISBURSED'].includes(l.status))
      .map(l => l._id.toString());
      
    let outstandingBalance = 0;
    for (const loanId of activeLoanIds) {
      const loanRepays = repayments.filter(r => r.loanId.toString() === loanId);
      if (loanRepays.length > 0) {
        const unpaid = loanRepays.filter(r => r.status !== 'PAID').sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        if (unpaid.length > 0) {
          outstandingBalance += unpaid[0].remainingBalance + unpaid[0].principal;
        }
      }
    }

    if (outstandingBalance === 0 && activeLoans > 0) {
      outstandingBalance = loans
        .filter(l => ['ACTIVE', 'DISBURSED'].includes(l.status))
        .reduce((sum, l) => sum + l.loanAmount, 0) - totalRepaid;
      if (outstandingBalance < 0) outstandingBalance = 0;
    }

    const totalDueEMIs = repayments.filter(r => ['PAID', 'OVERDUE', 'DUE'].includes(r.status));
    const paidEMIs = repayments.filter(r => r.status === 'PAID');
    const repaymentPercentage = totalDueEMIs.length > 0
      ? Math.round((paidEMIs.length / totalDueEMIs.length) * 100)
      : 100;

    res.json({
      farmer,
      aggregates: {
        activeLoans,
        completedLoans,
        totalBorrowed,
        totalRepaid,
        outstandingBalance,
        repaymentPercentage,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    let farmer = await Farmer.findById(req.params.id);
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }

    // Protection
    if (req.user.role === 'Farmer' && req.user._id.toString() !== farmer.userId.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Exclude fields that shouldn't be edited directly (e.g. userId, financialHealthScore, governmentId)
    const updates = req.body;
    delete updates.userId;
    delete updates.financialHealthScore;
    delete updates.governmentId; // Aadhaar shouldn't change easily

    Object.assign(farmer, updates);
    const updatedFarmer = await farmer.save();
    res.json(updatedFarmer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
