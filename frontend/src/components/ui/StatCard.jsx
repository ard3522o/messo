import clsx from 'clsx';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

const TONES = {
  brand: 'bg-brand-50 text-brand-600',
  navy: 'bg-navy-50 text-navy-700',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  sky: 'bg-sky-50 text-sky-600',
  purple: 'bg-purple-50 text-purple-600',
};

export default function StatCard({ label, value, hint, icon: Icon, tone = 'brand', trend, loading = false, className }) {
  return (
    <div className={clsx('card card-hover p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12.5px] font-semibold text-slate-500">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 skeleton" />
          ) : (
            <p className="mt-1.5 truncate text-[26px] font-extrabold leading-tight tracking-tight text-navy-900">{value}</p>
          )}
        </div>
        {Icon && (
          <div className={clsx('icon-tile', TONES[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        {typeof trend === 'number' && (
          <span
            className={clsx(
              'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-bold',
              trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            )}
          >
            {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
        {hint && <span className="truncate text-slate-400">{hint}</span>}
      </div>
    </div>
  );
}
