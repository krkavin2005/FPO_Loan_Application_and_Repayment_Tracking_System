import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

// Load routes
import authRoutes from './routes/auth.js';
import farmerRoutes from './routes/farmers.js';
import loanRoutes from './routes/loans.js';
import repaymentRoutes from './routes/repayments.js';
import documentRoutes from './routes/documents.js';
import analyticsRoutes from './routes/analytics.js';
import reportRoutes from './routes/reports.js';

// Init environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());

// API Base Routes
app.use('/api/auth', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/repayments', repaymentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);

// Root Check Endpoint
app.get('/', (req, res) => {
  res.json({ status: 'healthy', message: 'AgriLend360 Full-Stack API Server is operational.' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
