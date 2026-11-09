import { useState } from 'react';
import { BadgeCheck, Lock, Mail, MapPin, Phone, School, UserCircle, CalendarDays, ShieldCheck } from 'lucide-react';
import { Avatar, Button, Card, CardHeader, Input, PageHeader, Select, StatusBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authApi, studentApi } from '../../services/endpoints';
import { getErrorMessage } from '../../services/api';
import { ROLE_META } from '../../config/navigation';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { formatDate } from '../../utils/format';

export default function ProfilePage() {
  useDocumentTitle('My profile');
  const { user, student, setUser, refresh } = useAuth();
  const toast = useToast();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || student?.phone || '',
  });
  const [studentForm, setStudentForm] = useState({
    messType: student?.messType || 'veg',
    dietaryPreference: student?.dietaryPreference || 'veg',
    roomNumber: student?.roomNumber || '',
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [savingStudent, setSavingStudent] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({ name: profileForm.name, phone: profileForm.phone });
      setUser(updated);
      toast.success('Profile details updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const saveStudent = async (event) => {
    event.preventDefault();
    setSavingStudent(true);
    try {
      await studentApi.updateMe(studentForm);
      await refresh();
      toast.success('Mess preferences updated');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingStudent(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      <PageHeader title="My profile" subtitle="Manage your personal details, mess preferences and account security." />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5">
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-navy-900 via-navy-800 to-brand-700" />
            <div className="px-5 pb-5">
              <div className="-mt-9 flex items-end justify-between">
                <Avatar name={user?.name} size="xl" className="ring-4 ring-white" />
                <StatusBadge status={student?.subscriptionStatus || 'active'} />
              </div>
              <h2 className="mt-3 text-lg font-extrabold text-navy-900">{user?.name}</h2>
              <p className="text-[12.5px] text-slate-500">{ROLE_META[user?.role]?.label}</p>

              <div className="mt-4 space-y-2.5 text-[12.5px]">
                <p className="flex items-center gap-2 text-slate-600"><Mail className="h-4 w-4 text-slate-400" /> {user?.email}</p>
                <p className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4 text-slate-400" /> {user?.phone || student?.phone || '—'}</p>
                {student && (
                  <>
                    <p className="flex items-center gap-2 text-slate-600"><BadgeCheck className="h-4 w-4 text-slate-400" /> {student.studentId}</p>
                    <p className="flex items-center gap-2 text-slate-600"><MapPin className="h-4 w-4 text-slate-400" /> {student.hostel} · {student.roomNumber}</p>
                    <p className="flex items-center gap-2 text-slate-600"><School className="h-4 w-4 text-slate-400" /> {student.department} · Year {student.year}</p>
                  </>
                )}
                <p className="flex items-center gap-2 text-slate-600"><CalendarDays className="h-4 w-4 text-slate-400" /> Member since {formatDate(student?.joinedOn || user?.createdAt)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-navy-900">
              <ShieldCheck className="h-4 w-4 text-brand-600" />
              <h3 className="text-sm font-bold">Account security</h3>
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
              Change your password regularly. Sessions expire after 7 days.
            </p>
            <form onSubmit={savePassword} className="mt-4 space-y-3">
              <Input label="Current password" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))} required />
              <Input label="New password" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))} placeholder="Min. 6 characters" required />
              <Input label="Confirm new password" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))} required />
              <Button type="submit" variant="primary" icon={Lock} loading={savingPassword} fullWidth>Update password</Button>
            </form>
          </Card>
        </div>

        <div className="space-y-5 xl:col-span-2">
          <Card>
            <CardHeader title="Personal details" subtitle="Your name and contact number" icon={UserCircle} />
            <form onSubmit={saveProfile} className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} required />
                <Input label="Email address" value={user?.email || ''} disabled hint="Contact the mess office to change your registered email." />
                <Input label="Mobile number" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} maxLength={10} required />
                <Input label="Role" value={ROLE_META[user?.role]?.label || ''} disabled />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="indigo" loading={saving}>Save changes</Button>
              </div>
            </form>
          </Card>

          {student ? (
            <Card>
              <CardHeader title="Mess preferences" subtitle="Dietary preference and room allocation" />
              <form onSubmit={saveStudent} className="space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Select label="Meal preference" value={studentForm.messType} onChange={(e) => setStudentForm((f) => ({ ...f, messType: e.target.value, dietaryPreference: e.target.value }))} options={[{ value: 'veg', label: 'Vegetarian' }, { value: 'non-veg', label: 'Non-vegetarian' }]} />
                  <Select label="Dietary preference" value={studentForm.dietaryPreference} onChange={(e) => setStudentForm((f) => ({ ...f, dietaryPreference: e.target.value }))} options={[{ value: 'veg', label: 'Vegetarian' }, { value: 'non-veg', label: 'Non-vegetarian' }, { value: 'vegan', label: 'Vegan' }]} />
                  <Input label="Room number" value={studentForm.roomNumber} onChange={(e) => setStudentForm((f) => ({ ...f, roomNumber: e.target.value }))} />
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-[11.5px] text-slate-500">
                  Hostel and department changes are managed by the mess admin office.
                </div>
                <div className="flex justify-end">
                  <Button type="submit" variant="primary" loading={savingStudent}>Update preferences</Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card className="p-5">
              <h3 className="section-title">Administrative access</h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
                This account has {ROLE_META[user?.role]?.label?.toLowerCase()} privileges. Student records, menus, payments and kitchen
                operations are managed from the workspace navigation.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
