const toDateKey = (date = new Date()) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const toMonthKey = (date = new Date()) => toDateKey(date).slice(0, 7);

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

/** Inclusive list of YYYY-MM-DD keys between two dates. */
const dateRangeKeys = (from, to) => {
  const keys = [];
  let cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);
  while (cursor <= end) {
    keys.push(toDateKey(cursor));
    cursor = addDays(cursor, 1);
  }
  return keys;
};

const startOfWeekKey = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // week starts Monday
  return toDateKey(addDays(d, diff));
};

const weekKeys = (startKey) => Array.from({ length: 7 }, (_, i) => toDateKey(addDays(new Date(`${startKey}T00:00:00`), i)));

const monthKeyRange = (months = 6) => {
  const keys = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i -= 1) {
    keys.push(toMonthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return keys;
};

const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

const dayLabel = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

module.exports = {
  toDateKey,
  toMonthKey,
  addDays,
  dateRangeKeys,
  startOfWeekKey,
  weekKeys,
  monthKeyRange,
  monthLabel,
  dayLabel,
};
