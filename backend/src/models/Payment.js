const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    invoiceNo: { type: String, required: true, unique: true },
    month: { type: String, required: true, match: /^\d{4}-\d{2}$/, index: true },
    amount: { type: Number, required: true, min: 0 },
    breakdown: {
      messFee: { type: Number, default: 0 },
      lateFee: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
    },
    status: { type: String, enum: ['paid', 'pending', 'unpaid'], default: 'unpaid', index: true },
    method: {
      type: String,
      enum: ['cash', 'upi', 'card', 'netbanking', 'gateway', 'none'],
      default: 'none',
    },
    transactionId: { type: String, default: '', trim: true },
    receiptNo: { type: String, default: '', sparse: true },
    paidAt: { type: Date },
    dueDate: { type: Date, required: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

paymentSchema.index({ student: 1, month: 1 }, { unique: true });
paymentSchema.index({ status: 1, month: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
