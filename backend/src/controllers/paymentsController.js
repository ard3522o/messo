const PDFDocument = require('pdfkit');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, paginated } = require('../utils/response');
const { getPagination, escapeRegex, generateReceiptNo } = require('../utils/helpers');
const { toMonthKey, monthLabel } = require('../utils/dates');
const Payment = require('../models/Payment');
const Student = require('../models/Student');
const User = require('../models/User');
const env = require('../config/env');

const findOwnedPayment = async (req) => {
  const payment = await Payment.findById(req.params.id).populate('student', 'name studentId hostel roomNumber department email');
  if (!payment) throw ApiError.notFound('Payment record not found');
  if (req.user.role === 'student' && payment.student._id.toString() !== req.student._id.toString()) {
    throw ApiError.forbidden('You can only view your own invoices');
  }
  return payment;
};

// GET /api/payments?status=&month=&search=
const listPayments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { limit: 12 });
  const { status, month, search = '', hostel } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (month) filter.month = month;

  if (search.trim() || hostel) {
    const studentFilter = {};
    if (hostel) studentFilter.hostel = hostel;
    if (search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), 'i');
      studentFilter.$or = [{ name: rx }, { studentId: rx }];
    }
    const students = await Student.find(studentFilter).select('_id');
    filter.student = { $in: students.map((s) => s._id) };
  }

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate('student', 'name studentId hostel roomNumber department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  return paginated(res, { items, total, page, limit });
});

// GET /api/payments/me
const listMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ student: req.student._id }).sort({ month: -1 });
  const summary = {
    totalBilled: payments.reduce((s, p) => s + p.amount, 0),
    totalPaid: payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
    outstanding: payments.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.amount, 0),
    paidCount: payments.filter((p) => p.status === 'paid').length,
    pendingCount: payments.filter((p) => p.status !== 'paid').length,
  };
  return sendSuccess(res, { payments, summary, monthlyFee: env.MONTHLY_MESS_FEE });
});

