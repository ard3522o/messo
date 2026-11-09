const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize, attachStudent } = require('../middleware/auth');
const ctrl = require('../controllers/feedbackController');

const router = express.Router();
router.use(protect);

router.get('/me', authorize('student'), attachStudent, ctrl.listMyFeedback);
router.get('/summary', authorize('admin', 'manager'), ctrl.feedbackSummary);
router.get('/', authorize('admin', 'manager'), ctrl.listFeedback);

router.post(
  '/',
  authorize('student'),
  attachStudent,
  [
    body('meal').isIn(['breakfast', 'lunch', 'snacks', 'dinner']).withMessage('Invalid meal'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isLength({ max: 1000 }).withMessage('Comment is too long'),
  ],
  validate,
  ctrl.submitFeedback
);
router.delete('/:id', [param('id').isMongoId()], validate, attachStudent, ctrl.deleteFeedback);

module.exports = router;
