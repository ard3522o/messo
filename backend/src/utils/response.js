/** Uniform success envelope for every API response. */
const sendSuccess = (res, data = null, message = 'OK', meta = undefined, statusCode = 200) => {
  const payload = { success: true, message, data };
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
};

const paginated = (res, { items, total, page, limit }, message = 'OK') =>
  sendSuccess(res, items, message, {
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });

module.exports = { sendSuccess, paginated };
