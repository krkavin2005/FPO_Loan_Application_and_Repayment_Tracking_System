import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Document from '../models/Document.js';
import Farmer from '../models/Farmer.js';
import Loan from '../models/Loan.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

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

    const fullPath = path.resolve(doc.filePath);
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'Physical file not found on server storage' });
    }

    res.sendFile(fullPath);
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

    doc.verificationStatus = status;
    await doc.save();

    res.json({ message: `Document status updated to ${status}`, doc });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
