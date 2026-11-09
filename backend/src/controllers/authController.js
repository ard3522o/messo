const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');
const { sendSuccess } = require('../utils/response');
const User = require('../models/User');
const Student = require('../models/Student');

const authPayload = async (user) => {
  const profile = user.role === 'student' ? await Student.findOne({ user: user._id }) : null;
  return { token: signToken(user), user: { ...user.toJSON(), student: profile } };
};

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, studentId, hostel, roomNumber, department, year, messType } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('An account with this email already exists');
  const existingStudent = await Student.findOne({ studentId: studentId.toUpperCase() });
  if (existingStudent) throw ApiError.conflict('This student ID is already registered');

  const user = await User.create({ name, email, password, phone, role: 'student' });
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
      year,
      messType: messType || 'veg',
      dietaryPreference: messType === 'non-veg' ? 'non-veg' : 'veg',
      messCardId: `IIIT-MESS-${studentId.toUpperCase()}`,
      subscriptionStatus: 'inactive',
    });
    return sendSuccess(res, { ...(await authPayload(user)), student }, 'Account created successfully', undefined, 201);
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password');
  }
  if (!user.isActive) throw ApiError.forbidden('Your account has been deactivated');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  return sendSuccess(res, await authPayload(user), 'Signed in successfully');
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw ApiError.unauthorized();
  const student = user.role === 'student' ? await Student.findOne({ user: user._id }) : null;
  return sendSuccess(res, { user: { ...user.toJSON(), student } });
});

// PATCH /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatarUrl } = req.body;
  const user = await User.findById(req.user._id);
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  await user.save();

  if (user.role === 'student') {
    const studentUpdate = {};
    if (name !== undefined) studentUpdate.name = name;
    if (phone !== undefined) studentUpdate.phone = phone;
    if (Object.keys(studentUpdate).length) {
      await Student.findOneAndUpdate({ user: user._id }, studentUpdate, { runValidators: true });
    }
  }

  const student = user.role === 'student' ? await Student.findOne({ user: user._id }) : null;
  return sendSuccess(res, { user: { ...user.toJSON(), student } }, 'Profile updated');
});

// PATCH /api/auth/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  return sendSuccess(res, null, 'Password updated successfully');
});

module.exports = { register, login, me, updateProfile, changePassword };
