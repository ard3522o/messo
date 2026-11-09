const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, paginated } = require('../utils/response');
const { getPagination } = require('../utils/helpers');
const { toDateKey, dateRangeKeys, addDays, dayLabel } = require('../utils/dates');
const Feedback = require('../models/Feedback');
const Student = require('../models/Student');

const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'];

// GET /api/feedback/me
const listMyFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ student: req.student._id }).sort({ date: -1 }).limit(60);
  return sendSuccess(res, feedback);
});

// GET /api/feedback
const listFeedback = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 12 });
  const { meal, rating, from, to } = req.query;

  const filter = {};
  if (meal) filter.meal = meal;
  if (rating) filter.rating = Number(rating);
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to) filter.date.$lte = to;
  }

  const [items, total] = await Promise.all([
    Feedback.find(filter)
      .populate('student', 'name studentId hostel department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Feedback.countDocuments(filter),
  ]);

  return paginated(res, { items, total, page, limit });
});

// GET /api/feedback/summary
const feedbackSummary = asyncHandler(async (req, res) => {
  const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
  const from = toDateKey(addDays(new Date(), -(days - 1)));
  const to = toDateKey();

  const [byMeal, overall, tags, recent, trendRows] = await Promise.all([
    Feedback.aggregate([
      { $match: { date: { $gte: from, $lte: to } } },
      { $group: { _id: '$meal', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
    Feedback.aggregate([
      { $match: { date: { $gte: from, $lte: to } } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
    Feedback.aggregate([
      { $match: { date: { $gte: from, $lte: to } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Feedback.find({ date: { $gte: from, $lte: to }, comment: { $ne: '' } })
      .populate('student', 'name studentId')
      .sort({ createdAt: -1 })
      .limit(8),
    Feedback.aggregate([
      { $match: { date: { $gte: from, $lte: to } } },
      { $group: { _id: '$date', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]),
  ]);

  const mealMap = Object.fromEntries(byMeal.map((m) => [m._id, m]));
  const trendMap = Object.fromEntries(trendRows.map((t) => [t._id, t]));

  return sendSuccess(res, {
    from,
    to,
    overall: {
      average: Number((overall[0]?.avg || 0).toFixed(2)),
      count: overall[0]?.count || 0,
    },
    byMeal: MEALS.map((meal) => ({
      meal,
      average: Number((mealMap[meal]?.avg || 0).toFixed(2)),
      count: mealMap[meal]?.count || 0,
    })),
    tags: tags.map((t) => ({ tag: t._id, count: t.count })),
    recent,
    trend: dateRangeKeys(from, to).map((date) => ({
      date,
      label: dayLabel(date),
      average: Number((trendMap[date]?.avg || 0).toFixed(2)),
      count: trendMap[date]?.count || 0,
    })),
  });
});

// POST /api/feedback
const submitFeedback = asyncHandler(async (req, res) => {
  const { meal, rating, comment = '', tags = [], date = toDateKey(), isAnonymous = false } = req.body;
  if (!MEALS.includes(meal)) throw ApiError.badRequest('Invalid meal');

  const existing = await Feedback.findOne({ student: req.student._id, date, meal });
  if (existing) {
    existing.rating = Number(rating);
    existing.comment = comment;
    existing.tags = tags;
    existing.isAnonymous = Boolean(isAnonymous);
    await existing.save();
    return sendSuccess(res, existing, 'Feedback updated');
  }

  const feedback = await Feedback.create({
    student: req.student._id,
    date,
    meal,
    rating: Number(rating),
    comment,
    tags,
    isAnonymous: Boolean(isAnonymous),
  });
  return sendSuccess(res, feedback, 'Thank you for your feedback', undefined, 201);
});

// DELETE /api/feedback/:id
const deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw ApiError.notFound('Feedback not found');
  if (req.user.role === 'student') {
    if (feedback.student.toString() !== req.student._id.toString()) {
      throw ApiError.forbidden('You can only delete your own feedback');
    }
    if (feedback.date !== toDateKey()) throw ApiError.badRequest('Only today’s feedback can be deleted');
  }
  await feedback.deleteOne();
  return sendSuccess(res, null, 'Feedback deleted');
});

module.exports = { listMyFeedback, listFeedback, feedbackSummary, submitFeedback, deleteFeedback };
