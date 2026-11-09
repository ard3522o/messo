import { useState } from 'react';
import { FileSpreadsheet, FileText, Download, FileBarChart, CalendarRange } from 'lucide-react';
import { Button, Card, Input, PageHeader, Select } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { downloadFile, getErrorMessage } from '../../services/api';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { monthKey, todayKey, addDaysKey } from '../../utils/format';

const REPORTS = {
  attendance: {
    title: 'Meal attendance',
    description: 'Day-wise, meal-wise attendance records with student, hostel and check-in method.',
    icon: CalendarRange,
    range: true,
    tone: 'text-brand-600 bg-brand-50',
  },
  payments: {
    title: 'Fee collection',
    description: 'Monthly invoices, collected and outstanding amounts, transaction IDs and payment mode.',
    icon: FileBarChart,
    range: false,
    tone: 'text-emerald-600 bg-emerald-50',
  },
  complaints: {
    title: 'Complaint resolution',
    description: 'Complaint register with category, priority, status, resolution timestamps and turnaround.',
    icon: FileText,
    range: true,
    tone: 'text-amber-600 bg-amber-50',
  },
  feedback: {
    title: 'Food ratings',
    description: 'Meal-wise ratings, feedback themes and student comments for service review.',
    icon: FileText,
    range: true,
    tone: 'text-purple-600 bg-purple-50',
  },
  inventory: {
    title: 'Inventory & stock',
    description: 'Current stock levels, low-stock flags, stock value and supplier information.',
    icon: FileSpreadsheet,
    range: false,
    tone: 'text-navy-700 bg-navy-50',
  },
};

export default function ReportsPage({ allowed = ['attendance', 'complaints', 'feedback', 'inventory'], title = 'Reports & exports' }) {
  useDocumentTitle(title);
  const toast = useToast();
  const [type, setType] = useState(allowed[0]);
  const [from, setFrom] = useState(addDaysKey(todayKey(), -29));
  const [to, setTo] = useState(todayKey());
  const [month, setMonth] = useState(monthKey());
  const [downloading, setDownloading] = useState('');
  const report = REPORTS[type];

  const handleDownload = async (format) => {
    setDownloading(format);
    try {
      const params = { format };
      if (report.range) {
        params.from = from;
        params.to = to;
      }
      if (type === 'payments') params.month = month;
      const filename = await downloadFile(`/reports/${type}`, params);
      toast.success(`${filename} downloaded`);
    } catch (error) {
      toast.error(getErrorMessage(error), 'Export failed');
    } finally {
      setDownloading('');
    }
  };

  return (
    <div>
      <PageHeader
        title={title}
        subtitle="Generate official mess reports with filtered data, then download them as PDF or Excel workbooks."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="section-title">Configure your report</h3>
          <p className="mt-1 text-[12.5px] text-slate-500">Choose a report, set the period, and export.</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {allowed.map((key) => {
              const item = REPORTS[key];
              const Icon = item.icon;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                    type === key ? 'border-brand-400 bg-brand-50/60 ring-2 ring-brand-500/10' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`icon-tile h-9 w-9 rounded-lg ${item.tone}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span>
                    <span className="block text-[12.5px] font-bold text-navy-900">{item.title}</span>
                    <span className="mt-0.5 block text-[10.5px] leading-snug text-slate-500">{item.description}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Report period</p>
            {type === 'payments' ? (
              <Input label="Billing month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="mt-2 max-w-xs" />
            ) : report.range ? (
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <Input label="From" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
                <Input label="To" type="date" value={to} min={from} max={todayKey()} onChange={(e) => setTo(e.target.value)} />
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500">This report reflects the current stock position at the time of export.</p>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="danger" icon={FileText} loading={downloading === 'pdf'} onClick={() => handleDownload('pdf')}>
              Download PDF
            </Button>
            <Button variant="secondary" icon={FileSpreadsheet} loading={downloading === 'xlsx'} onClick={() => handleDownload('xlsx')} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              Download Excel
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-white">
            <Download className="h-5 w-5" />
          </div>
          <h3 className="mt-3 text-sm font-bold text-navy-900">What’s included</h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">{report.description}</p>
          <ul className="mt-4 space-y-2 text-[11.5px] text-slate-500">
            <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500" /> Official IIIT Bhubaneswar report header and generation timestamp</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500" /> Filtered, database-backed records — no placeholder numbers</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500" /> PDF pagination and Excel auto-filter with frozen headers</li>
            <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-500" /> Summary totals for quick review</li>
          </ul>
          <div className="mt-5 rounded-lg bg-amber-50 px-3 py-2 text-[10.5px] font-medium text-amber-700">
            Exports contain student data. Share them only with authorised mess staff.
          </div>
        </Card>
      </div>
    </div>
  );
}
