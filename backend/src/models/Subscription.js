const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    plan: { type: String, enum: ['monthly', 'quarterly', 'semester'], default: 'monthly' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active', index: true },
    autoRenew: { type: Boolean, default: false },
    mealsIncluded: {
      type: [{ type: String, enum: ['breakfast', 'lunch', 'snacks', 'dinner'] }],
      default: ['breakfast', 'lunch', 'snacks', 'dinner'],
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

subscriptionSchema.index({ student: 1, status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
