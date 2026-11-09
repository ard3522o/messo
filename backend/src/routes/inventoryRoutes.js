const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/inventoryController');

const router = express.Router();
router.use(protect);

router.get('/logs', authorize('admin', 'manager'), ctrl.listStockLogs);
router.get('/summary', authorize('admin', 'manager'), ctrl.inventorySummary);
router.get('/', authorize('admin', 'manager'), ctrl.listInventory);

router.post(
  '/',
  authorize('admin', 'manager'),
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Item name must be 2–80 characters'),
    body('unit').isIn(['kg', 'litre', 'pieces', 'packets']).withMessage('Invalid unit'),
    body('quantity').isFloat({ min: 0 }).withMessage('Quantity cannot be negative'),
  ],
  validate,
  ctrl.createItem
);
router.patch('/:id', authorize('admin', 'manager'), [param('id').isMongoId()], validate, ctrl.updateItem);
router.delete('/:id', authorize('admin', 'manager'), [param('id').isMongoId()], validate, ctrl.deleteItem);
router.post(
  '/:id/stock',
  authorize('admin', 'manager'),
  [
    param('id').isMongoId(),
    body('type').isIn(['purchase', 'consumption', 'wastage']).withMessage('Invalid stock type'),
    body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than zero'),
  ],
  validate,
  ctrl.recordStock
);

module.exports = router;
