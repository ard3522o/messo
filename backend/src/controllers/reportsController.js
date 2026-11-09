const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { toDateKey, toMonthKey, addDays, monthLabel } = require('../utils/dates');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const Inventory = require('../models/Inventory');
const {
  streamPdf,
  streamExcel,
  paymentColumns,
  attendanceColumns,
  complaintColumns,
  feedbackColumns,
  inventoryColumns,
} = require('../utils/reportBuilder');

const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const titleCase = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// GET /api/reports/:type?format=pdf|xlsx&from=&to=&month=
const generateReport = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const format = req.query.format === 'xlsx' ? 'xlsx' : 'pdf';
  const from = req.query.from || toDateKey(addDays(new Date(), -29));
  const to = req.query.to || toDateKey();
  const month = req.query.month || toMonthKey();
  const stamp = new Date().toISOString().slice(0, 10);

  let config;

  if (type === 'attendance') {
    const records = await Attendance.find({ date: { $gte: from, $lte: to } })
      .populate('student', 'name studentId hostel roomNumber')
      .sort({ date: -1, meal: 1 })
      .limit(5000);
    const rows = records.map((r) => ({
      date: r.date,
      student: r.student?.name || '—',
      studentId: r.student?.studentId || '—',
      hostel: r.student ? `${r.student.hostel} / ${r.student.roomNumber}` : '—',
      meal: titleCase(r.meal),
      status: titleCase(r.status),
      method: titleCase(r.method),
      markedAt: fmtDate(r.markedAt),
    }));
    const present = records.filter((r) => r.status === 'present').length;
    config = {
      title: 'Meal Attendance Report',
      subtitle: `${from} to ${to}`,
      summary: [`Records: ${records.length}`, `Present: ${present}`, `Absent: ${records.length - present}`],
      columns: attendanceColumns,
      rows,
      sheetName: 'Attendance',
      filename: `attendance-${from}-to-${to}.${format}`,
    };
  } else if (type === 'payments') {
    const payments = await Payment.find({ month })
      .populate('student', 'name studentId')
      .sort({ createdAt: 1 });
    const rows = payments.map((p) => ({
      invoiceNo: p.invoiceNo,
      student: p.student?.name || '—',
      studentId: p.student?.studentId || '—',
      month: monthLabel(p.month),
      amount: p.amount,
      status: titleCase(p.status),
      method: titleCase(p.method),
      transactionId: p.transactionId || '—',
      paidAt: fmtDate(p.paidAt),
    }));
    const paid = payments.filter((p) => p.status === 'paid');
    config = {
      title: 'Mess Fee Collection Report',
      subtitle: monthLabel(month),
      summary: [
        `Invoices: ${payments.length}`,
        `Collected: INR ${paid.reduce((s, p) => s + p.amount, 0).toLocaleString('en-IN')}`,
        `Outstanding: INR ${payments.filter((p) => p.status !== 'paid').reduce((s, p) => s + p.amount, 0).toLocaleString('en-IN')}`,
      ],
      columns: paymentColumns,
      rows,
      sheetName: 'Payments',
      filename: `payments-${month}.${format}`,
    };
  } else if (type === 'complaints') {
    const complaints = await Complaint.find({ createdAt: { $gte: new Date(`${from}T00:00:00`), $lte: new Date(`${to}T23:59:59`) } })
      .populate('student', 'name studentId')
      .sort({ createdAt: -1 });
    config = {
      title: 'Complaint Resolution Report',
      subtitle: `${from} to ${to}`,
      summary: [
        `Total: ${complaints.length}`,
        `Resolved: ${complaints.filter((c) => c.status === 'resolved').length}`,
        `Open: ${complaints.filter((c) => c.status === 'open').length}`,
      ],
      columns: complaintColumns,
      rows: complaints.map((c) => ({
        complaintNo: c.complaintNo,
        student: c.student?.name || '—',
        category: c.category,
        subject: c.subject,
        priority: titleCase(c.priority),
        status: titleCase(c.status),
        createdAt: fmtDate(c.createdAt),
        resolvedAt: fmtDate(c.resolvedAt),
      })),
      sheetName: 'Complaints',
      filename: `complaints-${stamp}.${format}`,
    };
  } else if (type === 'feedback') {
    const feedback = await Feedback.find({ date: { $gte: from, $lte: to } })
      .populate('student', 'name studentId')
      .sort({ date: -1 });
    const avg = feedback.length ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : 0;
    config = {
      title: 'Food Feedback & Ratings Report',
      subtitle: `${from} to ${to}`,
      summary: [`Responses: ${feedback.length}`, `Average rating: ${avg.toFixed(2)} / 5`],
      columns: feedbackColumns,
      rows: feedback.map((f) => ({
        date: f.date,
        student: f.isAnonymous ? 'Anonymous' : f.student?.name || '—',
        meal: titleCase(f.meal),
        rating: f.rating,
        tags: f.tags.join(', ') || '—',
        comment: f.comment || '—',
      })),
      sheetName: 'Feedback',
      filename: `feedback-${stamp}.${format}`,
    };
  } else if (type === 'inventory') {
    const items = await Inventory.find({ isActive: true }).sort({ category: 1, name: 1 });
    config = {
      title: 'Inventory & Stock Report',
      subtitle: 'Current stock position',
      summary: [
        `Items: ${items.length}`,
        `Low stock: ${items.filter((i) => i.quantity <= i.minThreshold).length}`,
        `Stock value: INR ${Math.round(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)).toLocaleString('en-IN')}`,
      ],
      columns: inventoryColumns,
      rows: items.map((i) => ({
        name: i.name,
        category: i.category,
        quantity: i.quantity,
        unit: i.unit,
        minThreshold: i.minThreshold,
        unitPrice: i.unitPrice,
        stockValue: Math.round(i.quantity * i.unitPrice),
        supplier: i.supplier || '—',
        lowStock: i.quantity <= i.minThreshold ? 'Yes' : 'No',
      })),
      sheetName: 'Inventory',
      filename: `inventory-${stamp}.${format}`,
    };
  } else {
    throw ApiError.badRequest('Unsupported report type');
  }

  if (format === 'xlsx') {
    return streamExcel(res, config);
  }
  return streamPdf(res, config);
});

module.exports = { generateReport };
