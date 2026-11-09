import {
  LayoutDashboard,
  QrCode,
  CalendarDays,
  Star,
  UtensilsCrossed,
  FileBarChart,
  UserCircle,
} from 'lucide-react';

export const STUDENT_NAV = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/attendance', label: 'Meal Attendance', icon: QrCode },
  { to: '/student/menu', label: 'Weekly Menu', icon: CalendarDays },
  { to: '/student/profile', label: 'My Profile', icon: UserCircle },
];

export const ADMIN_NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/menus', label: 'Menu Manager', icon: UtensilsCrossed },
  { to: '/admin/feedback', label: 'Feedback Insights', icon: Star },
  { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
  { to: '/admin/profile', label: 'Profile', icon: UserCircle },
];

export const MANAGER_NAV = [
  { to: '/manager', label: 'Kitchen Dashboard', icon: LayoutDashboard, end: true },
  { to: '/manager/menu', label: "Today's Menu", icon: UtensilsCrossed },
  { to: '/manager/feedback', label: 'Student Feedback', icon: Star },
  { to: '/manager/reports', label: 'Reports', icon: FileBarChart },
  { to: '/manager/profile', label: 'Profile', icon: UserCircle },
];

export const NAV_BY_ROLE = { student: STUDENT_NAV, admin: ADMIN_NAV, manager: MANAGER_NAV };

export const HOME_BY_ROLE = { student: '/student', admin: '/admin', manager: '/manager' };

export const ROLE_META = {
  student: { label: 'Student', accent: 'from-brand-500 to-brand-700' },
  admin: { label: 'Mess Admin', accent: 'from-navy-700 to-navy-900' },
  manager: { label: 'Mess Manager', accent: 'from-emerald-500 to-emerald-700' },
};
