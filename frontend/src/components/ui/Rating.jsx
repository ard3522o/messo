import { useState } from 'react';
import { Star } from 'lucide-react';
import clsx from 'clsx';

const SIZES = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-7 w-7' };

export default function Rating({ value = 0, onChange, size = 'sm', className, showValue = false }) {
  const [hover, setHover] = useState(0);
  const interactive = Boolean(onChange);
  const display = hover || value;

  return (
    <div className={clsx('inline-flex items-center gap-0.5', className)} role={interactive ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={clsx(interactive && 'transition hover:scale-110', !interactive && 'cursor-default')}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Star
            className={clsx(
              SIZES[size],
              star <= display ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'
            )}
          />
        </button>
      ))}
      {showValue && <span className="ml-1.5 text-xs font-bold text-slate-600">{Number(value || 0).toFixed(1)}</span>}
    </div>
  );
}
