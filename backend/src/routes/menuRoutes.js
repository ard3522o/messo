const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/menuController');

const router = express.Router();
router.use(protect);

router.get('/week', ctrl.getWeek);
router.get('/today', ctrl.getToday);
router.get('/', ctrl.listMenus);

router.post(
  '/',
  authorize('admin'),
  [
    body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Date must be YYYY-MM-DD'),
    body('meals').isObject().withMessage('Meals object is required'),
  ],
  validate,
  ctrl.createMenu
);
router.post('/copy', authorize('admin'), ctrl.copyWeek);
router.get('/:date', [param('date').matches(/^\d{4}-\d{2}-\d{2}$/)], validate, ctrl.getMenuByDate);
router.patch('/:id', authorize('admin'), [param('id').isMongoId()], validate, ctrl.updateMenu);
router.patch('/:id/meals/:meal/availability', authorize('admin', 'manager'), ctrl.setMealAvailability);
router.delete('/:id', authorize('admin'), [param('id').isMongoId()], validate, ctrl.deleteMenu);

module.exports = router;
