import clsx from 'clsx';

export default function PageHeader({ title, subtitle, actions, eyebrow, children, className }) {
  return (
    <div className={clsx('mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end', className)}>
      <div>
        {eyebrow && <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">{eyebrow}</p>}
        <h1 className="text-[22px] font-extrabold tracking-tight text-navy-900 sm:text-[26px]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
