const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, paginated } = require('../utils/response');
const { getPagination } = require('../utils/helpers');
const Announcement = require('../models/Announcement');

// GET /api/announcements
const listAnnouncements = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 10 });
  const { category, audience, includeUnpublished } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (audience && audience !== 'all') filter.audience = { $in: ['all', audience] };
  if (req.user.role === 'student' || includeUnpublished !== 'true') {
    filter.isPublished = true;
  }
  // Hide expired announcements from students.
  if (req.user.role === 'student') {
    filter.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];
  }

  const [items, total] = await Promise.all([
    Announcement.find(filter)
      .populate('publishedBy', 'name role')
      .sort({ isPinned: -1, publishedAt: -1 })
      .skip(skip)
      .limit(limit),
    Announcement.countDocuments(filter),
  ]);

  return paginated(res, { items, total, page, limit });
});

// POST /api/announcements
const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, category, audience, isPinned, isPublished, expiresAt } = req.body;
  const announcement = await Announcement.create({
    title,
    content,
    category,
    audience,
    isPinned: Boolean(isPinned),
    isPublished: isPublished !== false,
    expiresAt: expiresAt || undefined,
    publishedBy: req.user._id,
    publishedAt: new Date(),
  });
  await announcement.populate('publishedBy', 'name role');
  return sendSuccess(res, announcement, 'Announcement published', undefined, 201);
});

// PATCH /api/announcements/:id
const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw ApiError.notFound('Announcement not found');

  ['title', 'content', 'category', 'audience', 'isPinned', 'isPublished', 'expiresAt'].forEach((field) => {
    if (req.body[field] !== undefined) announcement[field] = req.body[field];
  });
  await announcement.save();
  await announcement.populate('publishedBy', 'name role');
  return sendSuccess(res, announcement, 'Announcement updated');
});

// DELETE /api/announcements/:id
const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) throw ApiError.notFound('Announcement not found');
  return sendSuccess(res, null, 'Announcement deleted');
});

module.exports = { listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
