const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    meal: { type: String, enum: ['breakfast', 'lunch', 'snacks', 'dinner'], required: true, index: true },
    status: { type: String, enum: ['present', 'absent'], default: 'present' },
    method: { type: String, enum: ['qr', 'manual', 'self'], default: 'qr' },
    markedAt: { type: Date, default: Date.now },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// A student can record a given meal only once per day.
attendanceSchema.index({ student: 1, date: 1, meal: 1 }, { unique: true });
attendanceSchema.index({ date: 1, meal: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
