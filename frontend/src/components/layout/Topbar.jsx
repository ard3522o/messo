import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, Megaphone, UserCircle, CalendarDays, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NAV_BY_ROLE, ROLE_META, HOME_BY_ROLE } from '../../config/navigation';
import { announcementApi } from '../../services/endpoints';
import { Avatar, Badge } from '../ui';
import { timeAgo } from '../../utils/format';
import { useTheme } from '../../context/ThemeContext';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const onClick = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotificationsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    announcementApi
      .list({ limit: 5, audience: user?.role === 'student' ? 'students' : 'all' })
      .then((res) => setAnnouncements(res.data))
      .catch(() => setAnnouncements([]));
  }, [user?.role]);

  const nav = NAV_BY_ROLE[user.role] || [];
  const active = nav.find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to))) || nav[0];
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-lg">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onMenuClick} className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{ROLE_META[user.role].label}</p>
            <h2 className="truncate text-[15px] font-extrabold text-navy-900">{active?.label || 'Dashboard'}</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-500 md:inline-flex">
            <CalendarDays className="h-3.5 w-3.5 text-brand-500" />
            {today}
          </span>

          <button
            type="button"
            onClick={toggleTheme}
            className="theme-toggle rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotificationsOpen((o) => !o)}
              className="relative rounded-lg border border-transparent p-2 text-slate-500 transition hover:border-slate-200 hover:bg-slate-50"
              aria-label="Announcements"
            >
              <Bell className="h-[18px] w-[18px]" />
              {announcements.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-white" />}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-12 w-[330px] max-w-[calc(100vw-2rem)] animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Announcements</p>
                  <Badge variant="blue">{announcements.length} new</Badge>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {announcements.length === 0 ? (
                    <p className="px-4 py-8 text-center text-xs text-slate-400">No announcements right now.</p>
                  ) : (
                    announcements.map((a) => (
                      <button
                        key={a._id}
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          setSelectedAnnouncement(a);
                        }}
                        className="flex w-full gap-3 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50"
                      >
                        <div className="icon-tile h-8 w-8 rounded-lg bg-brand-50 text-brand-600">
                          <Megaphone className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[12.5px] font-bold text-navy-900">{a.title}</p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{a.content}</p>
                          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{timeAgo(a.publishedAt)}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2 transition hover:bg-slate-50"
            >
              <Avatar name={user.name} size="xs" />
              <div className="hidden text-left sm:block">
                <p className="max-w-[120px] truncate text-[12px] font-bold text-navy-900">{user.name}</p>
                <p className="text-[10px] text-slate-400">{ROLE_META[user.role].label}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 w-56 animate-fade-in overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="text-sm font-bold text-navy-900">{user.name}</p>
                  <p className="truncate text-xs text-slate-400">{user.email}</p>
                </div>
                <div className="p-1.5">
                  <Link
                    to={`${HOME_BY_ROLE[user.role]}/profile`}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <UserCircle className="h-4 w-4 text-slate-400" /> My profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {selectedAnnouncement && createPortal((
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedAnnouncement(null); }}>
          <section className="w-full max-w-lg animate-fade-in rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="announcement-title">
            <div className="flex items-start justify-between gap-4">
              <div className="icon-tile h-10 w-10 rounded-xl bg-brand-50 text-brand-600"><Megaphone className="h-5 w-5" /></div>
              <button type="button" onClick={() => setSelectedAnnouncement(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close announcement"><X className="h-4 w-4" /></button>
            </div>
            <h3 id="announcement-title" className="mt-4 text-lg font-extrabold text-navy-900">{selectedAnnouncement.title}</h3>
            <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{timeAgo(selectedAnnouncement.publishedAt)}</p>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{selectedAnnouncement.content}</p>
          </section>
        </div>
      ), document.body)}
    </header>
  );
}
