import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute, { PublicOnlyRoute } from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAttendance from './pages/student/StudentAttendance';
import StudentMenu from './pages/student/StudentMenu';
import ProfilePage from './pages/shared/ProfilePage';
import ReportsPage from './pages/shared/ReportsPage';
import FeedbackInsightsPage from './pages/shared/FeedbackInsightsPage';
import NotFoundPage from './pages/NotFoundPage';
import './index.css';

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? ({ student: '/student', admin: '/admin', manager: '/manager' }[user.role] || '/login') : '/login'} replace />;
}

function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/student" element={<ProtectedRoute roles={['student']} />}>
            <Route index element={<StudentDashboard />} />
            <Route path="attendance" element={<StudentAttendance />} />
            <Route path="menu" element={<StudentMenu />} />
            <Route path="weekly-menu" element={<StudentMenu />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
            <Route index element={<ReportsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="menus" element={<StudentMenu />} />
            <Route path="feedback" element={<FeedbackInsightsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="/manager" element={<ProtectedRoute roles={['manager']} />}>
            <Route index element={<ReportsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="menu" element={<StudentMenu />} />
            <Route path="feedback" element={<FeedbackInsightsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
      </Route>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider><ToastProvider><App /></ToastProvider></ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
