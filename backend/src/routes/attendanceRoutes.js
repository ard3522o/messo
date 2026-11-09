const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize, attachStudent } = require('../middleware/auth');
const ctrl = require('../controllers/attendanceController');

const router = express.Router();
router.use(protect);

router.get('/me', authorize('student'), attachStudent, ctrl.getMyAttendance);
router.get('/me/today', authorize('student'), attachStudent, ctrl.getMyToday);
router.post(
  '/check-in',
  authorize('student'),
  attachStudent,
  [body('token').notEmpty().withMessage('QR token is required')],
  validate,
  ctrl.checkIn
);

router.get('/summary', authorize('admin', 'manager'), ctrl.getDailySummary);
router.get('/trend', authorize('admin', 'manager'), ctrl.getTrend);
router.get('/requirements', authorize('admin', 'manager'), ctrl.getMealRequirements);
router.post('/qr', authorize('admin', 'manager'), [body('meal').isIn(['breakfast', 'lunch', 'snacks', 'dinner'])], validate, ctrl.generateMealQR);

router.get('/', authorize('admin', 'manager'), ctrl.listAttendance);
router.post(
  '/',
  authorize('admin', 'manager'),
  [
    body('studentId').isMongoId().withMessage('Select a valid student'),
    body('meal').isIn(['breakfast', 'lunch', 'snacks', 'dinner']).withMessage('Invalid meal'),
    body('date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Invalid date'),
    body('status').optional().isIn(['present', 'absent']),
  ],
  validate,
  ctrl.markAttendance
);
router.delete('/:id', authorize('admin', 'manager'), [param('id').isMongoId()], validate, ctrl.deleteAttendance);

module.exports = router;
