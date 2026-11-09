const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, paginated } = require('../utils/response');
const { getPagination, escapeRegex, generateComplaintNo } = require('../utils/helpers');
const Complaint = require('../models/Complaint');
const Student = require('../models/Student');

// GET /api/complaints/me
const listMyComplaints = asyncHandler(async (req, res) => {
  const complaints = await Complaint.find({ student: req.student._id }).sort({ createdAt: -1 });
  const counts = {
    total: complaints.length,
    open: complaints.filter((c) => c.status === 'open').length,
    inProgress: complaints.filter((c) => c.status === 'in_progress').length,
    resolved: complaints.filter((c) => c.status === 'resolved').length,
  };
  return sendSuccess(res, { complaints, counts });
});

// GET /api/complaints
const listComplaints = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 12 });
  const { status, category, priority, search = '' } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ subject: rx }, { description: rx }, { complaintNo: rx }];
    const students = await Student.find({ $or: [{ name: rx }, { studentId: rx }] }).select('_id');
    if (students.length) filter.$or.push({ student: { $in: students.map((s) => s._id) } });
  }

  const [items, total, counts] = await Promise.all([
    Complaint.find(filter)
      .populate('student', 'name studentId hostel roomNumber department email')
      .populate('response.by', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Complaint.countDocuments(filter),
    Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const statusCounts = counts.reduce((acc, c) => ({ ...acc, [c._id]: c.count }), {});
  return paginated(res, { items, total, page, limit, statusCounts });
});

// GET /api/complaints/stats
const complaintStats = asyncHandler(async (req, res) => {
  const [byStatus, byCategory, byPriority, avgResolution] = await Promise.all([
    Complaint.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
    Complaint.aggregate([
      { $match: { status: 'resolved', resolvedAt: { $ne: null } } },
      {
        $project: {
          hours: { $divide: [{ $subtract: ['$resolvedAt', '$createdAt'] }, 3600000] },
        },
      },
      { $group: { _id: null, avgHours: { $avg: '$hours' } } },
    ]),
  ]);

  return sendSuccess(res, {
    byStatus,
    byCategory,
    byPriority,
    total: byStatus.reduce((s, c) => s + c.count, 0),
    avgResolutionHours: Math.round(avgResolution[0]?.avgHours || 0),
  });
});

// POST /api/complaints
const createComplaint = asyncHandler(async (req, res) => {
  const { category, subject, description, priority = 'medium' } = req.body;
  const images = (req.files || []).map((file) => `/uploads/${file.filename}`);
  const seq = await Complaint.countDocuments();

  const complaint = await Complaint.create({
    complaintNo: generateComplaintNo(seq + 1),
    student: req.student._id,
    category,
    subject,
    description,
    priority,
    images,
  });

  return sendSuccess(res, complaint, 'Complaint submitted successfully', undefined, 201);
});

// PATCH /api/complaints/:id
const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw ApiError.notFound('Complaint not found');

  if (req.body.status) {
    complaint.status = req.body.status;
    if (req.body.status === 'resolved' || req.body.status === 'rejected') {
      complaint.resolvedAt = new Date();
    } else {
      complaint.resolvedAt = undefined;
    }
  }
  if (req.body.priority) complaint.priority = req.body.priority;
  if (req.body.response) {
    complaint.response = {
      message: req.body.response,
      by: req.user._id,
      at: new Date(),
    };
  }
  await complaint.save();

  await complaint.populate('student', 'name studentId hostel roomNumber');
  await complaint.populate('response.by', 'name role');
  return sendSuccess(res, complaint, 'Complaint updated');
});

// DELETE /api/complaints/:id (student can withdraw an open complaint, admin any)
const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw ApiError.notFound('Complaint not found');

  if (req.user.role === 'student') {
    if (complaint.student.toString() !== req.student._id.toString()) {
      throw ApiError.forbidden('You can only withdraw your own complaint');
    }
    if (complaint.status !== 'open') throw ApiError.badRequest('Only open complaints can be withdrawn');
  }

  await complaint.deleteOne();
  return sendSuccess(res, null, 'Complaint deleted');
});

module.exports = {
  listMyComplaints,
  listComplaints,
  complaintStats,
  createComplaint,
  updateComplaint,
  deleteComplaint,
};
