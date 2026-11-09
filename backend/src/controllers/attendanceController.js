const QRCode = require('qrcode');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, paginated } = require('../utils/response');
const { getPagination, escapeRegex } = require('../utils/helpers');
const { toDateKey, toMonthKey, dateRangeKeys, dayLabel, addDays } = require('../utils/dates');
const { signMealToken, verifyMealToken } = require('../utils/token');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Menu = require('../models/Menu');
const env = require('../config/env');

const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'];

// GET /api/attendance  (admin/manager)
const listAttendance = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 15 });
  const { date = toDateKey(), meal, hostel, search = '', status } = req.query;

  const filter = { date };
  if (meal) filter.meal = meal;
  if (status) filter.status = status;

  if (hostel || search.trim()) {
    const studentFilter = {};
    if (hostel) studentFilter.hostel = hostel;
    if (search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), 'i');
      studentFilter.$or = [{ name: rx }, { studentId: rx }];
    }
    const students = await Student.find(studentFilter).select('_id');
    filter.student = { $in: students.map((s) => s._id) };
  }

  const [items, total] = await Promise.all([
    Attendance.find(filter)
      .populate('student', 'name studentId hostel roomNumber department')
      .sort({ markedAt: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments(filter),
  ]);

  return paginated(res, { items, total, page, limit });
});

// GET /api/attendance/summary?date=
const getDailySummary = asyncHandler(async (req, res) => {
  const date = req.query.date || toDateKey();
  const [totalStudents, activeStudents, counts] = await Promise.all([
    Student.countDocuments({ isActive: true }),
    Student.countDocuments({ isActive: true, subscriptionStatus: 'active' }),
    Attendance.aggregate([
      { $match: { date, status: 'present' } },
      { $group: { _id: '$meal', count: { $sum: 1 } } },
    ]),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  const meals = MEALS.map((meal) => ({
    meal,
    present: countMap[meal] || 0,
    absent: Math.max(0, activeStudents - (countMap[meal] || 0)),
    rate: activeStudents ? Math.round(((countMap[meal] || 0) / activeStudents) * 100) : 0,
  }));

  return sendSuccess(res, {
    date,
    totalStudents,
    activeStudents,
    totalPresent: counts.reduce((sum, c) => sum + c.count, 0),
    meals,
  });
});

// GET /api/attendance/trend?days=14
const getTrend = asyncHandler(async (req, res) => {
  const days = Math.min(60, Math.max(7, Number(req.query.days) || 14));
  const from = toDateKey(addDays(new Date(), -(days - 1)));
  const to = toDateKey();

  const rows = await Attendance.aggregate([
    { $match: { date: { $gte: from, $lte: to }, status: 'present' } },
    { $group: { _id: { date: '$date', meal: '$meal' }, count: { $sum: 1 } } },
  ]);

  const byDate = {};
  rows.forEach((r) => {
    byDate[r._id.date] = byDate[r._id.date] || {};
    byDate[r._id.date][r._id.meal] = r.count;
  });

  const series = dateRangeKeys(from, to).map((date) => ({
    date,
    label: dayLabel(date),
    breakfast: byDate[date]?.breakfast || 0,
    lunch: byDate[date]?.lunch || 0,
    snacks: byDate[date]?.snacks || 0,
    dinner: byDate[date]?.dinner || 0,
    total: MEALS.reduce((sum, m) => sum + (byDate[date]?.[m] || 0), 0),
  }));

  return sendSuccess(res, series);
});

// GET /api/attendance/me?month=YYYY-MM
const getMyAttendance = asyncHandler(async (req, res) => {
  const month = req.query.month || toMonthKey();
  const records = await Attendance.find({ student: req.student._id, date: { $regex: `^${month}` } }).sort({ date: 1 });

  const byMeal = {};
  MEALS.forEach((meal) => {
    byMeal[meal] = { present: 0, absent: 0 };
  });
  records.forEach((r) => {
    if (byMeal[r.meal]) byMeal[r.meal][r.status] += 1;
  });

  const today = toDateKey();
  const [y, m] = month.split('-').map(Number);
  const isCurrentMonth = month === today.slice(0, 7);
  const lastDay = isCurrentMonth ? new Date().getDate() : new Date(y, m, 0).getDate();
  const possibleMeals = lastDay * MEALS.length;
  const presentCount = records.filter((r) => r.status === 'present').length;

  const daily = {};
  records.forEach((r) => {
    daily[r.date] = daily[r.date] || { date: r.date, breakfast: null, lunch: null, snacks: null, dinner: null };
    daily[r.date][r.meal] = r.status;
  });

  return sendSuccess(res, {
    month,
    records,
    byMeal,
    presentCount,
    absentCount: records.filter((r) => r.status === 'absent').length,
    attendanceRate: possibleMeals ? Math.round((presentCount / possibleMeals) * 100) : 0,
    daily: Object.values(daily).sort((a, b) => a.date.localeCompare(b.date)),
  });
});

// GET /api/attendance/me/today
const getMyToday = asyncHandler(async (req, res) => {
  const date = toDateKey();
  const [records, menu] = await Promise.all([
    Attendance.find({ student: req.student._id, date }),
    Menu.findOne({ date }),
  ]);
  return sendSuccess(res, {
    date,
    records,
    menu,
    meals: MEALS.map((meal) => ({
      meal,
      checkedIn: records.some((r) => r.meal === meal && r.status === 'present'),
      menu: menu?.meals?.[meal] || null,
    })),
  });
});

// POST /api/attendance/qr  (admin/manager) — QR displayed at the mess counter
const generateMealQR = asyncHandler(async (req, res) => {
  const { meal, date = toDateKey() } = req.body;
  if (!MEALS.includes(meal)) throw ApiError.badRequest('Invalid meal');
  if (date !== toDateKey()) throw ApiError.badRequest('QR codes can only be generated for today');

  const menu = await Menu.findOne({ date });
  if (menu && menu.meals[meal] && menu.meals[meal].isAvailable === false) {
    throw ApiError.badRequest(`The mess counter is closed for ${meal}`);
  }

  const token = signMealToken(meal, date, req.user._id);
  const dataUrl = await QRCode.toDataURL(token, { width: 420, margin: 2, color: { dark: '#111C4E', light: '#FFFFFF' } });
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);

  return sendSuccess(res, { token, dataUrl, meal, date, expiresAt }, 'Meal QR generated');
});

// POST /api/attendance/check-in  (student)
const checkIn = asyncHandler(async (req, res) => {
  const { token } = req.body;
  let payload;
  try {
    payload = verifyMealToken(token);
  } catch (err) {
    throw ApiError.badRequest('This QR code is invalid or has expired. Ask the mess counter for a fresh one.');
  }
  if (payload.scope !== 'meal-checkin') throw ApiError.badRequest('Invalid QR code');
  if (payload.date !== toDateKey()) throw ApiError.badRequest('This QR code is only valid on its issue date');

  if (req.student.subscriptionStatus !== 'active') {
    throw ApiError.forbidden('Your mess subscription is not active. Contact the mess admin.');
  }

  const existing = await Attendance.findOne({
    student: req.student._id,
    date: payload.date,
    meal: payload.meal,
  });
  if (existing) throw ApiError.conflict(`You have already marked ${payload.meal} attendance for today`);

  const attendance = await Attendance.create({
    student: req.student._id,
    date: payload.date,
    meal: payload.meal,
    status: 'present',
    method: 'qr',
    markedAt: new Date(),
  });

  return sendSuccess(res, attendance, `${payload.meal.charAt(0).toUpperCase() + payload.meal.slice(1)} attendance marked`, undefined, 201);
});

// POST /api/attendance  (admin/manager — manual entry)
const markAttendance = asyncHandler(async (req, res) => {
  const { studentId, date = toDateKey(), meal, status = 'present' } = req.body;
  if (!MEALS.includes(meal)) throw ApiError.badRequest('Invalid meal');

  const student = await Student.findById(studentId);
  if (!student) throw ApiError.notFound('Student not found');

  const existing = await Attendance.findOne({ student: student._id, date, meal });
  if (existing) {
    existing.status = status;
    existing.method = 'manual';
    existing.markedBy = req.user._id;
    existing.markedAt = new Date();
    await existing.save();
    return sendSuccess(res, existing, 'Attendance updated');
  }

  const attendance = await Attendance.create({
    student: student._id,
    date,
    meal,
    status,
    method: 'manual',
    markedBy: req.user._id,
  });
  return sendSuccess(res, attendance, 'Attendance recorded', undefined, 201);
});

// DELETE /api/attendance/:id
const deleteAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findByIdAndDelete(req.params.id);
  if (!record) throw ApiError.notFound('Attendance record not found');
  return sendSuccess(res, null, 'Attendance record removed');
});

