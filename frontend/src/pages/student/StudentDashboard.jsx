import { Link } from 'react-router-dom';
import {
  ArrowUpRight, CalendarDays, CreditCard, QrCode, Star, UtensilsCrossed, Megaphone, Wallet, ChevronRight, TrendingUp, MessageSquareWarning,
} from 'lucide-react';
import { Badge, Button, Card, CardHeader, PageHeader, Rating, StatCard, StatusBadge, Tabs } from '../../components/ui';
import TodayMeals from '../../components/common/TodayMeals';
import { ChartCard, MealBarChart } from '../../components/charts';
import { analyticsApi } from '../../services/endpoints';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { capitalize, currency, formatDate, timeAgo, todayKey } from '../../utils/format';
import { MEALS, MEAL_META } from '../../utils/constants';

export default function StudentDashboard() {
  useDocumentTitle('Student dashboard');
  const { student } = useAuth();
  const { data, loading } = useApi(() => analyticsApi.student(), []);

  const attendance = data?.attendance;
  const latestPending = (data?.payments || []).find((p) => p.status !== 'paid');
  const mealParticipation = MEALS.map((meal) => ({
    name: capitalize(meal),
    count: attendance?.byMeal?.[meal]?.present || 0,
  }));

  return (
    <div>
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-navy-950 px-6 py-7 text-white shadow-card sm:px-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="green" className="bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
                {student?.subscriptionStatus === 'active' ? 'Mess subscription active' : 'Subscription inactive'}
              </Badge>
              <span className="text-[11px] font-semibold text-white/50">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            </div>
            <h1 className="mt-3 text-[24px] font-extrabold tracking-tight sm:text-[28px]">Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {data?.student?.name?.split(' ')[0] || 'student'} 👋</h1>
            <p className="mt-1.5 max-w-lg text-[13px] leading-relaxed text-white/60">
              {student?.hostel} · Room {student?.roomNumber} · {student?.department} · Mess card {student?.messCardId}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/student/attendance">
              <Button variant="indigo" icon={QrCode}>Scan meal QR</Button>
            </Link>
            <Link to="/student/menu">
              <Button variant="secondary" icon={CalendarDays} className="border-white/15 bg-white/10 text-white hover:bg-white/15 hover:text-white">View menu</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Attendance this month" value={`${attendance?.rate ?? 0}%`} hint={`${attendance?.presentCount ?? 0} meals marked`} icon={QrCode} tone="brand" loading={loading} />
        <StatCard label="Mes fees outstanding" value={currency(data?.outstanding)} hint={latestPending ? `${latestPending.month} invoice pending` : 'All dues cleared'} icon={Wallet} tone={data?.outstanding ? 'rose' : 'emerald'} loading={loading} />
        <StatCard label="Your average rating" value={`${data?.feedback?.average || 0} / 5`} hint={`${data?.feedback?.count || 0} meals rated`} icon={Star} tone="amber" loading={loading} />
        <StatCard label="Open complaints" value={(data?.complaints || []).filter((c) => ['open', 'in_progress'].includes(c.status)).length} hint="Tracked by the mess office" icon={MessageSquareWarning} tone="purple" loading={loading} />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="section-title">Today’s mess menu</h2>
            <p className="text-xs text-slate-400">Mark attendance at the counter by scanning the meal QR.</p>
          </div>
          <Link to="/student/attendance" className="flex items-center gap-1 text-[12px] font-bold text-brand-700 hover:underline">
            Check in <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <TodayMeals menu={data?.menu} records={attendance?.today || []} />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <ChartCard
          title="Meal participation"
          subtitle="Meals marked this month"
          className="xl:col-span-2"
          action={
            <Link to="/student/attendance" className="rounded-lg px-2 py-1 text-[11px] font-bold text-brand-700 hover:bg-brand-50">
              Full history
            </Link>
          }
        >
          <MealBarChart data={mealParticipation} dataKey="count" height={250} />
        </ChartCard>

        <Card>
          <CardHeader
            title="Fee status"
            subtitle={latestPending ? 'Action required' : 'You are all caught up'}
            icon={CreditCard}
            action={<Link to="/student/payments" className="text-[11px] font-bold text-brand-700 hover:underline">View all</Link>}
          />
          <div className="p-5">
            {latestPending ? (
              <>
                <div className="rounded-xl bg-rose-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-rose-500">{latestPending.month}</span>
                    <StatusBadge status={latestPending.status} />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-navy-900">{currency(latestPending.amount)}</p>
                  <p className="mt-0.5 text-[11.5px] text-slate-500">Due {formatDate(latestPending.dueDate || `${latestPending.month}-10`)}</p>
                  <Link to="/student/payments">
                    <Button variant="danger" size="sm" className="mt-3 w-full">Pay now</Button>
                  </Link>
                </div>
                <div className="mt-3 space-y-2">
                  {(data?.payments || []).slice(0, 3).map((p) => (
                    <div key={p._id} className="flex items-center justify-between text-[12px]">
                      <span className="text-slate-500">{p.month}</span>
                      <div className="flex items-center gap-2"><span className="font-bold text-slate-700">{currency(p.amount)}</span><StatusBadge status={p.status} /></div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-4 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <Wallet className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-bold text-navy-900">No pending dues</p>
                <p className="mt-1 text-[12px] text-slate-500">Your mess fees are up to date. Receipts are available anytime.</p>
                <Link to="/student/payments"><Button variant="secondary" size="sm" className="mt-3">View payment history</Button></Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader title="This week’s menu" subtitle="Breakfast, lunch, snacks and dinner" icon={UtensilsCrossed} action={<Link to="/student/menu" className="text-[11px] font-bold text-brand-700 hover:underline">Full calendar</Link>} />
          <div className="divide-y divide-slate-100">
            {(data?.weekMenu || []).slice(0, 5).map((menu) => (
              <div key={menu._id} className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="w-28 shrink-0">
                  <p className="text-[11.5px] font-bold text-navy-900">{new Date(`${menu.date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                  {menu.date === todayKey() && <span className="text-[9.5px] font-bold uppercase tracking-wide text-brand-600">Today</span>}
                </div>
                <div className="flex flex-1 flex-wrap gap-1.5">
                  {MEALS.map((meal) => (
                    <span key={meal} className="rounded-md bg-slate-50 px-2 py-1 text-[10.5px] font-medium text-slate-500 ring-1 ring-slate-100">
                      {MEAL_META[meal].emoji} {(menu.meals?.[meal]?.items || []).slice(0, 2).map((i) => i.name).join(', ') || '—'}
                    </span>
                  ))}
                </div>
                <ChevronRight className="hidden h-4 w-4 text-slate-300 sm:block" />
              </div>
            ))}
            {!data?.weekMenu?.length && <p className="px-5 py-10 text-center text-xs text-slate-400">Menu for this week is not published yet.</p>}
          </div>
        </Card>

        <Card>
          <CardHeader title="Announcements" subtitle="From the mess office" icon={Megaphone} action={<Link to="/student/announcements" className="text-[11px] font-bold text-brand-700 hover:underline">All</Link>} />
          <div className="divide-y divide-slate-100">
            {(data?.announcements || []).slice(0, 3).map((a) => (
              <div key={a._id} className="px-5 py-3.5">
                <div className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <div>
                    <p className="text-[12.5px] font-bold leading-snug text-navy-900">{a.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{a.content}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{timeAgo(a.publishedAt)}</p>
                  </div>
                </div>
              </div>
            ))}
            {!data?.announcements?.length && <p className="px-5 py-10 text-center text-xs text-slate-400">No announcements.</p>}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Rate a meal', desc: 'Tell the kitchen how today tasted', icon: Star, to: '/student/feedback', tone: 'bg-amber-50 text-amber-600' },
          { label: 'Raise a complaint', desc: 'Quality, hygiene or service issues', icon: MessageSquareWarning, to: '/student/complaints', tone: 'bg-rose-50 text-rose-600' },
          { label: 'View attendance', desc: 'Monthly check-in history and stats', icon: TrendingUp, to: '/student/attendance', tone: 'bg-brand-50 text-brand-600' },
        ].map((action) => (
          <Link key={action.label} to={action.to} className="card card-hover flex items-center gap-3 p-4">
            <div className={`icon-tile ${action.tone}`}><action.icon className="h-5 w-5" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-bold text-navy-900">{action.label}</p>
              <p className="truncate text-[11px] text-slate-400">{action.desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300" />
          </Link>
        ))}
      </div>
    </div>
  );
}
