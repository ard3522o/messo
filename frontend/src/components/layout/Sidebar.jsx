import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, UtensilsCrossed, X, LifeBuoy, Mail } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { NAV_BY_ROLE, ROLE_META, HOME_BY_ROLE } from '../../config/navigation';
import { Avatar } from '../ui';

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const nav = NAV_BY_ROLE[user.role] || [];
  const roleMeta = ROLE_META[user.role];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-[2px] lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 pb-4 pt-5">
          <button type="button" onClick={() => navigate(HOME_BY_ROLE[user.role])} className="flex items-center gap-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-navy-900 shadow-glow">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[15px] font-extrabold leading-tight tracking-tight text-navy-900">IIIT Mess</p>
              <p className="text-[11px] font-medium text-slate-400">Bhubaneswar</p>
            </div>
          </button>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-brand-600" />
          <span className="text-[11.5px] font-bold uppercase tracking-wider text-slate-500">{roleMeta.label} Portal</span>
        </div>

        <nav className="no-scrollbar flex-1 overflow-y-auto px-3 pb-3">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
          <div className="space-y-1">
            {nav.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose} className={({ isActive }) => clsx('nav-link group', isActive && 'nav-link-active')}>
                {({ isActive }) => (
                  <>
                    <item.icon className={clsx('h-[18px] w-[18px]', isActive ? 'text-white' : 'text-slate-400 group-hover:text-navy-700')} />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="px-4 pb-4">
          <div className="rounded-xl border border-slate-100 bg-gradient-to-br from-navy-50 to-brand-50/60 p-3.5">
            <div className="flex items-center gap-2 text-navy-800">
              <LifeBuoy className="h-4 w-4" />
              <p className="text-xs font-bold">Mess helpdesk</p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {user.role === 'student' ? 'Facing an issue with meals? Raise a complaint.' : 'Reach the mess office for escalations.'}
            </p>
            <a href="mailto:mess@iiit-bh.ac.in" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:underline">
              <Mail className="h-3 w-3" /> mess@iiit-bh.ac.in
            </a>
          </div>

          <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-slate-100 p-2.5">
            <Avatar name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12.5px] font-bold text-navy-900">{user.name}</p>
              <p className="truncate text-[11px] text-slate-400">{roleMeta.label}</p>
            </div>
            <button type="button" onClick={handleLogout} title="Sign out" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