// GET /api/attendance/requirements?date=  (manager)
const getMealRequirements = asyncHandler(async (req, res) => {
  const date = req.query.date || toDateKey();
  const [activeStudents, vegCount, nonVegCount, menu, present] = await Promise.all([
    Student.countDocuments({ isActive: true, subscriptionStatus: 'active' }),
    Student.countDocuments({ isActive: true, subscriptionStatus: 'active', messType: 'veg' }),
    Student.countDocuments({ isActive: true, subscriptionStatus: 'active', messType: 'non-veg' }),
    Menu.findOne({ date }),
    Attendance.aggregate([
      { $match: { date, status: 'present' } },
      { $group: { _id: '$meal', count: { $sum: 1 } } },
    ]),
  ]);
  const presentMap = Object.fromEntries(present.map((p) => [p._id, p.count]));

  return sendSuccess(res, {
    date,
    activeStudents,
    vegCount,
    nonVegCount,
    perMeal: MEALS.map((meal) => ({
      meal,
      expected: activeStudents,
      checkedIn: presentMap[meal] || 0,
      isAvailable: menu?.meals?.[meal]?.isAvailable ?? true,
      items: menu?.meals?.[meal]?.items || [],
    })),
  });
});

module.exports = {
  listAttendance,
  getDailySummary,
  getTrend,
  getMyAttendance,
  getMyToday,
  generateMealQR,
  checkIn,
  markAttendance,
  deleteAttendance,
  getMealRequirements,
};
