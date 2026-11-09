import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import AuthShell from '../../components/layout/AuthShell';
import { Button } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import { HOME_BY_ROLE } from '../../config/navigation';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const DEMO_ACCOUNTS = [
  { role: 'Student', email: 'student@iiit-bh.ac.in', password: 'Student@123' },
  { role: 'Admin', email: 'admin@iiit-bh.ac.in', password: 'Admin@123' },
  { role: 'Manager', email: 'manager@iiit-bh.ac.in', password: 'Manager@123' },
];

export default function LoginPage() {
  useDocumentTitle('Sign in');
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (event) => {
    setForm((f) => ({ ...f, [field]: event.target.value }));
    setErrors((e) => ({ ...e, [field]: '', form: '' }));
  };

  const validate = () => {
    const next = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (!form.password) next.password = 'Password is required';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await login(form.email.trim(), form.password);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const fallback = HOME_BY_ROLE[user.role] || '/';
      navigate(location.state?.from || fallback, { replace: true });
    } catch (error) {
      setErrors({ form: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const useDemo = (account) => {
    setForm({ email: account.email, password: account.password });
    setErrors({});
  };

  return (
    <AuthShell>
      <div className="animate-fade-in">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">Welcome back</p>
        <h2 className="mt-2 text-[28px] font-extrabold tracking-tight text-navy-900">Sign in to your mess account</h2>
        <p className="mt-2 text-[13.5px] text-slate-500">Use your IIIT Bhubaneswar credentials to continue.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          {errors.form && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-medium text-rose-700">
              {errors.form}
            </div>
          )}

          <div>
            <label htmlFor="email" className="label">Email address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@iiit-bh.ac.in"
                className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
              />
            </div>
            {errors.email && <p className="help">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={set('password')}
                placeholder="Enter your password"
                className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="help">{errors.password}</p>}
          </div>

          <Button type="submit" variant="indigo" size="lg" fullWidth loading={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'} {!submitting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        {import.meta.env.DEV && <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" /> Demo accounts — click to fill
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                type="button"
                onClick={() => useDemo(account)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
              >
                {account.role}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10.5px] text-slate-400">For a new local database, run <code className="font-semibold">npm run seed:demo</code> in <code className="font-semibold">backend</code> first. This keeps existing records. Use <code className="font-semibold">npm run seed:demo:reset</code> only to reset these demo passwords.</p>
        </div>}

        <p className="mt-6 text-center text-[13px] text-slate-500">
          New student?{' '}
          <Link to="/register" className="font-bold text-brand-700 hover:underline">
            Create your mess account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
