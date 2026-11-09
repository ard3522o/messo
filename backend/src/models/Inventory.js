const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: {
      type: String,
      enum: ['Grains', 'Vegetables', 'Dairy', 'Spices', 'Oil & Fats', 'Beverages', 'Other'],
      default: 'Other',
      index: true,
    },
    unit: { type: String, enum: ['kg', 'litre', 'pieces', 'packets'], default: 'kg' },
    quantity: { type: Number, min: 0, default: 0 },
    minThreshold: { type: Number, min: 0, default: 10 },
    unitPrice: { type: Number, min: 0, default: 0 },
    supplier: { type: String, default: '', trim: true },
    lastRestockedAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

inventorySchema.virtual('isLowStock').get(function isLowStock() {
  return this.quantity <= this.minThreshold;
});

inventorySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Inventory', inventorySchema);