// GET /api/payments/summary?month=
const getPaymentSummary = asyncHandler(async (req, res) => {
  const month = req.query.month || toMonthKey();
  const [agg, monthly] = await Promise.all([
    Payment.aggregate([
      { $match: { month } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: '$month', collected: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
  ]);

  const map = Object.fromEntries(agg.map((a) => [a._id, a]));
  return sendSuccess(res, {
    month,
    paid: map.paid || { count: 0, amount: 0 },
    pending: map.pending || { count: 0, amount: 0 },
    unpaid: map.unpaid || { count: 0, amount: 0 },
    totalRevenue: map.paid?.amount || 0,
    monthly,
  });
});

// POST /api/payments (admin raises an invoice)
const createPayment = asyncHandler(async (req, res) => {
  const { studentId, month, amount, dueDate, notes, status = 'unpaid' } = req.body;
  const student = await Student.findById(studentId);
  if (!student) throw ApiError.notFound('Student not found');
  if (await Payment.exists({ student: student._id, month })) {
    throw ApiError.conflict('An invoice already exists for this student and month');
  }

  const seq = await Payment.countDocuments({ month });
  const payment = await Payment.create({
    student: student._id,
    invoiceNo: `INV-${month.replace('-', '')}-${String(seq + 1).padStart(4, '0')}`,
    month,
    amount: Number(amount) || env.MONTHLY_MESS_FEE,
    breakdown: { messFee: Number(amount) || env.MONTHLY_MESS_FEE },
    dueDate: dueDate ? new Date(dueDate) : new Date(`${month}-10T00:00:00`),
    status,
    notes,
    recordedBy: req.user._id,
  });
  return sendSuccess(res, payment, 'Invoice created', undefined, 201);
});

// POST /api/payments/generate (bulk invoices for active students)
const generateInvoices = asyncHandler(async (req, res) => {
  const month = req.body.month || toMonthKey();
  const students = await Student.find({ subscriptionStatus: 'active', isActive: true });
  const existing = await Payment.find({ month, student: { $in: students.map((s) => s._id) } }).select('student');
  const existingIds = new Set(existing.map((p) => p.student.toString()));
  const pending = students.filter((s) => !existingIds.has(s._id.toString()));

  let seq = await Payment.countDocuments({ month });
  const docs = pending.map((student) => {
    seq += 1;
    return {
      student: student._id,
      invoiceNo: `INV-${month.replace('-', '')}-${String(seq).padStart(4, '0')}`,
      month,
      amount: env.MONTHLY_MESS_FEE,
      breakdown: { messFee: env.MONTHLY_MESS_FEE },
      dueDate: new Date(`${month}-10T00:00:00`),
      status: 'unpaid',
      recordedBy: req.user._id,
    };
  });

  if (docs.length) await Payment.insertMany(docs);
  return sendSuccess(res, { created: docs.length, skipped: students.length - pending.length, month }, 'Invoices generated');
});

// POST /api/payments/:id/pay
const payInvoice = asyncHandler(async (req, res) => {
  const payment = await findOwnedPayment(req);
  if (payment.status === 'paid') throw ApiError.conflict('This invoice is already paid');

  const { method = 'upi', transactionId } = req.body;
  if (env.PAYMENT_GATEWAY_ENABLED && method === 'gateway' && !env.PAYMENT_GATEWAY_KEY) {
    throw ApiError.badRequest('Payment gateway is not configured. Use UPI, card or cash.');
  }

  payment.status = 'paid';
  payment.method = method;
  payment.transactionId = transactionId || `TXN${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
  payment.paidAt = new Date();
  payment.recordedBy = req.user._id;
  await payment.save();
  payment.receiptNo = generateReceiptNo(payment._id);
  await payment.save();

  return sendSuccess(res, payment, 'Payment recorded successfully');
});

// PATCH /api/payments/:id (admin correction)
const updatePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw ApiError.notFound('Payment not found');

  ['amount', 'status', 'method', 'transactionId', 'notes', 'dueDate'].forEach((field) => {
    if (req.body[field] !== undefined) payment[field] = req.body[field];
  });

  if (req.body.amount !== undefined) payment.breakdown.messFee = Number(req.body.amount);
  if (req.body.status === 'paid' && !payment.paidAt) {
    payment.paidAt = new Date();
    payment.receiptNo = payment.receiptNo || generateReceiptNo(payment._id);
    if (payment.method === 'none') payment.method = req.body.method || 'cash';
  }
  if (req.body.status && req.body.status !== 'paid') {
    payment.paidAt = undefined;
  }

  await payment.save();
  return sendSuccess(res, payment, 'Payment updated');
});

// DELETE /api/payments/:id
const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) throw ApiError.notFound('Payment not found');
  return sendSuccess(res, null, 'Payment record deleted');
});

// GET /api/payments/:id/receipt — PDF receipt
const downloadReceipt = asyncHandler(async (req, res) => {
  const payment = await findOwnedPayment(req);
  if (payment.status !== 'paid') throw ApiError.badRequest('Receipts are available only for paid invoices');
  const admin = await User.findOne({ role: 'admin' }).select('name');

  const doc = new PDFDocument({ size: 'A5', margin: 36 });
  const filename = `receipt-${payment.receiptNo || payment.invoiceNo}.pdf`;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  doc.rect(0, 0, doc.page.width, 78).fill('#111C4E');
  doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('IIIT BHUBANESWAR', 36, 22);
  doc.fontSize(9).font('Helvetica').text('Mess Management System · Official Payment Receipt', 36, 46);
  doc.fillColor('#111C4E').fontSize(13).font('Helvetica-Bold').text('PAYMENT RECEIPT', 36, 96);
  doc.fontSize(8).font('Helvetica').fillColor('#475569');
  doc.text(`Receipt No: ${payment.receiptNo}`, 36, 116);
  doc.text(`Invoice No: ${payment.invoiceNo}`, 36, 128);
  doc.text(`Issued: ${new Date(payment.paidAt).toLocaleString('en-IN')}`, 36, 140);

  const rows = [
    ['Student', payment.student.name],
    ['Student ID', payment.student.studentId],
    ['Hostel / Room', `${payment.student.hostel} / ${payment.student.roomNumber}`],
    ['Department', payment.student.department],
    ['Billing Month', monthLabel(payment.month)],
    ['Payment Method', String(payment.method).toUpperCase()],
    ['Transaction ID', payment.transactionId || '—'],
    ['Amount Paid', `INR ${payment.amount.toLocaleString('en-IN')}`],
  ];

  let y = 168;
  doc.roundedRect(36, y, doc.page.width - 72, rows.length * 20 + 16, 6).fillAndStroke('#F8FAFC', '#E2E8F0');
  y += 10;
  rows.forEach(([label, value]) => {
    doc.fillColor('#64748B').fontSize(9).text(label, 48, y, { width: 110 });
    doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(String(value), 170, y, { width: doc.page.width - 220 });
    doc.font('Helvetica');
    y += 20;
  });

  doc.fillColor('#16A34A').fontSize(14).font('Helvetica-Bold').text('PAID', 36, y + 14);
  doc.fillColor('#475569').fontSize(8).font('Helvetica').text(
    `This is a computer generated receipt issued by ${admin?.name || 'Mess Administration'}, IIIT Bhubaneswar.`,
    36,
    y + 42,
    { width: doc.page.width - 72 }
  );
  doc.end();
});

module.exports = {
  listPayments,
  listMyPayments,
  getPaymentSummary,
  createPayment,
  generateInvoices,
  payInvoice,
  updatePayment,
  deletePayment,
  downloadReceipt,
};
