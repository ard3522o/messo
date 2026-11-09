const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaintNo: { type: String, required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ['Food Quality', 'Hygiene', 'Staff Behaviour', 'Menu', 'Other'],
      index: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    images: { type: [String], default: [] },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'rejected'],
      default: 'open',
      index: true,
    },
    response: {
      message: { type: String, default: '' },
      by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: { type: Date },
    },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
