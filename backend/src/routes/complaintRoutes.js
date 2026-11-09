const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize, attachStudent } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const ctrl = require('../controllers/complaintsController');

const router = express.Router();
router.use(protect);

router.get('/me', authorize('student'), attachStudent, ctrl.listMyComplaints);
router.get('/stats', authorize('admin', 'manager'), ctrl.complaintStats);
router.get('/', authorize('admin', 'manager'), ctrl.listComplaints);

router.post(
  '/',
  authorize('student'),
  attachStudent,
  upload.array('images', 3),
  [
    body('category').isIn(['Food Quality', 'Hygiene', 'Staff Behaviour', 'Menu', 'Other']).withMessage('Select a valid category'),
    body('subject').trim().isLength({ min: 4, max: 120 }).withMessage('Subject must be 4–120 characters'),
    body('description').trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be 10–2000 characters'),
    body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  ],
  validate,
  ctrl.createComplaint
);

router.patch(
  '/:id',
  authorize('admin'),
  [param('id').isMongoId(), body('status').optional().isIn(['open', 'in_progress', 'resolved', 'rejected'])],
  validate,
  ctrl.updateComplaint
);
router.delete('/:id', [param('id').isMongoId()], validate, attachStudent, ctrl.deleteComplaint);

module.exports = router;
