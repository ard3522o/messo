const mongoose = require('mongoose');

const stockLogSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true, index: true },
    itemName: { type: String, required: true },
    type: { type: String, enum: ['purchase', 'consumption', 'wastage'], required: true, index: true },
    quantity: { type: Number, required: true, min: 0.01 },
    unit: { type: String, default: 'kg' },
    unitCost: { type: Number, min: 0, default: 0 },
    totalCost: { type: Number, min: 0, default: 0 },
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/, index: true },
    meal: { type: String, enum: ['breakfast', 'lunch', 'snacks', 'dinner', 'general'], default: 'general' },
    note: { type: String, default: '', trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

stockLogSchema.index({ date: -1, type: 1 });

module.exports = mongoose.model('StockLog', stockLogSchema);
