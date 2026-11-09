const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/announcementsController');

const router = express.Router();
router.use(protect);

router.get('/', ctrl.listAnnouncements);
router.post(
  '/',
  authorize('admin'),
  [
    body('title').trim().isLength({ min: 4, max: 140 }).withMessage('Title must be 4–140 characters'),
    body('content').trim().isLength({ min: 10, max: 3000 }).withMessage('Content must be 10–3000 characters'),
    body('category').optional().isIn(['General', 'Menu', 'Payment', 'Holiday', 'Urgent']),
    body('audience').optional().isIn(['all', 'students', 'staff']),
  ],
  validate,
  ctrl.createAnnouncement
);
router.patch('/:id', authorize('admin'), [param('id').isMongoId()], validate, ctrl.updateAnnouncement);
router.delete('/:id', authorize('admin'), [param('id').isMongoId()], validate, ctrl.deleteAnnouncement);

module.exports = router;
