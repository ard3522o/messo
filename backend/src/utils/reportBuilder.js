const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { monthLabel } = require('./dates');

const NAVY = '#111C4E';
const INDIGO = '#4F46E5';

const truncate = (value, max) => {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const drawPdfTable = (doc, { title, subtitle, summary = [], columns, rows }) => {
  const margins = 36;
  const pageWidth = doc.page.width - margins * 2;

  doc.rect(0, 0, doc.page.width, 72).fill(NAVY);
  doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(16).text('IIIT BHUBANESWAR', margins, 20);
  doc.font('Helvetica').fontSize(8).text('Smart Mess Management System', margins, 42);
  doc.fontSize(8).text(`Generated: ${new Date().toLocaleString('en-IN')}`, margins, 42, { align: 'right', width: pageWidth });

  doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(15).text(title, margins, 92);
  if (subtitle) {
    doc.fillColor('#64748B').font('Helvetica').fontSize(9).text(subtitle, margins, 113);
  }

  let y = subtitle ? 132 : 120;
  if (summary.length) {
    doc.fontSize(9).fillColor('#334155').font('Helvetica');
    doc.text(summary.join('     |     '), margins, y, { width: pageWidth });
    y += 22;
  }

  const totalWeight = columns.reduce((s, c) => s + c.width, 0);
  const widths = columns.map((c) => (c.width / totalWeight) * pageWidth);
  const rowHeight = 22;

  const drawHeader = () => {
    doc.rect(margins, y, pageWidth, rowHeight).fill(NAVY);
    let x = margins;
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(8);
    columns.forEach((col, i) => {
      doc.text(col.header.toUpperCase(), x + 6, y + 7, { width: widths[i] - 10, height: 14, ellipsis: true, lineBreak: false });
      x += widths[i];
    });
    y += rowHeight;
  };

  drawHeader();

  rows.forEach((row, index) => {
    if (y + rowHeight > doc.page.height - 50) {
      doc.addPage();
      y = 50;
      drawHeader();
    }
    if (index % 2 === 0) doc.rect(margins, y, pageWidth, rowHeight).fill('#F8FAFC');
    let x = margins;
    doc.fillColor('#1E293B').font('Helvetica').fontSize(8);
    columns.forEach((col, i) => {
      const maxChars = Math.max(6, Math.floor(widths[i] / 4.6));
      doc.text(truncate(row[col.key], maxChars), x + 6, y + 7, {
        width: widths[i] - 10,
        height: 14,
        ellipsis: true,
        lineBreak: false,
      });
      x += widths[i];
    });
    y += rowHeight;
  });

  if (!rows.length) {
    doc.fillColor('#64748B').fontSize(10).text('No records found for the selected filters.', margins, y + 18);
  }
};

const streamPdf = (res, { title, subtitle, summary, columns, rows, filename }) => {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, bufferPages: true });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);
  drawPdfTable(doc, { title, subtitle, summary, columns, rows });

  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);
    doc.fillColor('#94A3B8').fontSize(7).text(
      `Page ${i + 1} of ${range.count}  ·  Mess Management System`,
      36,
      doc.page.height - 28,
      { width: doc.page.width - 72, align: 'center', lineBreak: false }
    );
  }
  doc.end();
};

const streamExcel = async (res, { sheetName, columns, rows, filename }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'IIIT Bhubaneswar Mess Management';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName, { views: [{ state: 'frozen', ySplit: 1 }] });

  sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.excelWidth || 20 }));
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY.slice(1)}` } };
  sheet.getRow(1).height = 24;
  sheet.getRow(1).alignment = { vertical: 'middle' };

  rows.forEach((row) => sheet.addRow(row));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
};

const paymentColumns = [
  { header: 'Invoice No', key: 'invoiceNo', width: 2.4, excelWidth: 18 },
  { header: 'Student', key: 'student', width: 2.8, excelWidth: 24 },
  { header: 'Student ID', key: 'studentId', width: 1.8, excelWidth: 14 },
  { header: 'Month', key: 'month', width: 1.6, excelWidth: 15 },
  { header: 'Amount (INR)', key: 'amount', width: 1.6, excelWidth: 15 },
  { header: 'Status', key: 'status', width: 1.4, excelWidth: 12 },
  { header: 'Method', key: 'method', width: 1.4, excelWidth: 13 },
  { header: 'Transaction ID', key: 'transactionId', width: 2.6, excelWidth: 24 },
  { header: 'Paid On', key: 'paidAt', width: 2, excelWidth: 20 },
];

const attendanceColumns = [
  { header: 'Date', key: 'date', width: 1.6, excelWidth: 14 },
  { header: 'Student', key: 'student', width: 2.6, excelWidth: 24 },
  { header: 'Student ID', key: 'studentId', width: 1.8, excelWidth: 14 },
  { header: 'Hostel / Room', key: 'hostel', width: 2, excelWidth: 18 },
  { header: 'Meal', key: 'meal', width: 1.4, excelWidth: 12 },
  { header: 'Status', key: 'status', width: 1.3, excelWidth: 11 },
  { header: 'Method', key: 'method', width: 1.2, excelWidth: 11 },
  { header: 'Marked At', key: 'markedAt', width: 2, excelWidth: 20 },
];

const complaintColumns = [
  { header: 'Complaint No', key: 'complaintNo', width: 1.8, excelWidth: 16 },
  { header: 'Student', key: 'student', width: 2.4, excelWidth: 22 },
  { header: 'Category', key: 'category', width: 2, excelWidth: 18 },
  { header: 'Subject', key: 'subject', width: 3.4, excelWidth: 34 },
  { header: 'Priority', key: 'priority', width: 1.3, excelWidth: 11 },
  { header: 'Status', key: 'status', width: 1.4, excelWidth: 13 },
  { header: 'Created', key: 'createdAt', width: 1.9, excelWidth: 19 },
  { header: 'Resolved', key: 'resolvedAt', width: 1.9, excelWidth: 19 },
];

const feedbackColumns = [
  { header: 'Date', key: 'date', width: 1.5, excelWidth: 13 },
  { header: 'Student', key: 'student', width: 2.4, excelWidth: 22 },
  { header: 'Meal', key: 'meal', width: 1.4, excelWidth: 12 },
  { header: 'Rating', key: 'rating', width: 1.1, excelWidth: 10 },
  { header: 'Tags', key: 'tags', width: 2.4, excelWidth: 24 },
  { header: 'Comment', key: 'comment', width: 4, excelWidth: 40 },
];

const inventoryColumns = [
  { header: 'Item', key: 'name', width: 2.6, excelWidth: 24 },
  { header: 'Category', key: 'category', width: 1.8, excelWidth: 16 },
  { header: 'Quantity', key: 'quantity', width: 1.3, excelWidth: 12 },
  { header: 'Unit', key: 'unit', width: 1, excelWidth: 9 },
  { header: 'Min Threshold', key: 'minThreshold', width: 1.6, excelWidth: 14 },
  { header: 'Unit Price (INR)', key: 'unitPrice', width: 1.8, excelWidth: 16 },
  { header: 'Stock Value (INR)', key: 'stockValue', width: 1.9, excelWidth: 18 },
  { header: 'Supplier', key: 'supplier', width: 2.6, excelWidth: 24 },
  { header: 'Low Stock', key: 'lowStock', width: 1.3, excelWidth: 12 },
];

module.exports = {
  streamPdf,
  streamExcel,
  paymentColumns,
  attendanceColumns,
  complaintColumns,
  feedbackColumns,
  inventoryColumns,
  monthLabel,
  INDIGO,
};
