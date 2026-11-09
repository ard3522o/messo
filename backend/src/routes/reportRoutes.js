const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/reportsController');

const router = express.Router();
router.use(protect, authorize('admin', 'manager'));
router.get('/:type', ctrl.generateReport);

module.exports = router;
