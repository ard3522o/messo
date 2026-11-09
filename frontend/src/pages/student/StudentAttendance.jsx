import { useState } from 'react';
import { CalendarCheck, CheckCircle2, Clock3, History, QrCode, XCircle } from 'lucide-react';
import { Badge, Button, Card, CardHeader, Input, PageHeader, StatCard, StatusBadge } from '../../components/ui';
import QrCheckIn from '../../components/common/QrCheckIn';
import { MealBarChart, ChartCard } from '../../components/charts';
import { attendanceApi } from '../../services/endpoints';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { capitalize, formatTime, monthKey, monthLabel, todayKey } from '../../utils/format';
import { MEALS, MEAL_META } from '../../utils/constants';

export default function StudentAttendance() {
  useDocumentTitle('Meal attendance');
  const toast = useToast();
  const [month, setMonth] = useState(monthKey());
  const [processing, setProcessing] = useState(false);
  const today = useApi(() => attendanceApi.myToday(), []);
  const history = useApi(() => attendanceApi.myMonth(month), [month]);

  const handleCheckIn = async (token) => {
    setProcessing(true);
    try {
      const record = await attendanceApi.checkIn(token);
      toast.success(`${capitalize(record.meal)} attendance marked for today.`);
      await Promise.all([today.refetch(), history.refetch({ silent: true })]);
    } catch (error) {
      toast.error(getErrorMessage(error), 'Check-in failed');
    } finally {
      setProcessing(false);
    }
  };

  const data = history.data;
  const summary = MEALS.map((meal) => ({
    name: capitalize(meal),
    present: data?.byMeal?.[meal]?.present || 0,
    absent: data?.byMeal?.[meal]?.absent || 0,
  }));

  return (
    <div>
      <PageHeader
        title="Meal attendance"
        subtitle="Scan the counter QR once per meal. Duplicate check-ins are blocked automatically."
        actions={
          <div className="flex items-center gap-2">
            <Input type="month" value={month} max={monthKey()} onChange={(e) => setMonth(e.target.value)} className="w-[170px]" />
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader title="Mark today’s meal" subtitle={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} icon={QrCode} />
          <div className="p-5">
            <QrCheckIn onDetected={handleCheckIn} processing={processing} />
          </div>
        </Card>

        <div className="space-y-4 xl:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard label="Meals marked" value={data?.presentCount ?? 0} hint={`in ${monthLabel(month)}`} icon={CalendarCheck} tone="brand" loading={history.loading} />
            <StatCard label="Attendance rate" value={`${data?.attendanceRate ?? 0}%`} hint="Against all meal slots this month" icon={CheckCircle2} tone="emerald" loading={history.loading} />
          </div>

          <Card>
            <CardHeader title="Today’s check-in status" subtitle="Live from the mess counter" />
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {MEALS.map((meal) => {
                const status = today.data?.meals?.find((m) => m.meal === meal);
                const meta = MEAL_META[meal];
                const checked = status?.checkedIn;
                return (
                  <div key={meal} className={`rounded-xl border p-3 ${checked ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-bold text-navy-900">{meta.emoji} {meta.label}</p>
                      {checked ? <Badge variant="green"><CheckCircle2 className="h-3 w-3" /> Marked</Badge> : <Badge variant="gray"><Clock3 className="h-3 w-3" /> Pending</Badge>}
                    </div>
                    <p className="mt-1 text-[10.5px] text-slate-400">
                      {formatTime(status?.menu?.startTime) || meta.time.split(' – ')[0]} – {formatTime(status?.menu?.endTime) || meta.time.split(' – ')[1]}
                    </p>
                    <p className="mt-1.5 line-clamp-1 text-[11px] text-slate-500">
                      {(status?.menu?.items || []).map((i) => i.name).join(', ') || 'Menu not published'}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <ChartCard title="Meal-wise attendance" subtitle={monthLabel(month)}>
          <MealBarChart data={summary} dataKey="present" height={240} />
        </ChartCard>

        <Card className="xl:col-span-2">
          <CardHeader title="Monthly meal breakdown" subtitle={`${data?.presentCount || 0} present · ${data?.absentCount || 0} absent`} icon={History} />
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {MEALS.map((meal) => {
              const present = data?.byMeal?.[meal]?.present || 0;
              const total = present + (data?.byMeal?.[meal]?.absent || 0);
              const rate = total ? Math.round((present / total) * 100) : 0;
              return (
                <div key={meal} className="rounded-xl bg-slate-50 p-3.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold capitalize text-navy-900">{MEAL_META[meal].emoji} {meal}</p>
                    <span className="text-[11px] font-bold text-brand-700">{rate}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400" style={{ width: `${rate}%` }} />
                  </div>
                  <p className="mt-1.5 text-[10.5px] text-slate-400">{present} marked meals</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mt-5 overflow-hidden">
        <CardHeader title="Day-wise attendance history" subtitle={`${monthLabel(month)} · ${data?.daily?.length || 0} days recorded`} />
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                {MEALS.map((meal) => <th key={meal}>{MEAL_META[meal].label}</th>)}
              </tr>
            </thead>
            <tbody>
              {(data?.daily || []).map((day) => (
                <tr key={day.date}>
                  <td className="whitespace-nowrap font-semibold text-navy-900">
                    {new Date(`${day.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {day.date === todayKey() && <span className="ml-2 text-[9.5px] font-bold uppercase text-brand-600">Today</span>}
                  </td>
                  {MEALS.map((meal) => (
                    <td key={meal}>
                      {day[meal] ? (
                        <StatusBadge status={day[meal]} />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-300"><XCircle className="h-3.5 w-3.5" /> Not marked</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {!history.loading && !data?.daily?.length && (
                <tr><td colSpan={5} className="py-10 text-center text-xs text-slate-400">No attendance recorded for this month yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {history.loading && <div className="p-6 text-center text-xs text-slate-400">Loading attendance…</div>}
      </Card>
    </div>
  );
}
