const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');
const User = require('../models/User');
const Student = require('../models/Student');

/** Verifies the bearer token and attaches the authenticated user. */
const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw ApiError.unauthorized();

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Session expired or token is invalid');
  }

  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized('Account no longer exists');
  if (!user.isActive) throw ApiError.forbidden('Your account has been deactivated');

  req.user = user;
  next();
});

/** Restricts a route to one or more roles. */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};

/** Loads the student profile belonging to the logged-in student. */
const attachStudent = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'student') return next();
  const student = await Student.findOne({ user: req.user._id });
  if (!student) throw ApiError.notFound('Student profile not found for this account');
  if (!student.isActive) throw ApiError.forbidden('Your student profile is inactive');
  req.student = student;
  return next();
});

module.exports = { protect, authorize, attachStudent };
