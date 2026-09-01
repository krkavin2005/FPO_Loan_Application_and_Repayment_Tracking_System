import express from 'express';
import User from '../models/User.js';
import Farmer from '../models/Farmer.js';
import generateToken from '../utils/generateToken.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Register a new Farmer
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  const {
    name,
    email,
    password,
    mobile,
    governmentId,
    address,
    village,
    district,
    state,
    latitude,
    longitude,
    landArea,
    ownershipType,
    primaryCrop,
    secondaryCrop,
    annualIncome,
  } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create User record first
    const user = await User.create({
      name,
      email,
      password,
      role: 'Farmer',
    });

    if (user) {
      try {
        // Create Farmer profile mapping to the User
        const farmer = await Farmer.create({
          userId: user._id,
          name,
          mobile,
          governmentId,
          address,
          village,
          district,
          state,
          latitude: Number(latitude),
          longitude: Number(longitude),
          landArea: Number(landArea),
          ownershipType,
          primaryCrop,
          secondaryCrop: secondaryCrop || '',
          annualIncome: Number(annualIncome),
          financialHealthScore: 60, // Baseline start
        });

        res.status(201).json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          token: generateToken(user._id),
          farmerProfile: farmer,
        });
      } catch (err) {
        // Rollback user creation if Farmer creation fails
        await User.findByIdAndDelete(user._id);
        console.error('Error creating Farmer profile during registration:', err);
        return res.status(400).json({ message: 'Failed to create farmer profile details: ' + err.message });
      }
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Find farmer profile if role is Farmer
      let farmerProfile = null;
      if (user.role === 'Farmer') {
        farmerProfile = await Farmer.findOne({ userId: user._id });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
        farmerProfile,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      let farmerProfile = null;
      if (user.role === 'Farmer') {
        farmerProfile = await Farmer.findOne({ userId: user._id });
      }
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        farmerProfile,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
