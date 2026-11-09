const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    studentId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    hostel: {
      type: String,
      required: true,
      enum: ['Ganga', 'Yamuna', 'Saraswati', 'Narmada', 'Godavari', 'Kaveri'],
      index: true,
    },
    roomNumber: { type: String, required: true, trim: true, uppercase: true },
    department: {
      type: String,
      required: true,
      enum: ['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Metallurgy', 'Mathematics', 'Physics'],
      index: true,
    },
    year: { type: Number, min: 1, max: 5, default: 1 },
    messCardId: { type: String, unique: true, sparse: true },
    messType: { type: String, enum: ['veg', 'non-veg'], default: 'veg' },
    dietaryPreference: { type: String, enum: ['veg', 'non-veg', 'vegan'], default: 'veg' },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'inactive',
      index: true,
    },
    joinedOn: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

studentSchema.index({ name: 'text', studentId: 'text', email: 'text' });
studentSchema.index({ hostel: 1, roomNumber: 1 });

studentSchema.virtual('fullRoom').get(function fullRoom() {
  return `${this.hostel} - ${this.roomNumber}`;
});

studentSchema.set('toJSON', { virtuals: true });
studentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);
