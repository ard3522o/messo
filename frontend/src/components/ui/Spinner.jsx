import { Loader2 } from 'lucide-react';

export default function Spinner({ className = 'h-6 w-6' }) {
  return <Loader2 className={`${className} animate-spin text-brand-600`} />;
}

export function LoadingState({ label = 'Loading…', className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-14 ${className}`}>
      <Spinner className="h-7 w-7" />
      <p className="text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F8FC]">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-900 shadow-glow">
          <Loader2 className="h-7 w-7 animate-spin text-white" />
        </div>
        <p className="text-sm font-semibold text-slate-500">Loading your mess dashboard…</p>
      </div>
    </div>
  );
}
