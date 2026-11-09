import clsx from 'clsx';
import { initials } from '../../utils/format';

const COLORS = [
  'bg-brand-100 text-brand-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
  'bg-rose-100 text-rose-700',
  'bg-purple-100 text-purple-700',
];

const SIZES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

export default function Avatar({ name = '', size = 'sm', className, src }) {
  const color = COLORS[(name.charCodeAt(0) + (name.charCodeAt(1) || 0)) % COLORS.length];
  if (src) {
    return <img src={src} alt={name} className={clsx('rounded-full object-cover', SIZES[size], className)} />;
  }
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-bold',
        color,
        SIZES[size],
        className
      )}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </span>
  );
}
