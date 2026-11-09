import clsx from 'clsx';

export default function Tabs({ items, active, onChange, className }) {
  return (
    <div className={clsx('no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1', className)}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={clsx(
            'whitespace-nowrap rounded-lg px-3.5 py-2 text-[12.5px] font-bold transition',
            active === item.key ? 'bg-white text-navy-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span
              className={clsx(
                'ml-1.5 rounded-md px-1.5 py-0.5 text-[10px]',
                active === item.key ? 'bg-brand-50 text-brand-700' : 'bg-slate-200/70 text-slate-500'
              )}
            >
              {item.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
