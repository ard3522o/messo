const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize, attachStudent } = require('../middleware/auth');
const ctrl = require('../controllers/studentsController');

const router = express.Router();
router.use(protect);

router.get('/meta/filters', authorize('admin'), ctrl.filterOptions);
router.patch('/me', authorize('student'), attachStudent, ctrl.updateMyProfile);

router.get('/', authorize('admin'), ctrl.listStudents);
router.post(
  '/',
  authorize('admin'),
  [
    body('studentId').trim().matches(/^[A-Za-z0-9]{6,15}$/).withMessage('Student ID must be 6–15 alphanumeric characters'),
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
    body('hostel').isIn(['Ganga', 'Yamuna', 'Saraswati', 'Narmada', 'Godavari', 'Kaveri']).withMessage('Invalid hostel'),
    body('roomNumber').trim().notEmpty().withMessage('Room number is required'),
    body('department').isIn(['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Metallurgy', 'Mathematics', 'Physics']).withMessage('Invalid department'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  ctrl.createStudent
);

router.get('/:id', authorize('admin'), [param('id').isMongoId().withMessage('Invalid student id')], validate, ctrl.getStudent);
router.patch('/:id', authorize('admin'), [param('id').isMongoId().withMessage('Invalid student id')], validate, ctrl.updateStudent);
router.delete('/:id', authorize('admin'), [param('id').isMongoId().withMessage('Invalid student id')], validate, ctrl.deleteStudent);

module.exports = router;
