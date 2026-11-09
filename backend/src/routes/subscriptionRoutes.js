const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/subscriptionsController');

const router = express.Router();
router.use(protect, authorize('admin'));

router.get('/', ctrl.listSubscriptions);
router.post(
  '/',
  [
    body('studentId').isMongoId().withMessage('Select a valid student'),
    body('plan').optional().isIn(['monthly', 'quarterly', 'semester']),
    body('amount').optional().isFloat({ min: 0 }),
  ],
  validate,
  ctrl.createSubscription
);
router.patch('/:id', [param('id').isMongoId()], validate, ctrl.updateSubscription);
router.delete('/:id', [param('id').isMongoId()], validate, ctrl.deleteSubscription);

module.exports = router;
