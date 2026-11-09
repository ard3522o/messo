import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card } from '../ui';
import { compactCurrency, currency } from '../../utils/format';

export const CHART_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#111C4E', '#EC4899', '#0EA5E9'];

const axisStyle = { fontSize: 11, fill: '#94A3B8', fontWeight: 600 };
const gridStyle = { stroke: '#EEF2F7', strokeDasharray: '4 4' };

export function ChartCard({ title, subtitle, action, children, className = '', height = 280 }) {
  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2 px-5 pt-5">
        <div>
          <h3 className="section-title">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="px-2 pb-3 pt-2" style={{ height }}>
        {children}
      </div>
    </Card>
  );
}

const ChartTooltip = ({ active, payload, label, valueFormatter = (v) => v }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-card">
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="h-2 w-2 rounded-full" style={{ background: item.color || item.fill }} />
          <span className="capitalize">{item.name}:</span>
          <span className="ml-auto">{valueFormatter(item.value)}</span>
        </p>
      ))}
    </div>
  );
};

export function AttendanceTrendChart({ data = [], height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <defs>
          {['#4F46E5', '#10B981', '#F59E0B', '#111C4E'].map((color, i) => (
            <linearGradient key={color} id={`attendanceGradient${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.18} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...gridStyle} vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={20} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={38} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Area type="monotone" dataKey="breakfast" name="Breakfast" stroke="#4F46E5" fill="url(#attendanceGradient0)" strokeWidth={2} />
        <Area type="monotone" dataKey="lunch" name="Lunch" stroke="#10B981" fill="url(#attendanceGradient1)" strokeWidth={2} />
        <Area type="monotone" dataKey="snacks" name="Snacks" stroke="#F59E0B" fill="url(#attendanceGradient2)" strokeWidth={2} />
        <Area type="monotone" dataKey="dinner" name="Dinner" stroke="#111C4E" fill="url(#attendanceGradient3)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RevenueChart({ data = [], height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }} barGap={3}>
        <CartesianGrid {...gridStyle} vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={46} tickFormatter={(v) => compactCurrency(v)} />
        <Tooltip content={<ChartTooltip valueFormatter={(v) => currency(v)} />} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Bar dataKey="collected" name="Collected" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={30} />
        <Bar dataKey="pending" name="Pending" fill="#E2E8F0" radius={[6, 6, 0, 0]} maxBarSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MealBarChart({ data = [], dataKey = 'count', height = 250, color = '#4F46E5', horizontal = false }) {
  const formatted = data.map((d) => ({ ...d, name: d.name || d.meal?.replace(/_/g, ' ') }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={formatted}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 8, right: 20, left: horizontal ? 12 : 0, bottom: 0 }}
      >
        <CartesianGrid {...gridStyle} vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tick={axisStyle} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} width={86} />
          </>
        ) : (
          <>
            <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
            <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
          </>
        )}
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
        <Bar dataKey={dataKey} name="Students" radius={[6, 6, 6, 6]} maxBarSize={38} fill={color}>
          {formatted.map((entry, index) => (
            <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({ data = [], height = 230, centerLabel, centerValue, valueFormatter = (v) => v }) {
  return (
    <div className="relative h-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-extrabold text-navy-900">{centerValue}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{centerLabel}</p>
        </div>
      )}
    </div>
  );
}

export function RatingTrendChart({ data = [], height = 250 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid {...gridStyle} vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={axisStyle} tickLine={false} axisLine={false} width={28} />
        <Tooltip content={<ChartTooltip valueFormatter={(v) => `${Number(v).toFixed(1)} / 5`} />} />
        <Line type="monotone" dataKey="average" name="Rating" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3, fill: '#F59E0B', strokeWidth: 0 }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ConsumptionChart({ data = [], height = 270 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid {...gridStyle} vertical={false} />
        <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={38} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(79,70,229,0.04)' }} />
        <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Bar dataKey="consumption" name="Consumption" fill="#4F46E5" radius={[5, 5, 0, 0]} maxBarSize={24} />
        <Bar dataKey="wastage" name="Wastage" fill="#F43F5E" radius={[5, 5, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}
