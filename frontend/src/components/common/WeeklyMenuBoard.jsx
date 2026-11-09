import { CalendarDays, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { MEALS, MEAL_META } from '../../utils/constants';
import { dayLabel } from '../../utils/format';

export default function WeeklyMenuBoard({ days = [], selectedDate, onSelect, compact = false }) {
  return (
    <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2 xl:grid-cols-4' : 'sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'}`}>
      {days.map(({ date, menu }) => {
        const isToday = date === new Date().toISOString().slice(0, 10);
        return (
          <button
            key={date}
            type="button"
            onClick={() => onSelect?.(date)}
            className={clsx(
              'card card-hover overflow-hidden p-0 text-left transition',
              selectedDate === date && 'border-brand-300 ring-2 ring-brand-500/20',
              isToday && 'border-brand-200'
            )}
          >
            <div className={clsx('flex items-center justify-between px-4 py-3', isToday ? 'bg-gradient-to-r from-brand-600 to-navy-800 text-white' : 'border-b border-slate-100 bg-slate-50/60')}>
              <div>
                <p className={clsx('text-[13px] font-extrabold', isToday ? 'text-white' : 'text-navy-900')}>{dayLabel(date)}</p>
                <p className={clsx('text-[10.5px] font-semibold', isToday ? 'text-white/70' : 'text-slate-400')}>
                  {new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              {isToday ? <Sparkles className="h-4 w-4 text-amber-300" /> : <CalendarDays className="h-4 w-4 text-slate-300" />}
            </div>
            <div className="space-y-2.5 p-4">
              {MEALS.map((meal) => {
                const meta = MEAL_META[meal];
                const items = menu?.meals?.[meal]?.items || [];
                return (
                  <div key={meal}>
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-400">
                      {meta.emoji} {meta.label}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] font-medium leading-snug text-slate-600">
                      {items.length ? items.map((i) => i.name).join(' · ') : 'Not published'}
                    </p>
                  </div>
                );
              })}
              {menu?.specialNote && (
                <p className="rounded-lg bg-amber-50 px-2 py-1.5 text-[10.5px] font-semibold text-amber-700">{menu.specialNote}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
