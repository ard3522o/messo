const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize, attachStudent } = require('../middleware/auth');
const ctrl = require('../controllers/paymentsController');

const router = express.Router();
router.use(protect);

router.get('/me', authorize('student'), attachStudent, ctrl.listMyPayments);
router.get('/summary', authorize('admin'), ctrl.getPaymentSummary);
router.post('/generate', authorize('admin'), ctrl.generateInvoices);

router.get('/', authorize('admin'), ctrl.listPayments);
router.post(
  '/',
  authorize('admin'),
  [
    body('studentId').isMongoId().withMessage('Select a valid student'),
    body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be YYYY-MM'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Amount must be positive'),
  ],
  validate,
  ctrl.createPayment
);

router.get('/:id/receipt', [param('id').isMongoId()], validate, attachStudent, ctrl.downloadReceipt);
router.post(
  '/:id/pay',
  [param('id').isMongoId(), body('method').optional().isIn(['cash', 'upi', 'card', 'netbanking', 'gateway'])],
  validate,
  attachStudent,
  ctrl.payInvoice
);
router.patch('/:id', authorize('admin'), [param('id').isMongoId()], validate, ctrl.updatePayment);
router.delete('/:id', authorize('admin'), [param('id').isMongoId()], validate, ctrl.deletePayment);

module.exports = router;
