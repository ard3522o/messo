const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    content: { type: String, required: true, trim: true, maxlength: 3000 },
    category: {
      type: String,
      enum: ['General', 'Menu', 'Payment', 'Holiday', 'Urgent'],
      default: 'General',
      index: true,
    },
    audience: {
      type: String,
      enum: ['all', 'students', 'staff'],
      default: 'all',
      index: true,
    },
    isPinned: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true, index: true },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    publishedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

announcementSchema.index({ publishedAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
