import mongoose from 'mongoose';

const repaymentSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
    },
    farmerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    principal: {
      type: Number,
      required: true,
    },
    interest: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date, // Present only if status is PAID
    },
    dueDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['PAID', 'UPCOMING', 'DUE', 'OVERDUE'],
      default: 'UPCOMING',
    },
    remainingBalance: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Repayment = mongoose.model('Repayment', repaymentSchema);
export default Repayment;
