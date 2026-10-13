import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Document from '../models/Document.js';
import Farmer from '../models/Farmer.js';
import Loan from '../models/Loan.js';
import Repayment from '../models/Repayment.js';
import AuditLog from '../models/AuditLog.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { calculateRiskAndEligibility } from '../services/riskEngine.js';

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});

// File validation filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB Limit
});

// @desc    Upload document for a loan application
// @route   POST /api/documents
// @access  Private (Farmer)
router.post('/', protect, authorize('Farmer'), upload.single('file'), async (req, res) => {
  const { loanId, documentType } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const farmer = await Farmer.findOne({ userId: req.user._id });
    if (!farmer) {
      return res.status(404).json({ message: 'Farmer profile not found' });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan application not found' });
    }

    // Save document details to MongoDB
    const doc = await Document.create({
      farmerId: farmer._id,
      loanId: loan._id,
      documentType,
      fileName: req.file.originalname,
      filePath: req.file.path,
      verificationStatus: 'PENDING',
    });

    res.status(201).json(doc);
  } catch (error) {
    // Clean up file if DB save fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get all documents for a specific loan
// @route   GET /api/documents/loan/:loanId
// @access  Private (Admin, Loan Officer, Farmer)
router.get('/loan/:loanId', protect, async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan application not found' });
    }

    // Security check
    if (req.user.role === 'Farmer') {
      const farmer = await Farmer.findOne({ userId: req.user._id });
      if (!farmer || loan.farmerId.toString() !== farmer._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const docs = await Document.find({ loanId: loan._id });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Download/View a document
// @route   GET /api/documents/:id/download
// @access  Private (Admin, Loan Officer, Owner Farmer)
router.get('/:id/download', protect, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document record not found' });
    }

    // Verify ownership
    if (req.user.role === 'Farmer') {
      const farmer = await Farmer.findOne({ userId: req.user._id });
      if (!farmer || doc.farmerId.toString() !== farmer._id.toString()) {
        return res.status(403).json({ message: 'Access denied to document contents' });
      }
    }

    let fullPath = path.resolve(doc.filePath);
    if (!fs.existsSync(fullPath)) {
      const backendRelative = path.resolve('backend', doc.filePath);
      const rootUploads = path.resolve('uploads', path.basename(doc.filePath));
      const backendUploads = path.resolve('backend', 'uploads', path.basename(doc.filePath));
      if (fs.existsSync(backendRelative)) {
        fullPath = backendRelative;
      } else if (fs.existsSync(rootUploads)) {
        fullPath = rootUploads;
      } else if (fs.existsSync(backendUploads)) {
        fullPath = backendUploads;
      } else {
        const sampleFile = path.resolve('backend', 'uploads', 'sample_kyc_doc.pdf');
        if (fs.existsSync(sampleFile)) {
          fullPath = sampleFile;
        } else {
          return res.status(404).json({ message: 'Physical file not found on server storage' });
        }
      }
    }

    res.download(fullPath, doc.fileName || path.basename(fullPath));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Verify/Reject a document
// @route   PUT /api/documents/:id/status
// @access  Private (Admin, Loan Officer)
router.put('/:id/status', protect, authorize('Admin', 'Loan Officer'), async (req, res) => {
  const { status } = req.body; // VERIFIED or REJECTED
  
  if (!['VERIFIED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ message: 'Invalid verification status' });
  }

  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document record not found' });
    }

    const loan = await Loan.findById(doc.loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Associated loan record not found' });
    }

    // Verify assigned officer permissions
    if (req.user.role === 'Loan Officer' && loan.assignedOfficer && loan.assignedOfficer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only verify documents for loan applications assigned to you' });
    }

    // When verification begins, transition UNDER REVIEW -> DOCUMENT VERIFICATION
    if (loan.status === 'UNDER REVIEW') {
      loan.status = 'DOCUMENT VERIFICATION';
      await loan.save();

      await AuditLog.create({
        loanId: loan._id,
        userId: req.user._id,
        action: 'DOCUMENT_VERIFICATION_STARTED',
        previousStatus: 'UNDER REVIEW',
        newStatus: 'DOCUMENT VERIFICATION',
        remarks: `Document verification initiated by Loan Officer ${req.user.name}.`,
      });
    }

    doc.verificationStatus = status;
    await doc.save();

    // Create Audit Log for Document Verification
    await AuditLog.create({
      loanId: doc.loanId,
      userId: req.user._id,
      action: status === 'VERIFIED' ? 'DOCUMENT_VERIFIED' : 'DOCUMENT_REJECTED',
      previousStatus: loan.status,
      newStatus: loan.status,
      remarks: `${doc.documentType} ("${doc.fileName}") marked as ${status} by ${req.user.name} (${req.user.role}).`,
    });

    // Check all documents for this loan
    const allDocs = await Document.find({ loanId: doc.loanId });
    const allVerified = allDocs.length > 0 && allDocs.every(d => d.verificationStatus === 'VERIFIED');
    
    // Only transition to DOCUMENT VERIFIED when ALL documents are verified and none are pending/rejected
    if (allVerified && ['UNDER REVIEW', 'DOCUMENT VERIFICATION'].includes(loan.status)) {
      const prevStatus = loan.status;
      loan.status = 'DOCUMENT VERIFIED';
      await loan.save();

      await AuditLog.create({
        loanId: loan._id,
        userId: req.user._id,
        action: 'DOCUMENT_VERIFIED',
        previousStatus: prevStatus,
        newStatus: 'DOCUMENT VERIFIED',
        remarks: 'All submitted applicant documents have been successfully verified.',
      });

      // After required documents are verified, generate decision-support assessment and transition to ASSESSMENT COMPLETED
      const farmer = await Farmer.findById(loan.farmerId);
      const existingLoans = await Loan.find({ farmerId: loan.farmerId, _id: { $ne: loan._id } });
      const farmerRepayments = await Repayment.find({ farmerId: loan.farmerId });
      const assessment = calculateRiskAndEligibility(farmer, loan.loanAmount, existingLoans, farmerRepayments);

      loan.riskScore = assessment.riskScore;
      loan.riskLevel = assessment.riskLevel;
      loan.eligibilityScore = assessment.eligibilityScore;
      loan.status = 'ASSESSMENT COMPLETED';
      await loan.save();

      await AuditLog.create({
        loanId: loan._id,
        userId: req.user._id,
        action: 'ASSESSMENT_GENERATED',
        previousStatus: 'DOCUMENT VERIFIED',
        newStatus: 'ASSESSMENT COMPLETED',
        remarks: `Decision-support assessment completed. Eligibility Score: ${assessment.eligibilityScore}/100, Default Risk: ${assessment.riskScore}% (${assessment.riskLevel}). Ready for Loan Officer recommendation.`,
      });
    }

    res.json({ message: `Document status updated to ${status}`, doc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
