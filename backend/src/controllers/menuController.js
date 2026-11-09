const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { weekKeys, startOfWeekKey, toDateKey } = require('../utils/dates');
const Menu = require('../models/Menu');

const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'];

// GET /api/menus?from=&to=
const listMenus = asyncHandler(async (req, res) => {
  const from = req.query.from || startOfWeekKey();
  const to = req.query.to || toDateKey(new Date(new Date(`${from}T00:00:00`).getTime() + 6 * 86400000));
  if (req.query.all === 'true') {
    const menus = await Menu.find({ isPublished: true }).sort({ date: -1 }).limit(60);
    return sendSuccess(res, menus);
  }
  const menus = await Menu.find({ date: { $gte: from, $lte: to } }).sort({ date: 1 });
  return sendSuccess(res, menus);
});

// GET /api/menus/week?start=
const getWeek = asyncHandler(async (req, res) => {
  const start = req.query.start || startOfWeekKey();
  const keys = weekKeys(start);
  const menus = await Menu.find({ date: { $in: keys } });
  const byDate = new Map(menus.map((m) => [m.date, m]));
  const data = keys.map((date) => ({
    date,
    menu: byDate.get(date) || null,
  }));
  return sendSuccess(res, data, 'Weekly menu');
});

// GET /api/menus/today
const getToday = asyncHandler(async (req, res) => {
  const date = req.query.date || toDateKey();
  const menu = await Menu.findOne({ date });
  return sendSuccess(res, menu);
});

// GET /api/menus/:date
const getMenuByDate = asyncHandler(async (req, res) => {
  const menu = await Menu.findOne({ date: req.params.date });
  if (!menu) throw ApiError.notFound('No menu published for this date');
  return sendSuccess(res, menu);
});

// POST /api/menus
const createMenu = asyncHandler(async (req, res) => {
  const { date, meals, specialNote, isPublished } = req.body;
  if (await Menu.findOne({ date })) throw ApiError.conflict('A menu already exists for this date');

  const menu = await Menu.create({
    date,
    meals: meals || {},
    specialNote,
    isPublished: isPublished !== false,
    createdBy: req.user._id,
  });
  return sendSuccess(res, menu, 'Menu created', undefined, 201);
});

// PATCH /api/menus/:id
const updateMenu = asyncHandler(async (req, res) => {
  const menu = await Menu.findById(req.params.id);
  if (!menu) throw ApiError.notFound('Menu not found');

  if (req.body.date && req.body.date !== menu.date) {
    if (await Menu.findOne({ date: req.body.date })) throw ApiError.conflict('A menu already exists for that date');
    menu.date = req.body.date;
  }
  if (req.body.meals) {
    MEALS.forEach((meal) => {
      if (req.body.meals[meal]) menu.meals[meal] = req.body.meals[meal];
    });
  }
  if (req.body.specialNote !== undefined) menu.specialNote = req.body.specialNote;
  if (req.body.isPublished !== undefined) menu.isPublished = req.body.isPublished;
  menu.updatedBy = req.user._id;
  menu.markModified('meals');
  await menu.save();

  return sendSuccess(res, menu, 'Menu updated');
});

// PATCH /api/menus/:id/meals/:meal/availability
const setMealAvailability = asyncHandler(async (req, res) => {
  const { id, meal } = req.params;
  if (!MEALS.includes(meal)) throw ApiError.badRequest('Invalid meal');
  const menu = await Menu.findById(id);
  if (!menu) throw ApiError.notFound('Menu not found');
  menu.meals[meal].isAvailable = Boolean(req.body.isAvailable);
  menu.markModified('meals');
  await menu.save();
  return sendSuccess(res, menu, `${meal} availability updated`);
});

// DELETE /api/menus/:id
const deleteMenu = asyncHandler(async (req, res) => {
  const menu = await Menu.findByIdAndDelete(req.params.id);
  if (!menu) throw ApiError.notFound('Menu not found');
  return sendSuccess(res, null, 'Menu removed');
});

// POST /api/menus/copy — copy a week's menu to another week
const copyWeek = asyncHandler(async (req, res) => {
  const { fromStart, toStart } = req.body;
  const fromKeys = weekKeys(fromStart);
  const toKeys = weekKeys(toStart);
  const source = await Menu.find({ date: { $in: fromKeys } });
  if (!source.length) throw ApiError.badRequest('No menus found in the source week');

  let copied = 0;
  for (const menu of source) {
    const index = fromKeys.indexOf(menu.date);
    const newDate = toKeys[index];
    if (!newDate) continue;
    const exists = await Menu.findOne({ date: newDate });
    if (exists) {
      exists.meals = menu.meals;
      exists.updatedBy = req.user._id;
      await exists.save();
    } else {
      await Menu.create({
        date: newDate,
        meals: menu.meals,
        createdBy: req.user._id,
        isPublished: menu.isPublished,
      });
    }
    copied += 1;
  }
  return sendSuccess(res, { copied }, `${copied} menu day(s) copied`);
});

module.exports = {
  listMenus,
  getWeek,
  getToday,
  getMenuByDate,
  createMenu,
  updateMenu,
  setMealAvailability,
  deleteMenu,
  copyWeek,
};
