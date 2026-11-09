const jwt = require('jsonwebtoken');
const env = require('../config/env');

const signToken = (user) =>
  jwt.sign({ id: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

const verifyToken = (token) => jwt.verify(token, env.JWT_SECRET);

/** Signed, short-lived token embedded in the mess counter QR code. */
const signMealToken = (meal, date, placedBy) =>
  jwt.sign({ scope: 'meal-checkin', meal, date, placedBy: placedBy?.toString() }, env.QR_SECRET, {
    expiresIn: '12h',
  });

const verifyMealToken = (token) => jwt.verify(token, env.QR_SECRET);

module.exports = { signToken, verifyToken, signMealToken, verifyMealToken };
