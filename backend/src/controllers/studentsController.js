const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, paginated } = require('../utils/response');
const { getPagination, escapeRegex } = require('../utils/helpers');
const { toMonthKey } = require('../utils/dates');
const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const Subscription = require('../models/Subscription');

// GET /api/students
const listStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search = '', hostel, department, status, year } = req.query;

  const filter = {};
  if (search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ name: rx }, { studentId: rx }, { email: rx }, { phone: rx }, { roomNumber: rx }];
  }
  if (hostel) filter.hostel = hostel;
  if (department) filter.department = department;
  if (status) filter.subscriptionStatus = status;
  if (year) filter.year = Number(year);

  const [items, total] = await Promise.all([
    Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Student.countDocuments(filter),
  ]);

  return paginated(res, { items, total, page, limit });
});

// GET /api/students/:id
const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('user', 'name email role lastLoginAt');
  if (!student) throw ApiError.notFound('Student not found');

  const month = toMonthKey();
  const [attendanceThisMonth, payments, openComplaints, subscription, feedbackCount] = await Promise.all([
    Attendance.countDocuments({ student: student._id, date: { $regex: `^${month}` }, status: 'present' }),
    Payment.find({ student: student._id }).sort({ month: -1 }).limit(6),
    Complaint.countDocuments({ student: student._id, status: { $in: ['open', 'in_progress'] } }),
    Subscription.findOne({ student: student._id, status: 'active' }).sort({ endDate: -1 }),
    Feedback.countDocuments({ student: student._id }),
  ]);

  return sendSuccess(res, {
    student,
    stats: { attendanceThisMonth, openComplaints, feedbackCount },
    payments,
    subscription,
  });
});

// POST /api/students
const createStudent = asyncHandler(async (req, res) => {
  const {
    studentId, name, email, password, phone, hostel, roomNumber, department, year,
    messType, subscriptionStatus, monthlyFee,
  } = req.body;

  if (await User.findOne({ email: email.toLowerCase() })) {
    throw ApiError.conflict('A user with this email already exists');
  }
  if (await Student.findOne({ studentId: studentId.toUpperCase() })) {
    throw ApiError.conflict('This student ID already exists');
  }

  const user = await User.create({
    name,
    email,
    phone,
    password: password || 'Mess@1234',
    role: 'student',
  });

  try {
    const student = await Student.create({
      user: user._id,
      studentId,
      name,
      email,
      phone,
      hostel,
      roomNumber,
      department,
      year: year || 1,
      messType: messType || 'veg',
      dietaryPreference: messType === 'non-veg' ? 'non-veg' : 'veg',
      messCardId: `IIIT-MESS-${studentId.toUpperCase()}`,
      subscriptionStatus: subscriptionStatus || 'inactive',
    });

    if (subscriptionStatus === 'active') {
      const start = new Date();
      const end = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
      await Subscription.create({
        student: student._id,
        plan: 'monthly',
        startDate: start,
        endDate: end,
        amount: Number(monthlyFee) || 3500,
        status: 'active',
        createdBy: req.user._id,
      });
    }

    return sendSuccess(res, student, 'Student added successfully', undefined, 201);
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }
});

// PATCH /api/students/:id
const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw ApiError.notFound('Student not found');

  const allowed = ['name', 'phone', 'hostel', 'roomNumber', 'department', 'year', 'messType', 'dietaryPreference', 'subscriptionStatus', 'isActive'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) student[field] = req.body[field];
  });

  if (req.body.email && req.body.email.toLowerCase() !== student.email) {
    const email = req.body.email.toLowerCase();
    if (await User.findOne({ email, _id: { $ne: student.user } })) {
      throw ApiError.conflict('A user with this email already exists');
    }
    student.email = email;
    await User.findByIdAndUpdate(student.user, { email }, { runValidators: true });
  }

  await student.save();
  if (req.body.name || req.body.phone) {
    await User.findByIdAndUpdate(student.user, {
      ...(req.body.name ? { name: req.body.name } : {}),
      ...(req.body.phone ? { phone: req.body.phone } : {}),
    });
  }

  if (req.body.subscriptionStatus === 'inactive') {
    await Subscription.updateMany({ student: student._id, status: 'active' }, { status: 'cancelled' });
  }

  return sendSuccess(res, student, 'Student updated successfully');
});

// DELETE /api/students/:id
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw ApiError.notFound('Student not found');

  await Promise.all([
    Attendance.deleteMany({ student: student._id }),
    Payment.deleteMany({ student: student._id }),
    Complaint.deleteMany({ student: student._id }),
    Feedback.deleteMany({ student: student._id }),
    Subscription.deleteMany({ student: student._id }),
    Student.deleteOne({ _id: student._id }),
    User.deleteOne({ _id: student.user }),
  ]);

  return sendSuccess(res, null, 'Student and related records removed');
});

// PATCH /api/students/me
const updateMyProfile = asyncHandler(async (req, res) => {
  const allowed = ['phone', 'messType', 'dietaryPreference', 'roomNumber'];
  const update = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) update[field] = req.body[field];
  });
  if (req.body.messType) update.dietaryPreference = req.body.messType === 'veg' ? 'veg' : 'non-veg';

  const student = await Student.findByIdAndUpdate(req.student._id, update, {
    new: true,
    runValidators: true,
  });
  if (update.phone) await User.findByIdAndUpdate(req.user._id, { phone: update.phone });

  return sendSuccess(res, student, 'Profile updated');
});

// GET /api/students/meta/filters
const filterOptions = asyncHandler(async (req, res) => {
  const [hostels, departments] = await Promise.all([
    Student.distinct('hostel'),
    Student.distinct('department'),
  ]);
  return sendSuccess(res, {
    hostels: hostels.sort(),
    departments: departments.sort(),
    years: [1, 2, 3, 4, 5],
    statuses: ['active', 'inactive', 'expired'],
  });
});

module.exports = {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  updateMyProfile,
  filterOptions,
};
