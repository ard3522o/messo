const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit Indian mobile number'),
    body('studentId').trim().matches(/^[A-Za-z0-9]{6,15}$/).withMessage('Student ID must be 6–15 alphanumeric characters'),
    body('hostel').isIn(['Ganga', 'Yamuna', 'Saraswati', 'Narmada', 'Godavari', 'Kaveri']).withMessage('Select a valid hostel'),
    body('roomNumber').trim().isLength({ min: 1, max: 10 }).withMessage('Room number is required'),
    body('department').isIn(['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Metallurgy', 'Mathematics', 'Physics']).withMessage('Select a valid department'),
    body('year').optional().isInt({ min: 1, max: 5 }).withMessage('Year must be between 1 and 5'),
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  ctrl.login
);

router.get('/me', protect, ctrl.me);
router.patch(
  '/profile',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2–80 characters'),
    body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Enter a valid 10-digit mobile number'),
  ],
  validate,
  ctrl.updateProfile
);
router.patch(
  '/password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  ctrl.changePassword
);

module.exports = router;
