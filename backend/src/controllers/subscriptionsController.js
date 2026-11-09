const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, paginated } = require('../utils/response');
const { getPagination, escapeRegex } = require('../utils/helpers');
const Subscription = require('../models/Subscription');
const Student = require('../models/Student');
const Payment = require('../models/Payment');
const { toMonthKey } = require('../utils/dates');
const env = require('../config/env');

const syncStatuses = async () => {
  const now = new Date();
  const expired = await Subscription.find({ status: 'active', endDate: { $lt: now } }).select('student');
  if (expired.length) {
    await Subscription.updateMany(
      { _id: { $in: expired.map((s) => s._id) } },
      { status: 'expired' }
    );
    const studentIds = expired.map((s) => s.student);
    for (const studentId of studentIds) {
      const stillActive = await Subscription.exists({ student: studentId, status: 'active' });
      if (!stillActive) await Student.findByIdAndUpdate(studentId, { subscriptionStatus: 'expired' });
    }
  }
};

// GET /api/subscriptions
const listSubscriptions = asyncHandler(async (req, res) => {
  await syncStatuses();
  const { page, limit, skip } = getPagination(req.query);
  const { status, plan, search } = req.query;

  const studentFilter = {};
  if (search?.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    const students = await Student.find({ $or: [{ name: rx }, { studentId: rx }] }).select('_id');
    studentFilter.student = { $in: students.map((s) => s._id) };
  }

  const filter = { ...studentFilter };
  if (status) filter.status = status;
  if (plan) filter.plan = plan;

  const [items, total] = await Promise.all([
    Subscription.find(filter)
      .populate('student', 'name studentId hostel roomNumber department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Subscription.countDocuments(filter),
  ]);

  return paginated(res, { items, total, page, limit });
});

// POST /api/subscriptions
const createSubscription = asyncHandler(async (req, res) => {
  const { studentId, plan, startDate, amount, autoRenew } = req.body;
  const student = await Student.findById(studentId);
  if (!student) throw ApiError.notFound('Student not found');

  const start = startDate ? new Date(startDate) : new Date();
  const months = { monthly: 1, quarterly: 3, semester: 6 }[plan || 'monthly'];
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);

  const existingActive = await Subscription.findOne({ student: student._id, status: 'active' });
  if (existingActive) {
    existingActive.status = 'cancelled';
    await existingActive.save();
  }

  const subscription = await Subscription.create({
    student: student._id,
    plan: plan || 'monthly',
    startDate: start,
    endDate: end,
    amount: Number(amount) || env.MONTHLY_MESS_FEE * months,
    autoRenew: Boolean(autoRenew),
    createdBy: req.user._id,
  });

  student.subscriptionStatus = 'active';
  await student.save();

  // Raise the corresponding mess bill if one does not exist yet.
  const month = toMonthKey(start);
  if (!(await Payment.exists({ student: student._id, month }))) {
    await Payment.create({
      student: student._id,
      invoiceNo: `INV-${month.replace('-', '')}-${student.studentId}`,
      month,
      amount: Number(amount) || env.MONTHLY_MESS_FEE,
      breakdown: { messFee: Number(amount) || env.MONTHLY_MESS_FEE },
      dueDate: new Date(start.getFullYear(), start.getMonth(), 10),
      status: 'unpaid',
      recordedBy: req.user._id,
    });
  }

  return sendSuccess(res, subscription, 'Subscription activated', undefined, 201);
});

// PATCH /api/subscriptions/:id
const updateSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) throw ApiError.notFound('Subscription not found');

  ['plan', 'status', 'autoRenew', 'endDate', 'amount'].forEach((field) => {
    if (req.body[field] !== undefined) subscription[field] = req.body[field];
  });
  await subscription.save();

  if (req.body.status) {
    const statusMap = { active: 'active', expired: 'expired', cancelled: 'inactive' };
    await Student.findByIdAndUpdate(subscription.student, {
      subscriptionStatus: statusMap[subscription.status],
    });
  }

  return sendSuccess(res, subscription, 'Subscription updated');
});

// DELETE /api/subscriptions/:id
const deleteSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findById(req.params.id);
  if (!subscription) throw ApiError.notFound('Subscription not found');
  await subscription.deleteOne();
  const active = await Subscription.exists({ student: subscription.student, status: 'active' });
  if (!active) await Student.findByIdAndUpdate(subscription.student, { subscriptionStatus: 'inactive' });
  return sendSuccess(res, null, 'Subscription removed');
});

module.exports = {
  listSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  syncStatuses,
};
