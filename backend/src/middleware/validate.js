const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/** Collects express-validator errors into a single 400 response. */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(ApiError.badRequest(details[0]?.message || 'Validation failed', details));
};

module.exports = validate;
