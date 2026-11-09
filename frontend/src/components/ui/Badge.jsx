import clsx from 'clsx';
import { capitalize } from '../../utils/format';

const VARIANTS = {
  green: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
  red: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  blue: 'bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200',
  navy: 'bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-200',
  purple: 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200',
  gray: 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200',
};

export default function Badge({ children, variant = 'gray', className, dot = false }) {
  return (
    <span className={clsx('badge', VARIANTS[variant], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

const STATUS_MAP = {
  paid: ['green', 'Paid'],
  pending: ['amber', 'Pending'],
  unpaid: ['red', 'Unpaid'],
  present: ['green', 'Present'],
  absent: ['red', 'Absent'],
  open: ['amber', 'Open'],
  in_progress: ['blue', 'In Progress'],
  resolved: ['green', 'Resolved'],
  rejected: ['gray', 'Rejected'],
  active: ['green', 'Active'],
  inactive: ['gray', 'Inactive'],
  expired: ['red', 'Expired'],
  cancelled: ['gray', 'Cancelled'],
  low: ['gray', 'Low'],
  medium: ['amber', 'Medium'],
  high: ['red', 'High'],
  urgent: ['purple', 'Urgent'],
};

export function StatusBadge({ status, label }) {
  const [variant, defaultLabel] = STATUS_MAP[status] || ['gray', capitalize(status)];
  return (
    <Badge variant={variant} dot>
      {label || defaultLabel}
    </Badge>
  );
}
