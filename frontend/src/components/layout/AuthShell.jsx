import { Link } from 'react-router-dom';
import { UtensilsCrossed, CheckCircle2, QrCode, PieChart, ShieldCheck, ArrowLeft } from 'lucide-react';

const POINTS = [
  { icon: QrCode, title: 'Scan. Eat. Done.', text: 'QR-based meal check-in with duplicate protection.' },
  { icon: PieChart, title: 'Numbers that matter', text: 'Live attendance, fee collection and kitchen stock.' },
  { icon: ShieldCheck, title: 'One mess, fully managed', text: 'Students, menus, complaints and payments in one place.' },
];

export default function AuthShell({ children, compact = false }) {
  return (
    <div className="flex min-h-screen bg-white">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-navy-950 p-10 text-white lg:flex xl:p-14">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-600/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-[26rem] w-[26rem] rounded-full bg-brand-500/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
            backgroundSize: '42px 42px',
          }}
        />

        <div className="relative">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[15px] font-extrabold tracking-tight">IIIT Mess</p>
              <p className="text-[11px] text-white/50">IIIT Bhubaneswar</p>
            </div>
          </Link>

          <div className="mt-16 max-w-md xl:mt-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Smart mess operations
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.12] tracking-tight xl:text-[44px]">
              Every meal,
              <br />
              <span className="bg-gradient-to-r from-brand-300 to-white bg-clip-text text-transparent">accounted for.</span>
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-white/60">
              The mess management platform for students, administrators and kitchen teams at IIIT Bhubaneswar.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {POINTS.map((point) => (
              <div key={point.title} className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
                  <point.icon className="h-4 w-4 text-brand-200" />
                </div>
                <div>
                  <p className="text-[13px] font-bold">{point.title}</p>
                  <p className="text-[12px] text-white/50">{point.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/10 pt-6 text-[11px] text-white/40">
          <span>© {new Date().getFullYear()} IIIT Bhubaneswar</span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {compact ? 'Secure sign-in' : 'Built for hostel life'}
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col lg:w-[54%]">
        <div className="flex items-center justify-between px-5 py-5 sm:px-10">
          <Link to="/login" className="inline-flex items-center gap-2 text-[12px] font-semibold text-slate-500 transition hover:text-navy-900">
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900">
              <UtensilsCrossed className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-extrabold text-navy-900">IIIT Mess</span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12 sm:px-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}
