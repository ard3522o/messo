const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, paginated } = require('../utils/response');
const { getPagination, escapeRegex } = require('../utils/helpers');
const { toDateKey, toMonthKey } = require('../utils/dates');
const Inventory = require('../models/Inventory');
const StockLog = require('../models/StockLog');

// GET /api/inventory
const listInventory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 15 });
  const { search = '', category, lowStock } = req.query;

  const filter = { isActive: true };
  if (search.trim()) filter.name = new RegExp(escapeRegex(search.trim()), 'i');
  if (category) filter.category = category;
  if (lowStock === 'true') filter.$expr = { $lte: ['$quantity', '$minThreshold'] };

  const [items, total] = await Promise.all([
    Inventory.find(filter).sort({ category: 1, name: 1 }).skip(skip).limit(limit),
    Inventory.countDocuments(filter),
  ]);

  return paginated(res, { items, total, page, limit });
});

// GET /api/inventory/summary
const inventorySummary = asyncHandler(async (req, res) => {
  const month = req.query.month || toMonthKey();
  const [items, byCategory, monthLogs] = await Promise.all([
    Inventory.find({ isActive: true }),
    Inventory.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 }, value: { $sum: { $multiply: ['$quantity', '$unitPrice'] } } } },
    ]),
    StockLog.aggregate([
      { $match: { date: { $regex: `^${month}` } } },
      { $group: { _id: '$type', quantity: { $sum: '$quantity' }, cost: { $sum: '$totalCost' } } },
    ]),
  ]);

  const lowStock = items.filter((i) => i.quantity <= i.minThreshold);
  const logMap = Object.fromEntries(monthLogs.map((l) => [l._id, l]));

  return sendSuccess(res, {
    month,
    totalItems: items.length,
    stockValue: Math.round(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)),
    lowStockCount: lowStock.length,
    lowStock: lowStock.slice(0, 8),
    byCategory,
    purchases: logMap.purchase || { quantity: 0, cost: 0 },
    consumption: logMap.consumption || { quantity: 0, cost: 0 },
    wastage: logMap.wastage || { quantity: 0, cost: 0 },
  });
});

// POST /api/inventory
const createItem = asyncHandler(async (req, res) => {
  const { name, category, unit, quantity, minThreshold, unitPrice, supplier } = req.body;
  if (await Inventory.findOne({ name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') })) {
    throw ApiError.conflict('An inventory item with this name already exists');
  }
  const item = await Inventory.create({
    name: name.trim(),
    category,
    unit,
    quantity: Number(quantity) || 0,
    minThreshold: Number(minThreshold) || 0,
    unitPrice: Number(unitPrice) || 0,
    supplier,
    lastRestockedAt: Number(quantity) > 0 ? new Date() : undefined,
  });

  if (item.quantity > 0) {
    await StockLog.create({
      item: item._id,
      itemName: item.name,
      type: 'purchase',
      quantity: item.quantity,
      unit: item.unit,
      unitCost: item.unitPrice,
      totalCost: item.quantity * item.unitPrice,
      date: toDateKey(),
      note: 'Opening stock',
      recordedBy: req.user._id,
    });
  }
  return sendSuccess(res, item, 'Inventory item added', undefined, 201);
});

// PATCH /api/inventory/:id
const updateItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw ApiError.notFound('Inventory item not found');
  ['name', 'category', 'unit', 'minThreshold', 'unitPrice', 'supplier', 'isActive'].forEach((field) => {
    if (req.body[field] !== undefined) item[field] = req.body[field];
  });
  await item.save();
  return sendSuccess(res, item, 'Inventory item updated');
});

// DELETE /api/inventory/:id
const deleteItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw ApiError.notFound('Inventory item not found');
  await StockLog.deleteMany({ item: item._id });
  await item.deleteOne();
  return sendSuccess(res, null, 'Inventory item removed');
});

// POST /api/inventory/:id/stock
const recordStock = asyncHandler(async (req, res) => {
  const { type, quantity, unitCost = 0, date = toDateKey(), meal = 'general', note = '', supplier } = req.body;
  if (!['purchase', 'consumption', 'wastage'].includes(type)) throw ApiError.badRequest('Invalid stock entry type');

  const item = await Inventory.findById(req.params.id);
  if (!item) throw ApiError.notFound('Inventory item not found');

  const qty = Number(quantity);
  if (qty <= 0) throw ApiError.badRequest('Quantity must be greater than zero');
  if (type !== 'purchase' && item.quantity < qty) {
    throw ApiError.badRequest(`Only ${item.quantity} ${item.unit} of ${item.name} is available`);
  }

  if (type === 'purchase') {
    item.quantity += qty;
    item.lastRestockedAt = new Date();
    if (supplier) item.supplier = supplier;
    if (Number(unitCost) > 0) item.unitPrice = Number(unitCost);
  } else {
    item.quantity = Number((item.quantity - qty).toFixed(3));
  }
  await item.save();

  const log = await StockLog.create({
    item: item._id,
    itemName: item.name,
    type,
    quantity: qty,
    unit: item.unit,
    unitCost: Number(unitCost),
    totalCost: Number(unitCost) * qty,
    date,
    meal,
    note,
    recordedBy: req.user._id,
  });

  return sendSuccess(res, { item, log }, 'Stock entry recorded', undefined, 201);
});

// GET /api/inventory/logs
const listStockLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 15 });
  const { type, from, to, item } = req.query;

  const filter = {};
  if (type) filter.type = type;
  if (item) filter.item = item;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to) filter.date.$lte = to;
  }

  const [items, total] = await Promise.all([
    StockLog.find(filter).populate('item', 'unit category').sort({ createdAt: -1 }).skip(skip).limit(limit),
    StockLog.countDocuments(filter),
  ]);
  return paginated(res, { items, total, page, limit });
});

module.exports = {
  listInventory,
  inventorySummary,
  createItem,
  updateItem,
  deleteItem,
  recordStock,
  listStockLogs,
};
