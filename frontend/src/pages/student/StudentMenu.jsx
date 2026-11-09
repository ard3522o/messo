import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Clock3, Download, Printer, Search } from 'lucide-react';
import { Badge, Button, Card, PageHeader } from '../../components/ui';
import { menuApi } from '../../services/endpoints';
import useApi from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { addDaysKey, dayLabel, startOfWeekKey, todayKey } from '../../utils/format';

const MEAL_COLUMNS = [
  { key: 'breakfast', label: 'Breakfast', time: '7:30–9:00 am' },
  { key: 'lunch', label: 'Lunch', time: '12:30–2:30 pm' },
  { key: 'dinner', label: 'Dinner', time: '7:30–9:00 pm' },
];

// Sample menu transcribed from the mess menu supplied with the project.
const SAMPLE_MENU = [
  ['Poha + Matar Curry + Jalebi', 'Rice/Roti + Dalma + Chole + Onion Salad', 'Rice/Roti + Dal + Paneer Masala'],
  ['Idli, Sambar, Chutney', 'Rice/Roti + Dal + Rajma + Dahi boondi + Fryums + Sambar', 'Rice/Roti + Dal + Veg Manchurian / Egg Curry'],
  ['Puri + Ghuguni', 'Rice/Roti + Dal + Chicken 3pcs curry / Paneer Curry + Salad', 'Rice/Roti + Dal + Egg Tadka / Chilli Soyabean + Gulab Jamun'],
  ['Upma + Matar Curry + Tea/Coffee', 'Rice/Roti + Dal + Mushroom (veg) / Prawns (non-veg, 3 pc)', 'Rice/Roti + Dal + Chana-Paneer Curry'],
  ['Uttapam/Masala Chakuli + Sambar + Chutney', 'Rice/Roti + Arhar Dal + Fish Curry / Paneer + Salad', 'Rice/Roti + Dal + Paneer / Chicken Kasa (3pcs)'],
  ['Khakra/Kakera + Aloo Chop + Matar Curry', 'Rice/Roti + Egg Curry + Mix Veg + Papad', 'Rice/Roti + Dal + Chilli Paneer / Chilli Chicken'],
  ['Vada + Matar Curry', 'Chicken / Veg Biryani(Veg) + Raita + Chicken Gravy', 'Rice/Roti + Dal + Chicken Kasa (3pcs) / Paneer Hyderabadi'],
];

function mealText(menu, mealKey, fallback) {
  const items = menu?.meals?.[mealKey]?.items || [];
  return items.length ? items.map((item) => item.name).join(' + ') : fallback;
}

export default function StudentMenu() {
  useDocumentTitle('Weekly menu');
  const [weekStart, setWeekStart] = useState(startOfWeekKey());
  const [query, setQuery] = useState('');
  const { data, loading } = useApi(() => menuApi.week(weekStart), [weekStart]);
  const weekEnd = addDaysKey(weekStart, 6);
  const isCurrentWeek = weekStart === startOfWeekKey();
  const hasPublishedMenu = (data || []).some((day) => day.menu?.isPublished !== false && day.menu);
  const displayDays = Array.from({ length: 7 }, (_, index) => {
    const date = addDaysKey(weekStart, index);
    return data?.find((day) => day.date === date) || { date, menu: null };
  });
  const visibleDays = useMemo(() => displayDays.filter((day, index) => {
    if (!query.trim()) return true;
    const sampleMeals = SAMPLE_MENU[index] || [];
    const mealContent = hasPublishedMenu
      ? MEAL_COLUMNS.map((meal) => mealText(day.menu, meal.key, '')).join(' ')
      : sampleMeals.join(' ');
    return `${dayLabel(day.date)} ${day.date} ${mealContent}`.toLowerCase().includes(query.trim().toLowerCase());
  }), [data, displayDays, hasPublishedMenu, query]);

  const exportCsv = () => {
    const escapeCell = (value) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [
      ['Day', ...MEAL_COLUMNS.map((meal) => `${meal.label} (${meal.time})`)],
      ...visibleDays.map((day) => {
        const index = displayDays.findIndex((item) => item.date === day.date);
        const meals = hasPublishedMenu
          ? MEAL_COLUMNS.map((meal) => mealText(day.menu, meal.key, 'Menu not published'))
          : SAMPLE_MENU[index];
        return [dayLabel(day.date), ...meals];
      }),
    ];
    const csv = rows.map((row) => row.map(escapeCell).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `mess-menu-${weekStart}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Weekly mess menu"
        subtitle="Breakfast, lunch and dinner for the week. Published menus may change at short notice."
        className="no-print"
        actions={
          <div className="flex items-center gap-1.5">
            <Button variant="secondary" size="sm" icon={ChevronLeft} onClick={() => setWeekStart(addDaysKey(weekStart, -7))}>Prev</Button>
            <Button variant={isCurrentWeek ? 'primary' : 'secondary'} size="sm" onClick={() => setWeekStart(startOfWeekKey())}>
              {isCurrentWeek ? 'This week' : 'Jump to today'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setWeekStart(addDaysKey(weekStart, 7))}>
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <CalendarDays className="h-4 w-4 text-brand-600" />
          {new Date(`${weekStart}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          {' – '}
          {new Date(`${weekEnd}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
        {!loading && !hasPublishedMenu && <Badge variant="amber">Sample menu</Badge>}
      </div>

      {!loading && !hasPublishedMenu && (
        <p className="no-print mb-3 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Showing the sample menu from the supplied schedule. The mess admin’s published menu will appear here when available.
        </p>
      )}

      <div className="no-print mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input !py-2 !pl-9"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a dish or day…"
            aria-label="Search weekly menu"
          />
        </label>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={Download} onClick={exportCsv}>Export CSV</Button>
          <Button variant="secondary" size="sm" icon={Printer} onClick={() => window.print()}>Print</Button>
        </div>
      </div>

      <Card className="menu-print-area overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="bg-slate-50">
                <th className="w-36 border-b border-r border-slate-200 px-4 py-3 text-xs font-bold text-navy-900">Day</th>
                {MEAL_COLUMNS.map((meal) => (
                  <th key={meal.key} className="border-b border-r border-slate-200 px-4 py-3 last:border-r-0">
                    <span className="block text-xs font-bold text-navy-900">{meal.label}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-slate-500"><Clock3 className="h-3 w-3" />{meal.time}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDays.map((day) => {
                const index = displayDays.findIndex((item) => item.date === day.date);
                const sampleMeals = SAMPLE_MENU[index];
                const isToday = day.date === todayKey();
                return (
                  <tr key={day.date} className={isToday ? 'bg-brand-50/50' : 'bg-white'}>
                    <th className="border-b border-r border-slate-200 px-4 py-4 text-sm font-bold text-navy-900">
                      <span className="block">{dayLabel(day.date)}</span>
                      <span className="mt-0.5 block text-[11px] font-medium text-slate-500">
                        {new Date(`${day.date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        {isToday && <Badge variant="blue" className="ml-2">Today</Badge>}
                      </span>
                    </th>
                    {MEAL_COLUMNS.map((meal, mealIndex) => (
                      <td key={meal.key} className="border-b border-r border-slate-200 px-4 py-4 text-[13px] leading-relaxed text-slate-700 last:border-r-0">
                        {hasPublishedMenu
                          ? mealText(day.menu, meal.key, 'Menu not published')
                          : sampleMeals[mealIndex]}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {loading && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">Loading weekly menu…</td></tr>
              )}
              {!loading && visibleDays.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-500">No menu entries match “{query}”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
