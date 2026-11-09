const getPagination = (query, defaults = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || defaults.page || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || defaults.limit || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateInvoiceNo = (month, sequence) =>
  `INV-${month.replace('-', '')}-${String(sequence).padStart(4, '0')}`;

const generateReceiptNo = (paymentId) =>
  `RCPT-${new Date().getFullYear()}-${String(paymentId).slice(-6).toUpperCase()}`;

const generateComplaintNo = (sequence) =>
  `CMP-${new Date().getFullYear()}-${String(sequence).padStart(4, '0')}`;

module.exports = {
  getPagination,
  escapeRegex,
  generateInvoiceNo,
  generateReceiptNo,
  generateComplaintNo,
};
