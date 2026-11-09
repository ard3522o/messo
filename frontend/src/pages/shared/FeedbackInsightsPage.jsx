import { useState } from 'react';
import { Star, MessageSquareHeart, TrendingUp, Tags } from 'lucide-react';
import { Card, CardHeader, DataTable, PageHeader, Rating, StatCard, Badge, Select } from '../../components/ui';
import { ChartCard, MealBarChart, RatingTrendChart, DonutChart, CHART_COLORS } from '../../components/charts';
import { feedbackApi } from '../../services/endpoints';
import useApi from '../../hooks/useApi';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { capitalize, formatDate } from '../../utils/format';

export default function FeedbackInsightsPage({ title = 'Feedback Insights', subtitle }) {
  useDocumentTitle(title);
  const [days, setDays] = useState(30);
  const { data, loading } = useApi(() => feedbackApi.summary(days), [days]);
  const [page, setPage] = useState(1);
  const list = useApi(() => feedbackApi.list({ page, limit: 8 }), [page]);

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row) => (
        <div>
          <p className="font-semibold text-navy-900">{row.isAnonymous ? 'Anonymous' : row.student?.name || '—'}</p>
          <p className="text-[11px] text-slate-400">{row.isAnonymous ? 'Identity hidden' : row.student?.studentId}</p>
        </div>
      ),
    },
    { key: 'meal', header: 'Meal', render: (row) => <Badge variant="blue">{capitalize(row.meal)}</Badge> },
    { key: 'rating', header: 'Rating', render: (row) => <Rating value={row.rating} showValue /> },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
    { key: 'comment', header: 'Comment', className: 'max-w-[320px]', render: (row) => <p className="line-clamp-2 text-[12.5px] text-slate-500">{row.comment || '—'}</p> },
  ];

  return (
    <div>
      <PageHeader
        title={title}
        subtitle={subtitle || 'Meal-wise ratings, student comments and quality trends across the mess.'}
        actions={<Select value={days} onChange={(e) => setDays(Number(e.target.value))} options={[{ value: 7, label: 'Last 7 days' }, { value: 30, label: 'Last 30 days' }, { value: 90, label: 'Last 90 days' }]} />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Average rating" value={`${data?.overall?.average || 0} / 5`} hint={`${data?.overall?.count || 0} responses`} icon={Star} tone="amber" loading={loading} />
        <StatCard label="Responses" value={data?.overall?.count || 0} hint={`Last ${days} days`} icon={MessageSquareHeart} tone="brand" loading={loading} />
        <StatCard label="Best rated meal" value={capitalize([...(data?.byMeal || [])].sort((a, b) => b.average - a.average)[0]?.meal || '—')} hint="Highest average score" icon={TrendingUp} tone="emerald" loading={loading} />
        <StatCard label="Feedback themes" value={data?.tags?.length || 0} hint="Distinct tags mentioned" icon={Tags} tone="purple" loading={loading} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <ChartCard title="Rating trend" subtitle="Daily average out of 5" className="xl:col-span-2" height={270}>
          <RatingTrendChart data={data?.trend || []} height={250} />
        </ChartCard>
        <Card>
          <CardHeader title="Meal-wise average" subtitle="Out of 5" />
          <div className="p-4">
            {(data?.byMeal || []).map((meal, i) => (
              <div key={meal.meal} className="mb-3 last:mb-0">
                <div className="mb-1 flex items-center justify-between text-xs font-semibold">
                  <span className="capitalize text-slate-600">{meal.meal}</span>
                  <span className="text-navy-900">{meal.average.toFixed(1)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${(meal.average / 5) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                </div>
                <p className="mt-0.5 text-[10px] text-slate-400">{meal.count} ratings</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <ChartCard title="Participation by meal" subtitle="Number of ratings">
          <MealBarChart data={data?.byMeal?.map((m) => ({ name: optimize(m.meal), count: m.count })) || []} dataKey="count" height={230} />
        </ChartCard>
        <ChartCard title="Most mentioned themes" subtitle="Across all responses">
          <DonutChart
            data={(data?.tags || []).map((t) => ({ name: t.tag, value: t.count }))}
            centerValue={data?.overall?.count || 0}
            centerLabel="responses"
            height={230}
          />
        </ChartCard>
        <Card className="p-5">
          <h3 className="section-title">Recent comments</h3>
          <div className="mt-3 space-y-3">
            {(data?.recent || []).slice(0, 4).map((item) => (
              <div key={item._id} className="rounded-xl bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <Rating value={item.rating} />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{capitalize(item.meal)}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-slate-600">{item.comment || 'No comment'}</p>
              </div>
            ))}
            {!data?.recent?.length && <p className="py-8 text-center text-xs text-slate-400">No comments yet.</p>}
          </div>
        </Card>
      </div>

      <Card className="mt-5 overflow-hidden">
        <CardHeader title="All feedback" subtitle={`Page ${page}`} />
        <DataTable
          columns={columns}
          rows={list.data?.data || []}
          loading={list.loading}
          emptyTitle="No feedback submitted yet"
          emptyDescription="Student ratings will appear here as they review their meals."
        />
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <p className="text-xs text-slate-400">{list.data?.meta?.total || 0} total responses</p>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn btn-secondary btn-sm disabled:opacity-40">Previous</button>
            <button type="button" disabled={page >= (list.data?.meta?.totalPages || 1)} onClick={() => setPage((p) => p + 1)} className="btn btn-secondary btn-sm disabled:opacity-40">Next</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

const optimize = (meal = '') => meal.charAt(0).toUpperCase() + meal.slice(1);
