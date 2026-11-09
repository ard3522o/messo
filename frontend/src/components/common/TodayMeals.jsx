import { CheckCircle2, Clock3, UtensilsCrossed } from 'lucide-react';
import { Badge, ImageWithFallback } from '../ui';
import { MEAL_META, MEALS } from '../../utils/constants';
import { formatTime } from '../../utils/format';

export default function TodayMeals({ menu, records = [], compact = false }) {
  const checkedIn = (meal) => records.some((r) => r.meal === meal && r.status === 'present');

  return (
    <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 xl:grid-cols-4'}`}>
      {MEALS.map((meal) => {
        const meta = MEAL_META[meal];
        const mealData = menu?.meals?.[meal];
        const isChecked = checkedIn(meal);
        return (
          <div key={meal} className={`card overflow-hidden ${!mealData ? 'opacity-80' : ''}`}>
            <div className="relative h-24 w-full">
              <ImageWithFallback
                src={mealData?.items?.find((i) => i.image)?.image}
                alt={meta.label}
                className="h-full w-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/10 to-transparent" />
              <div className="absolute inset-x-3 bottom-2 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">{meta.emoji} {meta.label}</p>
                  <p className="text-[11px] font-semibold text-white/90">
                    {formatTime(mealData?.startTime || meta.time.split('–')[0])} – {formatTime(mealData?.endTime)}
                  </p>
                </div>
                {isChecked ? (
                  <Badge variant="green" className="bg-emerald-500 text-white ring-0">
                    <CheckCircle2 className="h-3 w-3" /> Marked
                  </Badge>
                ) : (
                  <Badge variant="gray" className="bg-white/90 text-slate-600 ring-0">
                    <Clock3 className="h-3 w-3" /> Pending
                  </Badge>
                )}
              </div>
            </div>
            <div className="p-3.5">
              {mealData?.items?.length ? (
                <div className="flex flex-wrap gap-1">
                  {mealData.items.slice(0, 4).map((item) => (
                    <span
                      key={item._id || item.name}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-1.5 py-1 text-[10.5px] font-semibold text-slate-600 ring-1 ring-slate-100"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${item.category === 'non-veg' ? 'bg-rose-500' : item.category === 'vegan' ? 'bg-emerald-500' : 'bg-emerald-600'}`} />
                      {item.name}
                    </span>
                  ))}
                  {mealData.items.length > 4 && (
                    <span className="text-[10.5px] font-semibold text-slate-400">+{mealData.items.length - 4} more</span>
                  )}
                </div>
              ) : (
                <p className="flex items-center gap-1.5 text-[11.5px] text-slate-400">
                  <UtensilsCrossed className="h-3.5 w-3.5" /> Menu not published yet
                </p>
              )}
              {mealData?.isAvailable === false && (
                <p className="mt-2 rounded-md bg-rose-50 px-2 py-1 text-[10.5px] font-bold text-rose-600">Counter closed for this meal</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
