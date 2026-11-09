import { useState } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import clsx from 'clsx';

export default function ImageWithFallback({ src, alt, className, iconClassName }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={clsx(
          'flex items-center justify-center bg-gradient-to-br from-brand-100 via-slate-100 to-amber-50 text-brand-300',
          className
        )}
      >
        <UtensilsCrossed className={clsx('h-7 w-7', iconClassName)} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={clsx('object-cover', className)}
    />
  );
}
