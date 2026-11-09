const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const {
  toDateKey, toMonthKey, monthKeyRange, monthLabel, addDays, dayLabel, startOfWeekKey, weekKeys,
} = require('../utils/dates');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const Inventory = require('../models/Inventory');
const StockLog = require('../models/StockLog');
const Announcement = require('../models/Announcement');
const Menu = require('../models/Menu');
const env = require('../config/env');

const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'];

const attendanceByMeal = async (date) => {
  const rows = await Attendance.aggregate([
    { $match: { date, status: 'present' } },
    { $group: { _id: '$meal', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  return MEALS.map((meal) => ({ meal, count: map[meal] || 0 }));
};

const attendanceTrend = async (days) => {
  const from = toDateKey(addDays(new Date(), -(days - 1)));
  const rows = await Attendance.aggregate([
    { $match: { date: { $gte: from, $lte: toDateKey() }, status: 'present' } },
    { $group: { _id: { date: '$date', meal: '$meal' }, count: { $sum: 1 } } },
  ]);
  const byDate = {};
  rows.forEach((r) => {
    byDate[r._id.date] = byDate[r._id.date] || {};
    byDate[r._id.date][r._id.meal] = r.count;
  });
  const series = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = toDateKey(addDays(new Date(), -i));
    const day = byDate[date] || {};
    series.push({
      date,
      label: dayLabel(date),
      breakfast: day.breakfast || 0,
      lunch: day.lunch || 0,
      snacks: day.snacks || 0,
      dinner: day.dinner || 0,
      total: MEALS.reduce((s, m) => s + (day[m] || 0), 0),
    });
  }
  return series;
};

const revenueTrend = async (months = 6) => {
  const keys = monthKeyRange(months);
  const [paid, billed] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'paid', month: { $in: keys } } },
      { $group: { _id: '$month', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { month: { $in: keys } } },
      { $group: { _id: { month: '$month', status: '$status' }, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);
  const paidMap = Object.fromEntries(paid.map((p) => [p._id, p]));
  const dueMap = {};
  billed.forEach((b) => {
    dueMap[b._id.month] = dueMap[b._id.month] || { pending: 0, count: 0 };
    if (b._id.status !== 'paid') {
      dueMap[b._id.month].pending += b.amount;
      dueMap[b._id.month].count += b.count;
    }
  });
  return keys.map((month) => ({
    month,
    label: monthLabel(month),
    collected: paidMap[month]?.amount || 0,
    pending: dueMap[month]?.pending || 0,
    paidInvoices: paidMap[month]?.count || 0,
  }));
};

const feedbackByMeal = async (from, to) => {
  const rows = await Feedback.aggregate([
    { $match: { date: { $gte: from, $lte: to } } },
    { $group: { _id: '$meal', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(rows.map((r) => [r._id, r]));
  return MEALS.map((meal) => ({
    meal,
    average: Number((map[meal]?.avg || 0).toFixed(2)),
    count: map[meal]?.count || 0,
  }));
};

// GET /api/analytics/admin/overview
const adminOverview = asyncHandler(async (req, res) => {
  const month = req.query.month || toMonthKey();
  const date = req.query.date || toDateKey();
  const rangeFrom = toDateKey(addDays(new Date(), -29));

  const [
    totalStudents, activeSubscriptions, todayCount, monthlyPaid, pendingComplaints,
    feedbackAgg, lowStockCount, mealsToday, revenue, complaintRows, recentPayments,
    recentComplaints, menu, announcements,
  ] = await Promise.all([
    Student.countDocuments({ isActive: true }),
    Student.countDocuments({ isActive: true, subscriptionStatus: 'active' }),
    Attendance.countDocuments({ date, status: 'present' }),
    Payment.aggregate([{ $match: { month, status: 'paid' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]),
    Complaint.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
    Feedback.aggregate([{ $match: { date: { $gte: rangeFrom } } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
    Inventory.countDocuments({ isActive: true, $expr: { $lte: ['$quantity', '$minThreshold'] } }),
    attendanceByMeal(date),
    revenueTrend(6),
    Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Payment.find({ status: 'paid' }).populate('student', 'name studentId').sort({ paidAt: -1 }).limit(5),
    Complaint.find().populate('student', 'name studentId').sort({ createdAt: -1 }).limit(5),
    Menu.findOne({ date }),
    Announcement.find({ isPublished: true }).sort({ publishedAt: -1 }).limit(4).populate('publishedBy', 'name'),
  ]);

  const expenseAgg = await Payment.aggregate([{ $match: { month, status: 'paid' } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]);
  const billedAgg = await Payment.aggregate([{ $match: { month } }, { $group: { _id: null, amount: { $sum: '$amount' } } }]);

  return sendSuccess(res, {
    month,
    date,
    cards: {
      totalStudents,
      activeSubscriptions,
      todayAttendance: todayCount,
      attendanceRate: activeSubscriptions ? Math.round((todayCount / (activeSubscriptions * 4)) * 100) : 0,
      monthlyRevenue: monthlyPaid[0]?.amount || 0,
      pendingComplaints,
      avgRating: Number((feedbackAgg[0]?.avg || 0).toFixed(2)),
      feedbackCount: feedbackAgg[0]?.count || 0,
      lowStockCount,
      outstanding: Math.max(0, (billedAgg[0]?.amount || 0) - (expenseAgg[0]?.amount || 0)),
      messFee: env.MONTHLY_MESS_FEE,
    },
    perMeal: mealsToday,
    attendanceTrend: await attendanceTrend(14),
    revenue,
    complaints: complaintRows,
    recentPayments,
    recentComplaints,
    todayMenu: menu,
    weekMenu: await Menu.find({ date: { $gte: startOfWeekKey(), $lte: weekKeys(startOfWeekKey())[6] } }).sort({ date: 1 }),
    announcements,
  });
});

// GET /api/analytics/manager/overview
const managerOverview = asyncHandler(async (req, res) => {
  const date = req.query.date || toDateKey();
  const month = toMonthKey();
  const from = toDateKey(addDays(new Date(), -6));

  const [
    activeStudents, vegCount, nonVegCount, checkedIn, lowStockItems, menu,
    wastageAgg, consumptionTrendRows, feedback, recentLogs, inventoryTotals,
  ] = await Promise.all([
    Student.countDocuments({ isActive: true, subscriptionStatus: 'active' }),
    Student.countDocuments({ isActive: true, subscriptionStatus: 'active', messType: 'veg' }),
    Student.countDocuments({ isActive: true, subscriptionStatus: 'active', messType: 'non-veg' }),
    Attendance.countDocuments({ date, status: 'present' }),
    Inventory.find({ isActive: true, $expr: { $lte: ['$quantity', '$minThreshold'] } }).limit(8),
    Menu.findOne({ date }),
    StockLog.aggregate([
      { $match: { type: 'wastage', date: { $regex: `^${month}` } } },
      { $group: { _id: null, qty: { $sum: '$quantity' }, cost: { $sum: '$totalCost' } } },
    ]),
    StockLog.aggregate([
      { $match: { date: { $gte: from, $lte: date }, type: { $in: ['consumption', 'wastage'] } } },
      { $group: { _id: { date: '$date', type: '$type' }, qty: { $sum: '$quantity' }, cost: { $sum: '$totalCost' } } },
    ]),
    feedbackByMeal(from, date),
    StockLog.find().populate('item', 'unit').sort({ createdAt: -1 }).limit(8),
    Inventory.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, stockValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }, items: { $sum: 1 } } },
    ]),
  ]);

  const trendMap = {};
  consumptionTrendRows.forEach((r) => {
    trendMap[r._id.date] = trendMap[r._id.date] || { consumption: 0, wastage: 0, cost: 0 };
    trendMap[r._id.date][r._id.type] = r.qty;
    trendMap[r._id.date].cost += r.cost;
  });

  const perMeal = [];
  const attendanceRows = await Attendance.aggregate([
    { $match: { date, status: 'present' } },
    { $group: { _id: '$meal', count: { $sum: 1 } } },
  ]);
  const attMap = Object.fromEntries(attendanceRows.map((r) => [r._id, r.count]));

  MEALS.forEach((meal) => {
    perMeal.push({
      meal,
      expected: activeStudents,
      checkedIn: attMap[meal] || 0,
      isAvailable: menu?.meals?.[meal]?.isAvailable ?? true,
      items: menu?.meals?.[meal]?.items || [],
    });
  });

  const trend = [];
  for (let i = 6; i >= 0; i -= 1) {
    const day = toDateKey(addDays(new Date(), -i));
    trend.push({
      date: day,
      label: dayLabel(day),
      consumption: trendMap[day]?.consumption || 0,
      wastage: trendMap[day]?.wastage || 0,
      cost: Math.round(trendMap[day]?.cost || 0),
    });
  }

  return sendSuccess(res, {
    date,
    month,
    cards: {
      activeStudents,
      expectedMeals: activeStudents * 4,
      checkedIn,
      lowStockCount: lowStockItems.length,
      wastageMonth: Math.round(wastageAgg[0]?.qty || 0),
      wastageCost: Math.round(wastageAgg[0]?.cost || 0),
      avgRating: Number(
        (feedback.reduce((s, f) => s + f.average, 0) / (feedback.filter((f) => f.count).length || 1)).toFixed(2)
      ),
      stockValue: Math.round(inventoryTotals[0]?.stockValue || 0),
      inventoryItems: inventoryTotals[0]?.items || 0,
    },
    vegCount,
    nonVegCount,
    perMeal,
    lowStock: lowStockItems,
    consumptionTrend: trend,
    feedback,
    recentLogs,
    menu,
  });
});

// GET /api/analytics/student/overview
const studentOverview = asyncHandler(async (req, res) => {
  const month = toMonthKey();
  const date = toDateKey();
  const student = req.student;

  const [attendanceRecords, payments, complaints, menu, week, feedbackAgg, announcements, todayRecords] = await Promise.all([
    Attendance.find({ student: student._id, date: { $regex: `^${month}` } }),
    Payment.find({ student: student._id }).sort({ month: -1 }).limit(3),
    Complaint.find({ student: student._id }).sort({ createdAt: -1 }).limit(3),
    Menu.findOne({ date }),
    Menu.find({ date: { $gte: startOfWeekKey(), $lte: weekKeys(startOfWeekKey())[6] } }).sort({ date: 1 }),
    Feedback.aggregate([{ $match: { student: student._id } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
    Announcement.find({ isPublished: true, audience: { $in: ['all', 'students'] } }).sort({ isPinned: -1, publishedAt: -1 }).limit(4),
    Attendance.find({ student: student._id, date }),
  ]);

  const byMeal = {};
  MEALS.forEach((m) => {
    byMeal[m] = { present: 0, absent: 0 };
  });
  attendanceRecords.forEach((r) => {
    if (byMeal[r.meal]) byMeal[r.meal][r.status] += 1;
  });
  const presentCount = attendanceRecords.filter((r) => r.status === 'present').length;
  const possible = new Date().getDate() * 4;
  const outstanding = payments.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  return sendSuccess(res, {
    date,
    month,
    student,
    attendance: {
      presentCount,
      rate: possible ? Math.round((presentCount / possible) * 100) : 0,
      byMeal,
      today: todayRecords,
    },
    payments,
    outstanding,
    complaints,
    menu,
    weekMenu: week,
    feedback: { average: Number((feedbackAgg[0]?.avg || 0).toFixed(2)), count: feedbackAgg[0]?.count || 0 },
    announcements,
  });
});

module.exports = { adminOverview, managerOverview, studentOverview };
