const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    meal: { type: String, enum: ['breakfast', 'lunch', 'snacks', 'dinner'], required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true, maxlength: 1000 },
    tags: {
      type: [{ type: String, enum: ['Taste', 'Quantity', 'Hygiene', 'Variety', 'Service'] }],
      default: [],
    },
    isAnonymous: { type: Boolean, default: false },
  },
  { timestamps: true }
);

feedbackSchema.index({ student: 1, date: 1, meal: 1 }, { unique: true });
feedbackSchema.index({ date: 1, meal: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
