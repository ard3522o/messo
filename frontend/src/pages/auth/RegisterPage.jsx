import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import AuthShell from '../../components/layout/AuthShell';
import { Button, Input, Select } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import { DEPARTMENTS, HOSTELS, MEALS } from '../../utils/constants';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

const initial = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  studentId: '',
  hostel: '',
  roomNumber: '',
  department: '',
  year: '1',
  messType: 'veg',
};

export default function RegisterPage() {
  useDocumentTitle('Student registration');
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (event) => {
    setForm((f) => ({ ...f, [field]: event.target.value }));
    setErrors((e) => ({ ...e, [field]: '', form: '' }));
  };

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email';
    if (!/^[6-9]\d{9}$/.test(form.phone)) next.phone = 'Enter a valid 10-digit mobile number';
    if (!/^[A-Za-z0-9]{6,15}$/.test(form.studentId)) next.studentId = 'Student ID must be 6–15 letters/numbers';
    if (!form.hostel) next.hostel = 'Select your hostel';
    if (!form.roomNumber.trim()) next.roomNumber = 'Room number is required';
    if (!form.department) next.department = 'Select your department';
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return !Object.keys(next).length;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { confirmPassword, ...payload } = form;
      await register({ ...payload, year: Number(form.year) });
      toast.success('Account created. Your mess subscription is pending activation.');
      navigate('/student', { replace: true });
    } catch (error) {
      setErrors({ form: getErrorMessage(error) });
      toast.error(getErrorMessage(error), 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell compact>
      <div className="animate-fade-in">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-600">Student onboarding</p>
        <h2 className="mt-2 text-[28px] font-extrabold tracking-tight text-navy-900">Create your mess account</h2>
        <p className="mt-2 text-[13.5px] text-slate-500">
          Register once to manage meals, fees and complaints. The mess office activates your subscription.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-3.5" noValidate>
          {errors.form && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[12.5px] font-medium text-rose-700">
              {errors.form}
            </div>
          )}
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Input label="Full name" name="name" value={form.name} onChange={set('name')} error={errors.name} placeholder="Aarav Sharma" required />
            <Input label="Student ID" name="studentId" value={form.studentId} onChange={set('studentId')} error={errors.studentId} placeholder="23BCS1042" required />
          </div>
          <Input label="Email" type="email" name="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@iiit-bh.ac.in" required />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Input label="Mobile number" name="phone" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="98765 43210" maxLength={10} required />
            <Select label="Hostel" name="hostel" value={form.hostel} onChange={set('hostel')} error={errors.hostel} options={HOSTELS} placeholder="Select hostel" required />
          </div>
          <div className="grid gap-3.5 sm:grid-cols-3">
            <Input label="Room" name="roomNumber" value={form.roomNumber} onChange={set('roomNumber')} error={errors.roomNumber} placeholder="B-214" required />
            <Select label="Department" name="department" value={form.department} onChange={set('department')} error={errors.department} options={DEPARTMENTS} placeholder="Select" required className="sm:col-span-1" />
            <Select label="Year" name="year" value={form.year} onChange={set('year')} options={['1', '2', '3', '4', '5']} />
          </div>
          <Select label="Meal preference" name="messType" value={form.messType} onChange={set('messType')} options={[{ value: 'veg', label: 'Vegetarian' }, { value: 'non-veg', label: 'Non-vegetarian' }]} />
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Input label="Password" type="password" name="password" value={form.password} onChange={set('password')} error={errors.password} placeholder="Min. 6 characters" required />
            <Input label="Confirm password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} placeholder="Re-enter password" required />
          </div>

          <div className="rounded-xl bg-brand-50/70 p-3 text-[11.5px] leading-relaxed text-slate-600">
            <p className="flex items-center gap-1.5 font-bold text-brand-800">
              <CheckCircle2 className="h-3.5 w-3.5" /> Includes {MEALS.length} meals a day
            </p>
            <p className="mt-1 text-slate-500">Breakfast, lunch, snacks and dinner. Mess fees are billed monthly by the admin office.</p>
          </div>

          <Button type="submit" variant="indigo" size="lg" fullWidth loading={submitting}>
            {submitting ? 'Creating account…' : 'Create account'} {!submitting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </form>

        <p className="mt-5 text-center text-[13px] text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-bold text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
