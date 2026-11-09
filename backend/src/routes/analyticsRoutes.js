const express = require('express');
const { protect, authorize, attachStudent } = require('../middleware/auth');
const ctrl = require('../controllers/analyticsController');

const router = express.Router();
router.use(protect);

router.get('/admin/overview', authorize('admin'), ctrl.adminOverview);
router.get('/manager/overview', authorize('admin', 'manager'), ctrl.managerOverview);
router.get('/student/overview', authorize('student'), attachStudent, ctrl.studentOverview);

module.exports = router;
