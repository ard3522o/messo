const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: ['veg', 'non-veg', 'vegan'], default: 'veg' },
    calories: { type: Number, min: 0, default: 0 },
    image: { type: String, default: '' },
  },
  { _id: true }
);

const mealSchema = new mongoose.Schema(
  {
    items: { type: [menuItemSchema], default: [] },
    startTime: { type: String, default: '07:30' },
    endTime: { type: String, default: '09:30' },
    price: { type: Number, min: 0, default: 0 },
    notes: { type: String, default: '', trim: true },
    isAvailable: { type: Boolean, default: true },
  },
  { _id: false }
);

const menuSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    meals: {
      breakfast: { type: mealSchema, default: () => ({}) },
      lunch: { type: mealSchema, default: () => ({}) },
      snacks: { type: mealSchema, default: () => ({}) },
      dinner: { type: mealSchema, default: () => ({}) },
    },
    specialNote: { type: String, default: '', trim: true },
    isPublished: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Menu', menuSchema);
